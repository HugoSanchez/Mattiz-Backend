const crypto = require('crypto')

const generateKey = (password) => {
  return crypto.createHash('sha256')
          .update(password)
          .digest()
}

const generateIv = (ivString) => {
  const iv16Bytes = Buffer.allocUnsafe(16)
  const iv32Bytes = crypto.createHash('sha256')
                    .update(ivString)
                    .digest()

  iv32Bytes.copy(iv16Bytes)

  return iv16Bytes
}

const generateCipher = (password, ivString) => {
  return crypto.createCipheriv(
    'aes256', 
    generateKey(password),
    generateIv(ivString)
  )
}

const generateDecipher = (password, ivString) => {
  return crypto.createDecipheriv(
    'aes256', 
    generateKey(password),
    generateIv(ivString)
  )
}

const encryptData = (data, password) => {
  const plainText = JSON.stringify(data)
  const cipher = generateCipher(password.toString('hex'), "IdeallyCryptographicallyRandom")

  let encrypted = cipher.update(plainText, 'binary', 'hex')
  encrypted += cipher.final('hex')

  return { data: encrypted }
}

const decryptData = (cipherText, password) => {
  const decipher = generateDecipher(password.toString('hex'), "IdeallyCryptographicallyRandom")

  let decrypted = decipher.update(cipherText, 'hex', 'binary')
  decrypted += decipher.final('binary')

  return JSON.parse(decrypted)
}
////////////////////////////////////////////////////////////////

const establishDH = (size) => {
  const dH = crypto.createDiffieHellman( parseInt(size) )
  const key = dH.generateKeys()
  const prime = dH.getPrime()
  const generator = dH.getGenerator()

  return {
    publicKey: key,
    privateKey: dH.getPrivateKey(),
    // key: dH.getPublicKey(),
    prime,
    // prime: dH.getPrime(),
    generator,
    // generator: dH.getGenerator(),
    establishSecret: (key) => dH.computeSecret(key),
  }
}

const calculateSecret = (clientKey, serverPrivateKey, prime, generator) => {
  const cKeyBuffer = Buffer.from(clientKey.data)
  const privateKeyBuffer = Buffer.from(serverPrivateKey.data)
  const primeBuffer = Buffer.from(prime.data)
  const generatorBuffer = Buffer.from(generator.data)

  const dH = crypto.createDiffieHellman(primeBuffer, generatorBuffer)

  dH.setPrivateKey(privateKeyBuffer)
  const secret = dH.computeSecret(cKeyBuffer)

  return secret
}

////////////////////////////////////////////////////////////////


module.exports = {
  encryptData,
  decryptData,
  establishDH,
  calculateSecret,
}