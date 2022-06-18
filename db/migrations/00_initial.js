const { Sequelize } = require('sequelize');

async function up({ context: queryInterface }) {
  await queryInterface.createTable('users', {
    'id': {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    'username': {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    'password': {
      type: Sequelize.STRING,
      allowNull: false
    },
    'is_superuser': {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  });

  await queryInterface.createTable('categories', {
    'id': {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    'name': {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    }
  });

  await queryInterface.createTable('works', {
    'id': {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    'title': {
      type: Sequelize.STRING,
      allowNull: false
    },
    'category_id': {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    'model_filename': {
      type: Sequelize.STRING,
      allowNull: false
    },
    'cover_filename': {
      type: Sequelize.STRING,
      allowNull: false
    }
  });

  await queryInterface.createTable('favorites', {
    'id': {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    'user_id': {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    'work_id': {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });
  await queryInterface.addIndex(
    'favorites',
    ['user_id', 'work_id'],
    {
      unique: true
    }
  );
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable('favorites');
  await queryInterface.dropTable('works');
  await queryInterface.dropTable('categories');
  await queryInterface.dropTable('users');
}

module.exports = { up, down };
