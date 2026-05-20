const sessionRoute = require("express").Router();
const SessionController = require("../controllers/SessionController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

sessionRoute
  .get("/", verifyAccessToken, SessionController.getUserSessions)
  .post("/", verifyAccessToken, SessionController.createSession)
  .delete("/", verifyAccessToken, SessionController.deleteUserSessions)
  .get("/live/active", verifyAccessToken, SessionController.getActiveLiveSessions)
  .get("/:sessionId", verifyAccessToken, SessionController.getUserSessionById)
  .delete("/:sessionId", verifyAccessToken, SessionController.deleteUserSession)
  .patch("/:sessionId/finish", verifyAccessToken, SessionController.finishSession)
  .post("/:sessionId/messages", verifyAccessToken, SessionController.createMessage);

module.exports = sessionRoute;
