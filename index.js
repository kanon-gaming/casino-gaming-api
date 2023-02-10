//JWT
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const http = require("http");

//HTTP
const express = require("express");
const app = express();

//SQL
var config = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  server: process.env.SERVER,
  port: parseInt(process.env.PORT),
  database: process.env.DATABASE,
  trustServerCertificate: true,
};

const sql = require("mssql");

sql
  .connect(config)
  .then((conn) => {})
  .catch((err) => {});

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.json({ message: "OK!" });
});

//authentication
app.post("/login", (req, res, next) => {
  if (req.body.user === "luiz" && req.body.password === "123") {
    const id = 1;
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: "7d",
    });
    return res.json({ auth: true, token: token });
  }

  res.status(500).json({ message: "Login inválido!" });
});

//register
app.post("/register", (req, res, next) => {
  
  //Validations
  let erros = [];
  if (!req.body.email) {
    erros.push("Please provide a email");
  }
  if (req.body.email && req.body.email.length > 150) {
    erros.push("Email must contain a maximum of 150 characters");
  }
  if (!req.body.name) {
    erros.push("Please provide a name");
  }
  if (req.body.name && req.body.name.length > 150) {
    erros.push("Namel must contain a maximum of 200 characters");
  }
  if (!req.body.password) {
    erros.push("Please provide a password");
  }
  if (req.body.name && req.body.name.length > 15) {
    erros.push("Password must contain a maximum of 15 characters");
  }
  if (req.body.password && !req.body.confirmpassword) {
    erros.push("Confirm password field must be equals to password");
  }



  let query = "";

  if (req.body.email === "luiz" && req.body.password === "123") {
    const id = 1;
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: "7d",
    });
    return res.json({ auth: true, token: token });
  }

  res.status(500).json({ message: "Login inválido!" });
});

//logout
app.post("/logout", function (req, res) {
  res.json({ auth: false, token: null });
});

function verifyJWT(req, res, next) {
  const token = req.headers["x-access-token"];
  if (!token)
    return res.status(401).json({ auth: false, message: "No token provided." });

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err)
      return res
        .status(500)
        .json({ auth: false, message: "Failed to authenticate token." });

    req.userId = decoded.id;
    next();
  });
}

const server = http.createServer(app);
server.listen(2002);
