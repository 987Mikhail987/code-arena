"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      this.belongsTo(models.Session, { foreignKey: "session_id", as: "session" });
    }
  }

  Message.init(
    {
      session_id: DataTypes.INTEGER,
      role: DataTypes.TEXT,
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Message",
    },
  );

  return Message;
};
