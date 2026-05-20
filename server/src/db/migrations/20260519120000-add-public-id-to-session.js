"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Sessions");

    if (!table.public_id) {
      await queryInterface.addColumn("Sessions", "public_id", {
        type: Sequelize.TEXT,
        allowNull: true,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Sessions");

    if (table.public_id) {
      await queryInterface.removeColumn("Sessions", "public_id");
    }
  },
};
