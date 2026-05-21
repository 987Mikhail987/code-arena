const profileRoute = require("express").Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");
const ProfileController = require("../controllers/ProfileController");
const uploadAvatar = require("../middleware/uploadAvatar");

profileRoute
  .get("/", verifyAccessToken, ProfileController.getOneProfile)
  .put("/avatar", verifyAccessToken, uploadAvatar, ProfileController.updateAvatar)
  .put("/password", verifyAccessToken, ProfileController.updatePassword)
  .put("/", verifyAccessToken, ProfileController.updateProfile)
  .delete("/", verifyAccessToken, ProfileController.deleteProfile);

module.exports = profileRoute;
