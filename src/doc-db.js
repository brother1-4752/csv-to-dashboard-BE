const mongoose = require("mongoose");
require("dotenv").config();

//DocDB settings values
const uri = `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.MONGODB_ENDPOINT_PROD}/${process.env.MONGODB_DATABASE_NAME}`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

module.exports = db;
