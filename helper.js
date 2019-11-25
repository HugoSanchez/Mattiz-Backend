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
  const cipher = generateCipher(password, "IVString")

  let encrypted = cipher.update(plainText, 'binary', 'hex')
  encrypted += cipher.final('hex')

  return { data: encrypted }
}

const decryptData = (cipherText, password) => {
  const decipher = generateDecipher(password, "IVString")

  let decrypted = decipher.update(cipherText, 'hex', 'binary')
  decrypted += decipher.final('binary')

  return JSON.parse(decrypted)
}
////////////////////////////////////////////////////////////////

const establishDH = (size) => {
  // console.time("\ndiffieHellman\n")
  const dH = crypto.createDiffieHellman( parseInt(size) )
  // console.timeEnd("\ndiffieHellman\n")
  // console.time("\nkey\n")
  const key = dH.generateKeys()
  ////////////////////////////////////////
  // serverDH.generateKeys()
  // const key = serverDH.getPublicKey()
  // console.timeEnd("\nkey\n")

  // console.time("\nPrime and Generator\n")
  const prime = dH.getPrime()
  const generator = dH.getGenerator()
  // console.timeEnd("\nPrime and Generator\n")


  return {
    key,
    // key: dH.getPublicKey(),
    prime,
    // prime: dH.getPrime(),
    generator,
    // generator: dH.getGenerator(),
    establishSecret: (key) => dH.computeSecret(key),
  }
}

////////////////////////////////////////////////////////////////


module.exports = {
  encryptData,
  decryptData,
  establishDH,
}