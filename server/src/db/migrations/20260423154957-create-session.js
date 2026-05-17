"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("ai", "live"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "complited"),
        allowNull: false,
        defaultValue: "active",
      },
      level: {
        type: Sequelize.ENUM("junior", "middle", "senior"),
        allowNull: false,
      },
      topic: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      programming_language: {
        type: Sequelize.ENUM(
          "javascript",
          "typescript",
          "python",
          "go",
          "html",
          "css",
          "java",
          "c",
          "csharp",
        ),
        allowNull: false,
        defaultValue: "javascript",
      },
      result: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Sessions");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Sessions_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Sessions_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Sessions_level";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Sessions_programming_language";',
    );
  },
};
