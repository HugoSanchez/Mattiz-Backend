const express = require('express');
const router = express.Router();
const helper = require('./../../helper')

router.get('/', (req, res) => {
  const { publicKey, privateKey, prime, generator } = helper.establishDH(process.env.BIT_SIZE)

  req.session.prime = prime
  req.session.generator = generator
  req.session.serverKey = privateKey

  res.status(200).send({
    key: publicKey,
    prime,
    generator,
  })
})

router.post('/', (req, res) => {
  console.log("Establish SC")

  if (req.body.cKey) {
    req.session.secret = helper.calculateSecret(req.body.cKey, req.session.serverKey, req.session.prime, req.session.generator)

    res.status(200).send({ error: false, message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})

module.exports = router