require('dotenv').config();
const express           = require("express");
const bodyParser        = require("body-parser");
const logger            = require("morgan");

const axios             = require("axios");
const cheerio           = require("cheerio");

const PORT              = process.env.PORT || 8080;

let app                 = express();

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("app/public"));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

app.use(logger("dev"));

// Set Handlebars.
const exphbs            = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Import routes and give the server access to them.
let routes              = require("./app/controllers/newsdb_controller.js");

// Set up Passport
const passport          = require('passport');
const expressSession    = require('express-session');

// let myKey = process.env.sessionKey || 'thisisasupersecretkey';
let myKey = process.env.SESSION_KEY;
app.use(expressSession({secret: myKey}));
app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.listen(PORT, function(){
  // Log (server-side) when our server has started
console.log("Server listening on: http://localhost:" + PORT);
});