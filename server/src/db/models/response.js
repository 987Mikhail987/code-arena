'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Response extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Request, { foreignKey: "request_id", as: "request" });
    }
  }
  Response.init({
    problem: DataTypes.TEXT,
    solution: DataTypes.TEXT,
    explanation: DataTypes.TEXT,
    request_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Response',
  });
  return Response;
};