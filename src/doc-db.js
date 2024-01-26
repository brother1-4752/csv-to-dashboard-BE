const mongoose = require("mongoose");
require("dotenv").config();

//DocDB settings values
const uri = `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DOCDB_ENDPOINT_PROD}/${process.env.DATABASE_NAME}`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

module.exports = db;
