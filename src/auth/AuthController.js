     ///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// AUTH/CRYPTO DEPENDENCIES
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const config = require('../../config');

// USER SCHEMA
const User = require('../user/User');

// ROUTER ENCODING ATRIBUTES 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use(decryptBody)

const decryptBody = (req, res, next) => {
    console.log("\nEncrypted body: ", req.body, "\n\n")
    req.body = decryptData(req.body.data, "password")
    console.log("\nDecrypted body: ", req.body, "\n\n")
    next()
}

            ///* Auth Routes *///

// POST: CREATE NEW USER
router.post('/register', (req, res) => {
    // Inmediately hash the password. 
    let hashedPaswword = bcrypt.hashSync(req.body.password, 8);

    // Create a new User instance and save it in DB.
    User.create({
        name: req.body.name, 
        password: hashedPaswword
    },
    (err, user) => {
        // If error return error.
        if (err) return res.status(500).send('There was a problem registering the user.')

        // If succesful, create token and return 200.
        let token = jwt.sign({id: user._id }, config.secret)
        res.status(200).send({ auth: true, token: token, user: user }); 
    });
});

// GET: SPECIFIC USER DETAILS FROM DB
router.post('/identify', (req, res) => {
    // Get token from request header.
    let token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 
        'No token provided.' });

    // Retrieve id from token.
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) return res.status(500).send({ auth: false, message: 
            'Failed to authenticate token.' });
        
        // Use the decoded id to retrieve user details from DB.
        User.findById(decoded.id, { password: 0 }, (err, user) => {
            // Handle error cases
            if (err) return res.status(500).send('There was a problem finding the user.');
            if (!user) return res.status(404).send('No user found');

            // Send response with new object.
            res.status(200).send(user)
        });
    });
});

// POST: LOGIN ROUTE
router.post('/login', (req, res) => {
    console.log('Id: ', req.body._id)
    User.findById(req.body._id , (err, user) => {
        // Handle error cases.
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('User not found.');

        // Validate password.
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

        // Send 401 if password is invalid.
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

        // If password is valid create session token,
        let token = jwt.sign({id: user._id}, config.secret, {
            expiresIn: 86400    // 24 hours expiration time 
        });
        // and send response. 
        res.status(200).send({ auth: true, token: token, user: user });
    });
});

// ENCRYPTION HELPER METHODS
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

  return encrypted
}

const decryptData = (cipherText, password) => {
  const decipher = generateDecipher(password, "IVString")

  let decrypted = decipher.update(cipherText, 'hex', 'binary')
  decrypted += decipher.final('binary')

  return JSON.parse(decrypted)
}

// Export router 
module.exports = router; 

// clean simulator cache
// xcrun simctl erase all