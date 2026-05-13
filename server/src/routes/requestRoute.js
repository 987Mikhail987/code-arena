const responseRoute = require("express").Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");
const ResponseController = require("../controllers/RequestController");

responseRoute
  .get("/", verifyAccessToken, ResponseController.getAllRequestsUser)
  .get("/responses", verifyAccessToken, ResponseController.getAllRequestsAndResponsesUser)
  .get("/:id", verifyAccessToken, ResponseController.getOneRequestAndResponseUser)
  .post("/", verifyAccessToken, ResponseController.createRequest)
  .put("/:id", verifyAccessToken, ResponseController.updateRequest)
  .delete("/:id", verifyAccessToken, ResponseController.deleteRequest);

module.exports = responseRoute;
