const express = require('express');
const router = express.Router();
const { generateDH, calculateSecret } = require('./../../helper')

router.get('', (req, res) => {
  console.log("SC Requested!")
  const { 
    prime, 
    generator,
    publicKey, 
    privateKey, 
  } = generateDH(process.env.BIT_SIZE)

  req.session.prime = prime
  req.session.generator = generator
  req.session.serverKey = privateKey

  res.status(200).send({
    prime,
    generator,
    pubKey: publicKey,
  })
})

router.post('', (req, res) => {
  if (req.body.key) {
    req.session.secret = calculateSecret({
      primeHex: req.session.prime, 
      generatorHex: req.session.generator,
      pubKeyHex: req.body.key, 
      serverPrivateKeyHex: req.session.serverKey, 
    })

    console.log("SC Established!")
    res.status(200).send({ message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})

module.exports = router