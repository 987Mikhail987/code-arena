const fs = require("fs/promises");
const path = require("path");
const { User } = require("../db/models");
const { avatarsDir } = require("../config/uploadPaths");

async function removeUploadedAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) {
    return;
  }

  const fileName = path.basename(avatarUrl);
  const filePath = path.join(avatarsDir, fileName);

  try {
    await fs.unlink(filePath);
  } catch {
    // Старый файл мог быть уже удален вручную.
  }
}

class ProfileService {
  static async getOneProfile(userId) {
    const user = await User.findByPk(userId);
    return user ? user.get() : null;
  }

  static async updatePassword(userId, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    user.password = newPassword;
    await user.save();
    return user;
  }

  static async updateProfile(userId, updateProfile) {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    const { email, role, name } = updateProfile;
    if (email) {
      user.email = email.toLowerCase().trim();
    }
    if (role) {
      user.role = role;
    }
    if (name) {
      user.name = name;
    }

    await user.save();
    return user.get();
  }

  static async updateAvatar(userId, avatarUrl) {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    const previousAvatarUrl = user.avatar_url;
    user.avatar_url = avatarUrl;
    await user.save();
    await removeUploadedAvatar(previousAvatarUrl);

    return user.get();
  }

  static async deleteProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    await user.destroy();
    return true;
  }
}

module.exports = ProfileService;
