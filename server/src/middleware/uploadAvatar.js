const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const formatResponse = require("../utils/formatResponse");
const { avatarsDir } = require("../config/uploadPaths");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: avatarsDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = extension || ".jpg";
    const randomName = crypto.randomBytes(12).toString("hex");

    cb(null, `${req.user?.id || "user"}-${Date.now()}-${randomName}${safeExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error("AVATAR_INVALID_TYPE"));
      return;
    }

    cb(null, true);
  },
}).single("avatar");

function uploadAvatar(req, res, next) {
  upload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res
        .status(400)
        .json(formatResponse(400, "Размер аватарки не должен превышать 2 МБ"));
      return;
    }

    if (error.message === "AVATAR_INVALID_TYPE") {
      res
        .status(400)
        .json(formatResponse(400, "Можно загрузить только изображение"));
      return;
    }

    res
      .status(500)
      .json(formatResponse(500, "Ошибка при загрузке аватарки"));
  });
}

module.exports = uploadAvatar;
