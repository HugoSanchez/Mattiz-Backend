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

            ///* Plaid Routes *///

// POST: EXCHANGES PUBLIC TOKEN FOR ACCESS TOKEN.
router.post('/get_access_token', function(req, res) {
    // First, get the public_token and return error if it doesn't exist. 
    if ( !req.body.public_token ) return res.status(401).send({ error: true, message: 
        'No token provided.' });
    
    // Call Plaid method to exchange token.
    plaidClient.exchangePublicToken(req.body.public_token, function(error, token) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
        JSON.stringify(error) });
        
        // If not, send access_token and item_id as response.
        return res.status(200).send({ error: false, 
        access_token: token.access_token, item_id: token.item_id });
    });
});

// GET: RETURNS HIGH-LEVEL ACCOUNTS INFORMATION
router.get('/accounts', function(req, res) {
    // Retrieve information by validating token in the request header.
    plaidClient.getBalance(req.headers.authorization, function(error, result) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
            JSON.stringify(error) });
        
        // If not, send back response with accounts object plus aggregated balance.
        return res.status(200).send({ error: false, accounts: result.accounts,
            balance: computeTotalBalance(result.accounts) 
        });
    });
});

// GET: RETURNS ALL TRANSACTIONS FOR A GIVEN ITEM
router.get('/yearly_transactions', function(req, res) {
    let startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')
    plaidClient.getAllTransactions(req.headers.authorization, startDate, endDate, function(error, result) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
            JSON.stringify(error) });

        // If not, send back response with accounts object plus aggregated balance.
        return res.status(200).send({ error: false, response: result });
    })
})

router.get('/monthly_transactions', function(req, res){
    let startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')

    plaidClient.getTransactions(req.headers.authorization, startDate, endDate, function(error, result) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
            JSON.stringify(error) });

        // If not, send back response with accounts object plus aggregated balance.
        return res.status(200).send({ error: false, response: result });
    })
})


            ///* Helper Methods *///

const computeTotalBalance = (accounts) => {
    // Initialize counter and set to 0.
    let totalBalance = 0;
    // Iterate over accounts array and for each one of them,
    // sum the balance amount to the counter variable.
    accounts.forEach( account => {
        totalBalance = totalBalance + account.balances.current
    })
    // Return the final counter.
    return totalBalance
}

// Export router 
module.exports = router; 