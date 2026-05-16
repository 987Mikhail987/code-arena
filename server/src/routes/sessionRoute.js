const sessionRoute = require("express").Router();
const SessionController = require("../controllers/SessionController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

sessionRoute
  .get("/", verifyAccessToken, SessionController.getUserSessions)
  .post("/", verifyAccessToken, SessionController.createSession)
  .get("/:sessionId", verifyAccessToken, SessionController.getUserSessionById)
  .patch("/:sessionId/finish", verifyAccessToken, SessionController.finishSession)
  .post("/:sessionId/messages", verifyAccessToken, SessionController.createMessage);

module.exports = sessionRoute;
