const AiController = require("../controllers/AiController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

const aiRouter = require("express").Router();

aiRouter.post("/", AiController.getAiAnswer);

module.exports = aiRouter;
