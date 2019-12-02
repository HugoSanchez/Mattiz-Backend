// LOAD ENVIRONMENT VARIABLES
require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const uuid4 = require('uuid/v4')
const db = require('./db');
const { encryptData, decryptData, generateDH } = require('./utils/crypto/helper')

// ROUTER ENCODING ATRIBUTES 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// LOAD SESSION INTO REQ
const sessionManager = { }

app.use((req, res, next) => {
  let id = req.body.id

  if(id) {

    req.body.session = sessionManager[id]
  } else {    
    id = uuid4()

    req.body.id = id
  }

  console.log("========> REQUEST at: ",req.method, req.path)
  next()
})

app.get('/api/esc', (req, res) => {
  console.log("SC Requested!")
  const { 
    prime, 
    generator,
    publicKey, 
    computeSecret, 
  } = generateDH(process.env.BIT_SIZE)

  sessionManager[req.body.id] = {
    id: req.body.id,
    computeSecret,
  }

  res.status(200).send({
    id: req.body.id,
    prime,
    generator,
    pubKey: publicKey,
  })
})

app.post('/api/esc', (req, res) => {

  if (req.body.key) {
    const keyBuffer = Buffer.from(req.body.key, 'hex')

    req.body.session.secret = req.body.session.computeSecret(keyBuffer)

    console.log("SC Established!")
    res.status(200).send({ message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})

const decryptBodyMiddleware = (req, res, next) => {
  // console.log('_______________________________________')
  // console.log("Encrypted body: ", req.body)
  if(req.body.data) req.body.data = decryptData(req.body.data, req.body.session.secret)
  // console.log("Decrypted body: ", req.body, "\n")

  res.sendEnc = (body) => res.send( encryptData(body, req.body.session.secret) )

  next()
}

// /* Import ConnectionController routes */
// const ConnectionController = require('./src/connection/ConnectionController');
// app.use('/api/esc', ConnectionController)

/* Import UserController routes */
const UserController = require('./src/user/UserController');
app.use('/users', decryptBodyMiddleware, UserController);

/* Import AuthController routes */
const AuthController = require('./src/auth/AuthController');
app.use('/api/auth', decryptBodyMiddleware, AuthController);

/* Import PlaidController routes */
const PlaidController = require('./src/plaid/PlaidController');
app.use('/api/plaid', decryptBodyMiddleware, PlaidController);

/* Import MarketDataController routes */
const MarketDataController = require('./src/data/MarketDataController');
app.use('/api/data', decryptBodyMiddleware, MarketDataController);

module.exports = app;