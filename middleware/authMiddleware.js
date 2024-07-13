const isAuth = (req, res, next) => {
  console.log("hi", req.session);
  if (req.session.isAuth) {
    next();
  } else {
    return res.status(401).json("Session expired, please login again.");
  }
};

module.exports = isAuth;
