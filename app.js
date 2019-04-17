const express = require('express');
const app = express();
const db = require('./db');

/* Import UserController routes */
const UserController = require('./src/user/UserController');
app.use('/users', UserController);

/* Import AuthController routes */
const AuthController = require('./src/auth/AuthController');
app.use('/api/auth', AuthController);

/* Import PlaidController routes */
const PlaidController = require('./src/plaid/PlaidController');
app.use('/api/plaid', PlaidController);

/* Import MarketDataController routes */
const MarketDataController = require('./src/data/MarketDataController');
app.use('/api/data', MarketDataController);

module.exports = app;