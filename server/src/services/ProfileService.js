const { User } = require("../db/models");

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
