//JWT
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const http = require("http");

//HTTP
const express = require("express");
const app = express();
var cors = require("cors");

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
  .then((conn) => (global.conn = conn))
  .catch((err) => {});

const corsOptions = {
  origin: '*',
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
};

app.use(cors(corsOptions));

const bodyParser = require("body-parser");
app.use(bodyParser.json());

// OK SERVER
app.get("/", (req, res, next) => {
  res.json({ message: "OK!" });
});

//authentication
app.post("/login", (req, res, next) => {
  let messages = [];
  let pool = global.conn.request();

  pool.input("email", sql.VarChar, req.body.email);
  pool.input("password", sql.VarChar, req.body.password);

  let query =
    "SELECT U_Id [id], U_Name [name], U_Email [email] FROM K_Users WHERE U_Email = @email AND U_Password = @password";

  pool
    .query(query)
    .then(function (results) {
      if (results.recordset.length > 0) {
        let user = {
          id: results.recordset[0].id,
          name: results.recordset[0].name,
          email: results.recordset[0].email,
          token: "",
        };

        const token = jwt.sign(user, process.env.SECRET, {
          expiresIn: "7d",
        });
        user.token = token;

        return res.json({ user: user, messages: messages, valid: true });
      } else {
        messages.push("Email or password incorrect!");
        res.status(200).json({ messages: messages, valid: false });
      }
    })
    .catch(function (err) {
      messages.push("Something happened, contact your system administrator!");
      res.status(200).json({ messages: messages, valid: false });
    });
});

//register
app.post("/register", (req, res, next) => {
  //Validations
  let messages = [];
  if (!req.body.email) {
    messages.push("Please provide a email");
  }
  if (req.body.email && req.body.email.length > 150) {
    messages.push("Email must contain a maximum of 150 characters");
  }

  if (!req.body.name) {
    messages.push("Please provide a name");
  }
  if (req.body.name && req.body.name.length > 150) {
    messages.push("Name must contain a maximum of 200 characters");
  }

  if (!req.body.password) {
    messages.push("Please provide a password");
  }
  if (req.body.password && req.body.password.length > 15) {
    messages.push("Password must contain a maximum of 15 characters");
  }
  if (
    (req.body.password && !req.body.confirmpassword) ||
    (req.body.password &&
      req.body.confirmpassword &&
      req.body.password !== req.body.confirmpassword)
  ) {
    messages.push("Confirm password field must be equals to password");
  }

  if (req.body.password && req.body.password.length < 6) {
    messages.push("Password must contain at least 6 characters");
  }

  if (messages.length > 0) {
    res.status(200).json({ messages: messages, valid: false });
  } else {
    let pool = global.conn.request();

    pool.input("email", sql.VarChar, req.body.email);

    let query = "SELECT (1) FROM K_Users WHERE U_Email = @email";

    pool
      .query(query)
      .then(function (results) {
        if (results.recordset.length > 0) {
          messages.push("Email already used!");
          res.status(200).json({ messages: messages, valid: false });
        } else {
          pool = global.conn.request();
          pool = conn.request();
          pool.input("email", sql.VarChar, req.body.email);
          pool.input("name", sql.VarChar, req.body.name);
          pool.input("password", sql.VarChar, req.body.password);

          query =
            "INSERT INTO K_Users ([U_Email], [U_Name], [U_Password], [U_CreationDate]) VALUES (@email, @name, @password, GETDATE())";

          messages.push("Successful registration!");

          pool
            .query(query)
            .then(function (results) {
              res.status(200).json({ messages: messages, valid: true });
            })
            .catch(function (err) {
              messages.push(
                "Something happened, contact your system administrator!"
              );
              res.status(200).json({ messages: messages, valid: false });
            });
        }
      })
      .catch(function (err) {
        messages.push("Something happened, contact your system administrator!");
        res.status(200).json({ messages: messages, valid: false });
      });
  }
});

//isAutorized
app.get("/isAuthorized", verifyJWT, (req, res, next) => {
  let messages = [];
  messages.push("Authorized!");
  res.json({ user: res.user, messages: messages, valid: true, auth: true });
});

//roll
app.post("/roll", verifyJWT, (req, res, next) => {
  let messages = [];
  const slotsTypes = {
    "🍒": [0, 40, 50],
    "🍎": [0, 10, 20],
    "🍌": [0, 5, 15],
    "🍋": [0, 0, 3],
  };
  const reels = [
    ["🍒", "🍋", "🍎", "🍋", "🍌", "🍌", "🍋", "🍋"],
    ["🍋", "🍎", "🍋", "🍋", "🍒", "🍎", "🍌", "🍋"],
    ["🍋", "🍎", "🍋", "🍎", "🍒", "🍋", "🍌", "🍋"],
  ];
  const spin = [
    parseInt(Math.random() * 7),
    parseInt(Math.random() * 7),
    parseInt(Math.random() * 7),
  ];

  var slotType = reels[0][spin[0]],
    matches = 1,
    winnedCredits = 0;

  if (slotType == reels[1][spin[1]]) {
    matches++;

    if (slotType == reels[2][spin[2]]) {
      matches++;
    }
  }

  winnedCredits = slotsTypes[slotType][matches - 1];

  res.json({ winnedCredits: winnedCredits, spin: spin });
});

//logout
app.post("/logout", function (req, res) {
  res.json({ auth: false, token: null });
});

function verifyJWT(req, res, next) {
  let messages = [];

  let token = req.headers["authorization"];
  if (!token) {
    messages.push("No token provided.");
    return res
      .status(401)
      .json({ valid: false, messages: messages, auth: false });
  }

  token = token.replace("Bearer ", "");

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err) {
      messages.push("Unauthorized.");

      return res
        .status(401)
        .json({ valid: false, messages: messages, auth: false });
    }
    req.user = decoded;
    next();
  });
}

const server = http.createServer(app);
server.listen(2002);
