'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      this.hasOne(models.Response, { foreignKey: "request_id", as: "response" });
    }
  }
  Request.init({
    type: DataTypes.ENUM("explain", "fix", "review"),
    level: DataTypes.ENUM("student","junior", "middle", "senior"),
    content: DataTypes.TEXT,
    comment: DataTypes.TEXT,
    user_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Request',
  });
  return Request;
};