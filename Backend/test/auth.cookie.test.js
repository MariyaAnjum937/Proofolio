const test = require('node:test');
const assert = require('node:assert/strict');
const userModel = require('../src/models/user.models');
const bcrypt = require('bcryptjs');

const authControllerPath = require.resolve('../src/controllers/auth.controllers');
const originalFindOne = userModel.findOne;
const originalCompare = bcrypt.compare;
const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  RENDER: process.env.RENDER,
  JWT_SECRET: process.env.JWT_SECRET,
};

function setEnvironment({ nodeEnv, render }) {
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  if (render === undefined) {
    delete process.env.RENDER;
  } else {
    process.env.RENDER = render;
  }

  process.env.JWT_SECRET = 'test-jwt-secret';
  delete require.cache[authControllerPath];
  return require(authControllerPath);
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    cookieOptions: null,
    clearedCookieOptions: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookieName = name;
      this.cookieValue = value;
      this.cookieOptions = options;
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookieName = name;
      this.clearedCookieOptions = options;
      return this;
    },
  };
}

test('authentication cookies use cross-site settings on Render and local settings in development', async () => {
  const user = {
    _id: 'test-user-id',
    username: 'test-user',
    email: 'test@example.com',
    fullName: 'Test User',
    phone: '',
    password: 'hashed-password',
    role: 'student',
    status: 'approved',
  };

  try {
    userModel.findOne = async () => user;
    bcrypt.compare = async () => true;

    const { loginUser, logoutUser } = setEnvironment({
      nodeEnv: undefined,
      render: 'true',
    });
    const productionResponse = createResponse();

    await loginUser({
      body: { email: user.email, password: 'password' },
    }, productionResponse);

    assert.equal(productionResponse.statusCode, 200);
    assert.equal(productionResponse.cookieName, 'token');
    assert.equal(productionResponse.cookieOptions.httpOnly, true);
    assert.equal(productionResponse.cookieOptions.secure, true);
    assert.equal(productionResponse.cookieOptions.sameSite, 'none');

    logoutUser({}, productionResponse);
    assert.equal(productionResponse.clearedCookieName, 'token');
    assert.deepEqual(productionResponse.clearedCookieOptions, productionResponse.cookieOptions);

    const localController = setEnvironment({
      nodeEnv: 'development',
      render: undefined,
    });
    const localResponse = createResponse();

    await localController.loginUser({
      body: { email: user.email, password: 'password' },
    }, localResponse);

    assert.equal(localResponse.statusCode, 200);
    assert.equal(localResponse.cookieOptions.httpOnly, true);
    assert.equal(localResponse.cookieOptions.secure, false);
    assert.equal(localResponse.cookieOptions.sameSite, 'lax');
  } finally {
    userModel.findOne = originalFindOne;
    bcrypt.compare = originalCompare;

    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
    delete require.cache[authControllerPath];
  }
});
