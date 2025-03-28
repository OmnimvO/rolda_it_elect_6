const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const postroutes = require("./routes/posts"); 
const path = require("path");

const app = express();

mongoose.connect("mongodb+srv://tinmaerolda:I0EzV6GnacxuTfRI@cluster0.jehjs.mongodb.net/ateneodb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Connected to the Database");
  })
  .catch(() => {
    console.log("Connection Failed");
  });

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/images", express.static(path.join("backend/images")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    next();
});

app.use("/api/posts", postroutes);

module.exports = app;
