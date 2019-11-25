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
    // rolling: false,
    saveUninitialized: true,
    secret: config.sessionSecret,
    store: new MongoStore({ mongooseConnection: db }),
    cookie: {
        httpOnly: true,
        maxAge: 60 * 1000, // 1 min
        // secure: true, SHOULD IMPLEMENT AS SOON AS WHOLE APP IS OVER HTTPS
    },
  })
)

app.use((req, res, next) => {
  // console.log(`if (${ req.session.cookie.maxAge < 0 })`)
  // console.log(`ID: (${ req.session.id})`)
  // debugger
  if (req.session.cookie.maxAge < 0) {
    
    
    return res.status(401).send("Session expired")
  }
  
  next()
})

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