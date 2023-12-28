// cors, multer, body-parser 설정
// express 앱 실행 및 포트 설정
// uploads 디렉토리 초기화
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", routes);

module.exports = app;