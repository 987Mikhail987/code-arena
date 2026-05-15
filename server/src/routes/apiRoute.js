const apiRouter = require("express").Router();
const authRouter = require("./authRoute");
const profileRouter = require("./profileRoute");
const sessionRouter = require("./sessionRoute");
const formatResponse = require("../utils/formatResponse");
// const aiRouter = require("./aiRouter");

apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/sessions", sessionRouter);
// apiRouter.use("/ai", aiRouter);

apiRouter.use((req, res) => {
  res.status(404).json(formatResponse(404, "Ресурс не найден"));
});

module.exports = apiRouter;
