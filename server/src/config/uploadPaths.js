const path = require("path");

const uploadsDir =
  process.env.UPLOADS_DIR || path.join(__dirname, "../../uploads");
const avatarsDir = path.join(uploadsDir, "avatars");

module.exports = {
  uploadsDir,
  avatarsDir,
};
