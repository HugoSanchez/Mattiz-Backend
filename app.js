const express = require('express');
const app = express();
const db = require('./db');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config')

/* Setup session middleware */
app.use(session({
    name: 'id',
    resave: false,
    saveUninitialized: false,
    secret: config.sessionSecret,
    store: new MongoStore({ mongooseConnection: db }),
    cookie: {
        httpOnly: true,
        // secure: true, SHOULD IMPLEMENT AS SOON AS WHOLE APP IS OVER HTTPS
    },
  })
)

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