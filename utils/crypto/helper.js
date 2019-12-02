const crypto = require('crypto')

const generateKey = (password) => {
  /* 
    Generate a key from a hex string of any length by hashing it to create a 32bit key
  */
  return crypto.createHash('sha256')
          .update(password)
          .digest()
}

const generateIv = (ivString) => {
  /* 
    Generate an Initital Vector string from a plaintext string of any length by hashing it 
    to create a 32bit key, from which we copy the frist 16bits (as the IV needs to be 16bit)
  */
  const iv16Bytes = Buffer.allocUnsafe(16)
  const iv32Bytes = crypto.createHash('sha256')
                    .update(ivString)
                    .digest()

  iv32Bytes.copy(iv16Bytes)

  return iv16Bytes
}

const generateCipher = (password, ivString) => {
  /*
    Generate cipher from a 32bit `password` and 16bit `ivString`
  */
  return crypto.createCipheriv(
    'aes256', 
    generateKey(password),
    generateIv(ivString)
  )
}

const generateDecipher = (password, ivString) => {
  /*
    Generate decipher from a 32bit `password` and 16bit `ivString`
  */
  return crypto.createDecipheriv(
    'aes256', 
    generateKey(password),
    generateIv(ivString)
  )
}

const encryptData = (data, password) => {
  /*
    Takes in a `data` object and a `password` hex string

    Returns an object with { data: encryptedData }
  */

  // console.log("encryptData()...")
  const plainText = JSON.stringify(data)
  const cipher = generateCipher(password, "IdeallyCryptographicallyRandom")

  let encrypted = cipher.update(plainText, 'binary', 'hex')
  encrypted += cipher.final('hex')

  return { data: encrypted }
}

const decryptData = (cipherText, password) => {
  /*
    Takes in a `cipherText` and a `password` hex string

    Returns the decrypted data as the original encrypted object
  */

  // console.log("decryptData()...")
  const decipher = generateDecipher(password, "IdeallyCryptographicallyRandom")

  let decrypted = decipher.update(cipherText, 'hex', 'binary')
  decrypted += decipher.final('binary')

  return JSON.parse(decrypted)
}

const generateDH = (size) => {
  /*
    Takes in an integer `size` to generate a DiffieHelman instance with a prime of {`size`}bits

    Returns the `prime`, `generator`, `publicKey`, and `privateKey` as hex strings
  */
  // console.log("generateDH()...")
  const dH = crypto.createDiffieHellman( parseInt(size) )

  const hexify = intArr => intArr.toString('hex')

  return {
    prime: hexify(dH.getPrime()),
    generator: hexify(dH.getGenerator()),
    publicKey: hexify(dH.generateKeys()),
    computeSecret: (pubKey) => dH.computeSecret(pubKey).toString('hex'),
  }
}

// const calculateSecret = ({ primeHex, generatorHex,  pubKeyHex, serverPrivateKeyHex }) => {
//   /*
//     Takes in `primeHex`, `generatorHex`, `pubKeyHex`, and `serverPrivateKeyHex` as hex strings
//     to calculate a DiffieHelman instance and compute a secret using the pubKeyBuffer

//     Returns `secret` as hex string
//   */
//   // console.log("calculateSecret()...")
//   const pubKeyBuffer = Buffer.from(pubKeyHex, 'hex')
//   const primeBuffer = Buffer.from(primeHex, 'hex')
//   const generatorBuffer = Buffer.from(generatorHex, 'hex')
//   const serverPrivateKeyBuffer = Buffer.from(serverPrivateKeyHex, 'hex')

//   const dH = crypto.createDiffieHellman(primeBuffer, generatorBuffer)
//   dH.setPrivateKey(serverPrivateKeyBuffer)

//   return dH.computeSecret(pubKeyBuffer).toString('hex')
// }

module.exports = {
  encryptData,
  decryptData,
  generateDH,
}