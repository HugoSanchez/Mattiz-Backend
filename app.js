const express = require('express');
const app = express();
const db = require('./db');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const helper = require('./helper')
const bodyParser = require('body-parser');
require('dotenv').config();

/* Setup session middleware */
app.use(session({
    name: 'id',
    resave: false,
    // rolling: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
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
  debugger
  if (req.session.cookie.maxAge < 0) {
    
    
    return res.status(401).send("Session expired")
  }
  
  next()
})

// ROUTER ENCODING ATRIBUTES 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/esc', (req, res) => {
  const { key, prime, generator, establishSecret } = helper.establishDH(process.env.BIT_SIZE)

  req.session.prime = prime
  req.session.generator = generator
  console.log("Request SC")

  res.status(200).send({
    key,
    prime,
    generator,
    sessionId: req.session.id,
  })
})

app.post('/esc', (req, res) => {
  console.log("Establish SC")
  if (req.body.cKey) {

    const keyBuffer = Buffer.from(req.body.cKey.data)
    req.session.secret = req.session.establishSecret(keyBuffer).toString('hex')

    res.status(200).send({ error: false, message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})


const decryptBody = (req, res, next) => {
  // use sessionId to find session object
  // check if Time.now() - sessionInfo.lastIssued < 60000 {
  //  overwrite lastIssued to Time.now()
  //  decrypt and keep going
  // } else { send error sayind session is expired }
  debugger

  console.log("\nEncrypted body: ", req.body, "\n\n")
  req.body = helper.decryptData(req.body.data, req.session.secret)
  console.log("\nDecrypted body: ", req.body, "\n\n")
  next()
}

// app.use(decryptBody)

/* Import UserController routes */
const UserController = require('./src/user/UserController');
app.use('/users', decryptBody, UserController);

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