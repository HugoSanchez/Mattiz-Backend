require('dotenv').config()

// SERVER-SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// AUTH/CRYPTO DEPENDENCIES
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ethers = require('ethers');

// USER SCHEMA
const User = require('../user/User');
const deployWallet = require('../../deployment/deploy-wallet');

// ROUTER ENCODING ATRIBUTES 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


// POST: CREATE NEW USER
router.post('/register', async (req, res) => {
    // Inmediately hash the password. 
    let hashedPaswword = bcrypt.hashSync(req.body.password, 8);
    // Create a new wallet.
    let wallet = ethers.Wallet.createRandom()
    // Then deploy smart contract wallet owned by previous wallet.
    let smartContractWalletAddress = await deployWallet('ropsten', wallet.address)
    // 

    // Create a new User instance and save it in DB.
    User.create({ name: req.body.name, password: hashedPaswword },
        (err, user) => {
            // If error return error.
            if (err) return res.status(500).send('There was a problem registering the user.')
            // If successful, create token,
            let token = jwt.sign({id: user._id }, process.env.SECRET)
            // And send details back.
            res.status(200).send({ auth: true, token: token, user: user, ethKey: wallet.privateKey, smartContractWalletAddress}); 
    });
});

// GET: SPECIFIC USER DETAILS FROM DB
router.post('/identify', (req, res) => {
    // Get token from request header.
    let token = req.body.token;
    if (!token) return res.status(401).send({ auth: false, message: 
        'No token provided.' });

    // Retrieve id from token.
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
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

    User.findById(req.body._id , (err, user) => {
        // Handle error cases.
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('User not found.');

        // Validate password.
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

        // Send 401 if password is invalid.
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

        // If password is valid create session token,
        let token = jwt.sign({id: user._id}, process.env.SECRET, {
            expiresIn: 86400    // 24 hours expiration time 
        });
        // and send response. 
        res.status(200).send({ auth: true, token: token, user: user });
    });
});

// Export router 
module.exports = router; 