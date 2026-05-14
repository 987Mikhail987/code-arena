"use strict";
const { Model } = require("sequelize");

const SESSION_TYPES = ["ai", "live"];
const SESSION_STATUSES = ["active", "complited"];
const SESSION_LEVELS = ["junior", "middle", "senior"];

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      this.hasMany(models.Message, { foreignKey: "session_id", as: "messages" });
    }
  }

  Session.init(
    {
      user_id: DataTypes.INTEGER,
      type: DataTypes.ENUM(...SESSION_TYPES),
      status: DataTypes.ENUM(...SESSION_STATUSES),
      level: DataTypes.ENUM(...SESSION_LEVELS),
      topic: DataTypes.TEXT,
      result: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "Session",
    },
  );

  return Session;
};
