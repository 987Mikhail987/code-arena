const authRouter = require("express").Router();
const AuthController = require("../controllers/AuthController");
const verifyRefreshToken = require("../middleware/verifyRefreshToken");

authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/refresh", verifyRefreshToken, AuthController.refreshTokens);
authRouter.post("/refresh", verifyRefreshToken, AuthController.refreshTokens);

module.exports = authRouter;
