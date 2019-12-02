const router = require('express').Router();
const User = require('../user/User');
const { generateDH, calculateSecret } = require('../../utils/crypto/helper')

router.get('', (req, res) => {
  console.log("SC Requested!")
  const { 
    prime, 
    generator,
    publicKey, 
    computeSecret, 
  } = generateDH(process.env.BIT_SIZE)

    
  req.sessionManager[req.body.id] = {
    id: req.body.id,
    computeSecret,
  }
  // req.session.prime = prime
  // req.session.generator = generator
  // req.session.serverKey = privateKey

  res.status(200).send({
    id: req.body.id,
    prime,
    generator,
    pubKey: publicKey,
  })
})

router.post('', (req, res) => {

  if (req.body.key) {
    const keyBuffer = Buffer.from(req.body.key, 'hex')

    req.body.session.secret = req.body.session.computeSecret(keyBuffer)

    console.log("SC Established!")
    res.status(200).send({ message: 'Connection established' })
  } else {
    res.status(555).send('Could not establish secure connection')
  }
})

module.exports = router