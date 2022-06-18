const { DataTypes } = require('sequelize');

const { sequelize } = require('../core');

const Favorite = sequelize.define(
  'Favorite',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    workId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'favorites',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'work_id']
      }
    ]
  }
);

module.exports = {
  Favorite
};
