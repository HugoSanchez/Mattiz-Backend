     ///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const plaid = require('plaid');

// CONFIG FILE 
const config = require('../../config');

// ROUTER ENCODING ATRIBUTES 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// PLAID CONFIG
const client_id = config.plaid.client_id;
const secret = config.plaid.secret;
const public_key = config.plaid.public_key;
const plaid_env = plaid.environments.sandbox;
const version = { version: '2018-05-22' };

// INITIALIZE THE PLAID CLIENT
const plaidClient = new plaid.Client (
    client_id,
    secret,
    public_key,
    plaid_env,
    version
);

// STORE ACCESS TOKEN IN MEMORY 
// Temporary, not in production.
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;

            ///* Plaid Routes *///

// POST: EXCHANGES PUBLICK TOKEN FOR ACCESS TOKEN.
router.post('/get_access_token', function(req, res) {
    // First, get the public_token and return error if it doesn't exist. 
    PUBLIC_TOKEN = req.body.public_token
    if ( !PUBLIC_TOKEN ) return res.status(401).send({ error: true, message: 
        'No token provided.' });
    
    // Call Plaid method to exchange token.
    plaidClient.exchangePublicToken(PUBLIC_TOKEN, function(error, token) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
        JSON.stringify(error) });
        
        // If not, get the access token 
        ACCESS_TOKEN = token.access_token;
        ITEM_ID = token.item_id;
        
        // and send it as response.
        return res.status(200).send({ error: false, 
        access_token: ACCESS_TOKEN, item_id: ITEM_ID });

    });
});

// Export router 
module.exports = router; 