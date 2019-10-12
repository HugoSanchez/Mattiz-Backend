const express = require('express');
const app = express();
const db = require('./db');
const uuid = require('uuid/v4')
const helper = require('./helper')
const bodyParser = require('body-parser');
const config = require('./config');

const sessionExpTime = 10000
const sessionDictionary = {}

// ROUTER ENCODING ATRIBUTES 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/esc', (req, res) => {
  const { key, prime, generator, establishSecret } = helper.establishDH(config.bitSize)
  const sessionId = uuid()
  sessionDictionary[sessionId] = { 
    establishSecret,
  }

  res.status(200).send({
    key,
    prime,
    generator,
    sessionId,
  })
})

app.post('/esc', (req, res) => {
  if (req.body.cKey) {
    const sessionInfo = sessionDictionary[req.body.sessionId]
    const keyBuffer = Buffer.from(req.body.cKey.data)
    sessionInfo.secret = sessionInfo.establishSecret(keyBuffer).toString('hex')
    sessionInfo.time = Date.now()
    res.status(200).send({ error: false, message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})


const decryptBody = (req, res, next) => {
  const sessionId = req.body.sessionId
  
  if(Date.now() - sessionDictionary[sessionId].time < sessionExpTime){
    sessionDictionary[sessionId].time = Date.now()
    const secret = sessionDictionary[req.body.sessionId].secret
    console.log("\nEncrypted body: ", req.body, "\n\n")
    req.body = helper.decryptData(req.body.data, secret)
    console.log("\nDecrypted body: ", req.body, "\n\n")
    next()
  }
  else{
    res.status(403).send({ error: true, message: 'Session expired' })
  }
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