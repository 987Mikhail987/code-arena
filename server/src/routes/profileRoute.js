const profileRoute = require("express").Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");
const ProfileController = require("../controllers/ProfileController");

profileRoute
  .get("/", verifyAccessToken, ProfileController.getOneProfile)
  .put("/password", verifyAccessToken, ProfileController.updatePassword)
  .put("/", verifyAccessToken, ProfileController.updateProfile)
  .delete("/", verifyAccessToken, ProfileController.deleteProfile);

module.exports = profileRoute;
