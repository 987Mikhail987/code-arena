const express = require("express");
const mainRouter = require("./routes/mainRoute");
const serverConfig = require("./config/serverConfig");

const app = express();

const PORT = process.env.PORT ?? 3000;

serverConfig(app);

app.use("/", mainRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту: ${PORT}`);
});
