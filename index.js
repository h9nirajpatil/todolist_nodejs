const express = require("express");
require("dotenv").config();
const clc = require("cli-color");

//mangoose
const mangoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);

//file import
const { userDataValidation, isEmailRgex } = require("./utils/authUtils");
const userModel = require("./models/userModel");
const isAuth = require("./middleware/authMiddleware");
const todoDataValidation = require("./utils/blogUtils");
const todoModel = require("./models/todoModel");
const ratelimiting = require("./middleware/rateLimiting");

//constants
const app = express();
const PORT = process.env.PORT;
const store = new mongodbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

//dbconncetion
mangoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(clc.yellowBright.bold("mongodb connected successfully"));
  })
  .catch((err) => console.log(clc.redBright.bold(err)));

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // body parser url encoded
app.use(express.json()); // body parser json formate
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET_KEY,
    store: store,
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  return res.render("Home.ejs");
});

app.get("/test", (req, res) => {
  return res.render("test.ejs");
});

//login get method
app.get("/login", (req, res) => {
  return res.render("loginPage.ejs");
});

app.post("/signup", (req, res) => {
  return res.render("registerPage");
});
app.post("/signin", (req, res) => {
  return res.render("loginPage");
});

app.post("/login", async (req, res) => {
  const { loginId, password } = req.body;
  //   console.log(req.body);
  if (!loginId || !password) {
    return res.status(400).json("Missing Login Credentials.");
  }
  if (typeof loginId !== "string") {
    return res.status(400).json("LoginId is not a String");
  }
  if (typeof password !== "string") {
    return res.status(400).json("Password is not a String");
  }

  //find the user from db
  try {
    let userDb = {};
    if (isEmailRgex({ key: loginId })) {
      userDb = await userModel.findOne({ email: loginId });
      console.log("Find user with email");
    } else {
      userDb = await userModel.findOne({ username: loginId });
      console.log("Find user with username");
    }
    console.log(userDb);
    if (!userDb) {
      return res.status(400).json("User not found, please register first.");
    }

    //compare the password
    console.log(password, userDb.password);
    const isMatched = await bcrypt.compare(password, userDb.password);
    console.log(isMatched);
    if (!isMatched) {
      return res.status(400).json("Incorrect password!");
    }

    //sessions base authentication
    console.log(req.session);
    req.session.isAuth = true;
    req.session.user = {
      userId: userDb._id,
      username: userDb.username,
      email: userDb.email,
    };

    return res.redirect("/dashboard");
  } catch (error) {
    return res.status(500).json(console.error());
  }
});

// register post method
app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, username, password } = req.body;
  //data validation
  try {
    await userDataValidation({ email, username, name, password });
  } catch (error) {
    return res.status(400).json(error);
  }

  //email and username should be uniquie
  const userEmailExit = await userModel.findOne({ email: email });
  console.log("line 54", userEmailExit);
  if (userEmailExit) {
    return res.status(400).json("Email already exits.");
  }

  //email and username should be uniquie
  const userUserNameExit = await userModel.findOne({ username: username });
  console.log("line 61", userUserNameExit);
  if (userUserNameExit) {
    return res.status(400).json("Username already exits.");
  }

  //encrpyt
  const hashedPassword = await bcrypt.hash(
    password,
    parseInt(process.env.SALT)
  );

  //store with in db
  const userObj = new userModel({
    name,
    email,
    username,
    password: hashedPassword,
  });
  // const userDb = await userObj.create({name, email, usernam, password});
  try {
    const userDb = await userObj.save();
    return res.redirect("/login");
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
});

// register get method
app.get("/signup", (req, res) => {
  return res.render("registerPage.ejs");
});

app.get("/dashboard", isAuth, (req, res) => {
  console.log("Dashboard api");
  return res.render("dashboardPage");
});

app.post("/logout", isAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send({
        status: 500,
        message: `Logout unsuccessfully`,
      });
    }

    return res.send({
      status: 200,
      message: `Logout successfully`,
    });
  });
});

// console.log(process.env);

// To Do API's
// API create/add todo list
app.post("/create-item", isAuth, ratelimiting, async (req, res) => {
  const todo = req.body.todo;
  const username = req.session.user.username;

  try {
    await todoDataValidation({ todo });
  } catch (error) {
    return res.status(400).json(error);
  }

  const userObj = new todoModel({
    todo: todo,
    username: username,
  });

  try {
    const todoDb = await userObj.save();

    return res.status(201).json({
      message: "Todo created successfully",
      data: todoDb,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
});

// API read todo list ? skip = 5
app.get("/read-item", isAuth, async (req, res) => {
  const username = req.session.user.username;
  const SKIP = Number(req.query.skip) || 0;
  const LIMIT = 5;
  // console.log(SKIP);
  try {
    // const todoDb = await todoModel.find({ username: username });
    //   console.log(todoDb)

    //mongodb aggregate method
    // pagination(skip,limit) , match
    const todoDb = await todoModel.aggregate([
      {
        $match: { username: username },
      },
      {
        $skip: SKIP,
      },
      {
        $limit: LIMIT,
      },
    ]);
    console.log(todoDb);

    if (SKIP === 0 && todoDb.length === 0) {
      return res.send({
        status: 204,
        message: "No todo  found.",
      });
    } else if (SKIP > 0 && todoDb.length === 0) {
      // Case when no more data is found on subsequent loads
      return res.send({
        status: 204,
        message: "No more data in database.",
      });
    }

    return res.send({
      status: 200,
      message: "read success!",
      data: todoDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

// API edit/update todo list
app.post("/edit-item", isAuth, async (req, res) => {
  const newData = req.body.newData;
  const todoId = req.body.todoId;
  const username = req.session.user.username;

  if (!todoId) return res.status(400).json("Todo id is missing.");

  try {
    await todoDataValidation({ todo: newData });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }

  try {
    const todoDb = await todoModel.findOne({ _id: todoId });
    console.log(todoDb);

    if (!todoDb) {
      return res.send({
        status: 400,
        message: `todo not found with this id : ${todoId}`,
      });
    }
    // check the owner ship
    console.log(username, todoDb.username);
    if (username != todoDb.username) {
      return res.send({
        status: 403,
        message: "not allowed to edit todo.",
      });
    }

    //update the todo indb
    const todoDbPrev = await todoModel.findOneAndUpdate(
      { _id: todoId },
      { todo: newData }
    );

    return res.send({
      status: 200,
      message: "Todo updated successfully.",
      data: todoDbPrev,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      errro: error,
    });
  }

  //   console.log(newData, todoId);
  //   return res.send("all ok");
});

//API delete todo list
app.post("/delete-item", isAuth, async (req, res) => {
  const todoId = req.body.todoId;
  const username = req.session.user.username;

  if (!todoId) return res.status(400).json("Todo id is missing");

  try {
    const todoDb = await todoModel.findOne({ _id: todoId });

    if (!todoDb) {
      return res.send({
        status: 400,
        message: `todo not found with this id : ${todoId}`,
      });
    }

    //check the ownership
    if (username !== todoDb.username) {
      return res.send({
        status: 403,
        message: "not allowed to delete the todo",
      });
    }

    //update the todo in db
    const todoDbPrev = await todoModel.findOneAndDelete({ _id: todoId });

    return res.send({
      status: 200,
      message: "Todo deleted sucecssfully",
      data: todoDbPrev,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      errro: error,
    });
  }
});

//local server
app.listen(PORT, () => {
  console.log(clc.yellowBright.bold(`server is running out`));
  console.log(clc.yellowBright.underline(`http://localhost:${PORT}/`));
});
