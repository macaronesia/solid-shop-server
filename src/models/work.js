const DataLoader = require('dataloader');
const { DataTypes, Op } = require('sequelize');

const { sequelize } = require('../core');

const Work = sequelize.define(
  'Work',
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    modelFilename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coverFilename: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    underscored: true,
    timestamps: false,
    freezeTableName: true,
    tableName: 'works'
  }
);

Work.loader = new DataLoader(async (keys) => {
  const works = await Work.findAll({
    where: {
      id: {
        [Op.in]: keys
      }
    }
  });
  return keys.map((key) => works.find((work) => work.id === key));
});

const workValidationSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 32
    }
  },
  allOf: [
    {
      oneOf: [
        { required: ['modelFile'] },
        { required: ['modelFilename'] }
      ]
    },
    {
      oneOf: [
        { required: ['coverFile'] },
        { required: ['coverFilename'] }
      ]
    }
  ]
};

module.exports = {
  Work,
  workValidationSchema
};
