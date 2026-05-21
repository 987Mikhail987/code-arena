require('./config/loadEnv');
const express = require("express");
const http = require("http");
const mainRouter = require("./routes/mainRoute");
const serverConfig = require("./config/serverConfig");
const initLiveInterviewSocket = require("./realtime/liveInterviewSocket");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ?? 3000;

serverConfig(app);

app.use("/", mainRouter);

initLiveInterviewSocket(server);

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту: ${PORT}`);
});
