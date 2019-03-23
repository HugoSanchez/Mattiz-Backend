

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
    
    // Then call Plaid method to exchange token.
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

    // Set end and start dates.
    let startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')

    // Retrieve transaction information.
    plaidClient.getAllTransactions(req.headers.authorization, startDate, endDate, function(error, result) {
        // If error, return error message. 
        if ( error ) return res.status(401).send({ error: true, message: 
            JSON.stringify(error) });

        // If not, send back response with all transaction result.
        return res.status(200).send({ error: false, data: result });
    });
});

// GET: FOR A GIVEN NUMBER OF ACCOUNTS, IT RETURNS A UNIFIED ARRAY OF TRANSACTIONS FOR THE LAST 90 DAYS. 
router.get('/last_90_days_transactions', async function(req, res){

    // Set end and start dates.
    let startDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')    

    // Iterate over every access token, and return the asociated transactions.
    retrieveTransactionsForEachAccount(req.body.accessTokenArray, startDate, endDate).then(result => {
        // Merge all transactions toghether sorted by date.
        unifiedTransactionArray = sortByDate(result[0].concat(result[1]))
    })

});


///* Helper Methods *///


const computeTotalBalance = (accounts) => {
    // Initialize counter and set to 0.
    let totalBalance = 0;
    // Iterate over accounts array and for each one of them,
    accounts.forEach( account => {
        // sum each it's balance to the counter variable.
        totalBalance = totalBalance + account.balances.current
    });
    // Return the final counter.
    return totalBalance
}

// Returns a promise which resolves to an array of arrays each containing the corresponding transactions. 
const retrieveTransactionsForEachAccount = async ( accessTokenArray, startDate, endDate ) => {
    // For each access token,
    return Promise.all(accessTokenArray.map(access_token => {
        // it calls getTransactionsPromsise() helper method. 
        return getTransactionsPromsise(access_token, startDate, endDate);
    }))
    // For every transaction array it returns, merge them into a single array. 
    .then(merge) 
}

// Plaid .getTransactions() method wraped as a promise. 
const getTransactionsPromsise = (access_token, startDate, endDate) => {
    return new Promise( function(resolve, reject) {
        plaidClient.getTransactions(access_token, startDate, endDate, function(error, result) {
            if (error) { reject(error) };
            resolve(result.transactions);
        }
    )}
)}

// Concat arrays.
function merge(arrays) {
    //  Take 'n' number of arrays and turn them into 1.
    return [].concat(arrays)
}

// Sort array elements by date. 
const sortByDate = (array) => {
    // Iterate over array
    return array.sort((a, b) => {
        // subtracting the first element to the second. 
        return new Date(b.date) - new Date(a.date)
    })
}

// Export router 
module.exports = router; 