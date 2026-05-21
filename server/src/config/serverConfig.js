const express = require("express");
const morgan = require("morgan");
const removeHttpHeader = require("../middleware/removeHeader");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsConfig = require("./corsConfig");
const { uploadsDir } = require("./uploadPaths");


const serverConfig = (app) => {
  app.use(cookieParser());
  app.use(morgan("dev")); // логирует запросы
  app.use(express.json()); // Для обработки JSON-данных в теле запроса
  app.use(express.urlencoded({ extended: true })); // Для обработки данных из форм (application/x-www-form-urlencoded)
  app.use(removeHttpHeader);
  app.use(express.static(path.join(__dirname, "../public")));
  app.use("/uploads", express.static(uploadsDir));
  app.use(cors(corsConfig));
};

module.exports = serverConfig;
