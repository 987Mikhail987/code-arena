const { Response } = require("../db/models");
class ResponseService {
  static async createResponse(userData) {
    return (await Response.create(userData)).get();
  }
}
module.exports = ResponseService;
