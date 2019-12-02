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

// POST: CREATE NEW USER
router.post('/register', async (req, res) => {
    // Inmediately hash the password. 
    let hashedPaswword = bcrypt.hashSync(req.body.data.password, 8);
    // Create a new wallet.
    let wallet = ethers.Wallet.createRandom()
    // Then deploy smart contract wallet owned by previous wallet.
    // let smartContractWalletAddress = await deployWallet('ropsten', wallet.address)
    // Create a new User instance and save it in DB.
    User.create({ 
        name: req.body.data.name, 
        password: hashedPaswword,
        ethAddress: wallet.address,
        // smartWalletAddress: smartContractWalletAddress,
    }, (err, user) => {
        // If error return error.
        if (err) return res.status(500).sendEnc('There was a problem registering the user.')
        // If successful, create token,
        let token = jwt.sign({id: user._id }, process.env.SECRET)
        // And send details back.
        res.status(200).sendEnc({ auth: true, token, user, ethKey: wallet.privateKey }); 
    });
});

// GET: SPECIFIC USER DETAILS FROM DB
router.post('/identify', (req, res) => {
    // Get token from request header.
    let token = req.body.data.token;
    if (!token) return res.status(401).sendEnc({ auth: false, message: 
        'No token provided.' });
    // Retrieve id from token.
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) return res.status(500).sendEnc({ auth: false, message: 
            'Failed to authenticate token.' });  
        // Use the decoded id to retrieve user details from DB.
        User.findById(decoded.id, { password: 0 }, (err, user) => {
            // Handle error cases
            if (err) return res.status(500).sendEnc('There was a problem finding the user.');
            if (!user) return res.status(404).sendEnc('No user found');
            // Send response with new object.
            res.status(200).sendEnc(user)
        });
    });
});

// POST: LOGIN ROUTE
router.post('/login', (req, res) => {
    // Start by finding user in DB.
    User.findById(req.body.data._id , (err, user) => {
        // Handle error cases.
        if (err) return res.status(500).sendEnc('Error on the server.');
        if (!user) return res.status(404).sendEnc('User not found.');
        // Validate password.
        let passwordIsValid = bcrypt.compareSync(req.body.data.password, user.password);
        // Send 401 if password is invalid.
        if (!passwordIsValid) return res.status(401).sendEnc({ auth: false, token: null });
        // If password is valid create session token,
        let token = jwt.sign({id: user._id}, process.env.SECRET, {
            expiresIn: 86400    // 24 hours expiration time 
        });
        // and send response. 
        res.status(200).sendEnc({ auth: true, token: token, user: user });
    });
});

// Export router 
module.exports = router; 