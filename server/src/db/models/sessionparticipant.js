"use strict";
const { Model } = require("sequelize");

const PARTICIPANT_ROLES = ["candidate", "intervier"];

module.exports = (sequelize, DataTypes) => {
  class SessionParticipant extends Model {
    static associate(models) {
      this.belongsTo(models.Session, {
        foreignKey: "session_id",
        as: "session",
      });
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  SessionParticipant.init(
    {
      session_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      role: DataTypes.ENUM(...PARTICIPANT_ROLES),
      deleted_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "SessionParticipant",
    },
  );

  return SessionParticipant;
};
