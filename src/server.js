// cors, body-parser 설정
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const db = require("./doc-db");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", routes);

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("DB connected!"));

module.exports = app;
