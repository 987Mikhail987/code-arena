const crypto = require("crypto");

function generatePublicId() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = generatePublicId;
