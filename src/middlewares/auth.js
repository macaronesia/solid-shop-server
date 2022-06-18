const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const jwt = require('jsonwebtoken');

const {
  JWT_ACCESS_TOKEN_EXPIRES, JWT_SECRET
} = require('../config');
const { User } = require('../models/user');

const generateAccessToken = async (user) => jwt.sign({ id: user.id }, JWT_SECRET, {
  expiresIn: JWT_ACCESS_TOKEN_EXPIRES.asSeconds()
});

const getUserFromJWTHeaders = async (req) => {
  let payload;

  if (!req.headers['authorization']) {
    throw new AuthenticationError('no_authorization');
  }
  const words = req.headers['authorization'].split(' ');
  if (!(words.length === 2 && words[0] === 'Bearer')) {
    throw new AuthenticationError('invalid_header');
  }
  const token = words[1];

  try {
    payload = await jwt.verify(token, JWT_SECRET);
  } catch (e) {
    throw new AuthenticationError('jwt_decode_error');
  }
  return User.findByPk(payload.id);
};

const requireSuperuserPrivileges = (user) => {
  if (!user.isSuperuser) {
    throw new ForbiddenError('not_superuser');
  }
};

module.exports = {
  generateAccessToken,
  getUserFromJWTHeaders,
  requireSuperuserPrivileges
};
