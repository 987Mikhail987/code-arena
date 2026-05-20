"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SessionParticipants", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      role: {
        type: Sequelize.ENUM("candidate", "intervier"),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addConstraint("SessionParticipants", {
      fields: ["session_id", "user_id"],
      type: "unique",
      name: "session_participants_session_user_unique",
    });

    await queryInterface.addConstraint("SessionParticipants", {
      fields: ["session_id", "role"],
      type: "unique",
      name: "session_participants_session_role_unique",
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "SessionParticipants"
        ("session_id", "user_id", "role", "createdAt", "updatedAt")
      SELECT "id", "user_id", 'candidate', NOW(), NOW()
      FROM "Sessions"
      WHERE "type" = 'live'
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("SessionParticipants");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_SessionParticipants_role";',
    );
  },
};
