const express = require('express');
const app = express();
const db = require('./db');

/* Import UserController routes */
const UserController = require('./src/user/UserController');
app.use('/users', UserController);

/* Import AuthController routes */
const AuthController = require('./src/auth/AuthController');
app.use('/api/auth', AuthController);

module.exports = app;