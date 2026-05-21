"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Users");

    if (!table.avatar_url) {
      await queryInterface.addColumn("Users", "avatar_url", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Users");

    if (table.avatar_url) {
      await queryInterface.removeColumn("Users", "avatar_url");
    }
  },
};
