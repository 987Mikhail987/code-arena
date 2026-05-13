const { User } = require("../db/models");

class ProfileService {
  static async getOneProfile(userId) {
    const user = (await User.findByPk(userId))?.get();
    if (!user) {
      return null;
    }
    return user;
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
    const { email, level, name } = updateProfile;
    if (email) {
      user.email = email.toLowerCase().trim(); // Нормализуем email?
    }
    if (level) {
      user.level = level;
    }
    if (name) {
      user.name = name;
    }
    await user.save();
    return user;
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
