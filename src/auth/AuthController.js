     ///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// AUTH/CRYPTO DEPENDENCIES
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config');

// USER SCHEMA
const User = require('../user/User');

// ROUTER ENCODING ATRIBUTES 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


            ///* Auth Routes *///

// POST: CREATE NEW USER
router.post('/register', (req, res) => {
    // Inmediately hash the password. 
    let hashedPaswword = bcrypt.hashSync(req.body.password, 8);

    // Create a new User instance and save it in DB.
    User.create({
        name: req.body.name, 
        email: req.body.email,
        password: hashedPaswword
    },
    (err, user) => {
        // If error return error.
        if (err) return res.status(500).send('There was a problem registering the user.')

        // If succesful, create token and return 200.
        let token = jwt.sign({id: user._id }, config.secret)
        res.status(200).send({ auth: true, token: token }); 
    });
});

// GET: SPECIFIC USER DETAILS FROM DB
router.get('/identify', (req, res) => {
    // Get token from request header.
    let token = req.headers['x-access-token'];
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
        res.status(200).send({ auth: true, token: token });
    });
});

// Export router 
module.exports = router; 