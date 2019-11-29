if(process.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const app = express();
const db = require('./db');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const helper = require('./helper')
const bodyParser = require('body-parser');

/* Setup session middleware */
app.use(session({
    name: 'id',
    resave: false,
    rolling: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: db,
      autoRemove: 'disabled',
    }),
    cookie: {
        httpOnly: true,
        maxAge: 60 * 1000, // 1 min
        // secure: true, SHOULD IMPLEMENT AS SOON AS WHOLE APP IS OVER HTTPS
    },
  })
)

// CHECK SESSION/DH SECRET STATUS
app.use((req, res, next) => {
  if (req.session.cookie.maxAge < 0) return res.status(401).send("Session expired")

  if (req.session.secret) res.sendEnc = (body) => res.send( helper.encryptData(body, req.session.secret) )

  next()
})

// ROUTER ENCODING ATRIBUTES 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const decryptBody = (req, res, next) => {
  console.log('_______________________________________')
  console.log("Encrypted body: ", req.body)
  if(req.body.data) req.body = helper.decryptData(req.body.data, req.session.secret)
  console.log("Decrypted body: ", req.body, "\n")
  next()
}

/* Import ConnectionController routes */
const ConnectionController = require('./src/connection/ConnectionController');
app.use('/api/esc', ConnectionController);

/* Import UserController routes */
const UserController = require('./src/user/UserController');
app.use('/api/users', decryptBody, UserController);

/* Import AuthController routes */
const AuthController = require('./src/auth/AuthController');
app.use('/api/auth', decryptBody, AuthController);

/* Import PlaidController routes */
const PlaidController = require('./src/plaid/PlaidController');
app.use('/api/plaid', decryptBody, PlaidController);

/* Import MarketDataController routes */
const MarketDataController = require('./src/data/MarketDataController');
app.use('/api/data', decryptBody, MarketDataController);

module.exports = app;