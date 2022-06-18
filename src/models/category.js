const DataLoader = require('dataloader');
const { DataTypes, Op } = require('sequelize');

const { sequelize } = require('../core');

const Category = sequelize.define(
  'Category',
  {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  },
  {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'categories'
  }
);

Category.loader = new DataLoader(async (keys) => {
  const categories = await Category.findAll({
    where: {
      id: {
        [Op.in]: keys
      }
    }
  });
  return keys.map((key) => categories.find((category) => category.id === key));
});

const categoryValidationSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 32
    }
  }
};

module.exports = {
  Category,
  categoryValidationSchema
};
