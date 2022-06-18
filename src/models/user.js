const bcrypt = require('bcrypt');
const { DataTypes } = require('sequelize');

const {
  PASSWORD_SALT_ROUNDS
} = require('../config');
const { sequelize } = require('../core');

const User = sequelize.define(
  'User',
  {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isSuperuser: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'users'
  }
);

User.prototype.savePasswordHash = async function savePasswordHash(password) {
  this.password = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

User.prototype.validatePassword = async function validatePassword(password) {
  return bcrypt.compare(password, this.password);
};

const authValidationSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 32
    },
    password: {
      type: 'string',
      minLength: 4,
      maxLength: 32
    }
  }
};

module.exports = {
  User,
  authValidationSchema
};
