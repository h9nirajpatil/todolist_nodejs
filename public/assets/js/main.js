var content1 = document.getElementById("content1");
var content2 = document.getElementById("content2");
var content3 = document.getElementById("content3");
var btn1 = document.getElementById("btn1");
var btn2 = document.getElementById("btn2");
var btn3 = document.getElementById("btn3");
function openHTML() {
  content1.style.transform = "translateX(0)";
  content2.style.transform = "translate(100%)";
  content3.style.transform = "translate(100%)";
  btn1.style.backgroundImage =
    "linear-gradient(to right, #0fd850 0%, #f9f047 100%)";
  btn2.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
  btn3.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
}
function openCSS() {
  content1.style.transform = "translateX(100%)";
  content2.style.transform = "translateX(0)";
  content3.style.transform = "translateX(100%)";
  btn2.style.backgroundImage =
    "linear-gradient(to right, #0fd850 0%, #f9f047 100%)";
  btn1.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
  btn3.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
}
function openJAVASCRIPT() {
  content1.style.transform = "translateX(100%)";
  content2.style.transform = "translateX(100%)";
  content3.style.transform = "translateX(0)";
  btn3.style.backgroundImage =
    "linear-gradient(to right, #0fd850 0%, #f9f047 100%)";
  btn1.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
  btn2.style.backgroundImage =
    "linear-gradient(to right, #ffff 0%, #ffff 100%)";
}
