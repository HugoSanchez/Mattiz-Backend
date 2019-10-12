

///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const plaid = require('plaid');

// CONFIG FILE 
const config = require('../../config');

// // ROUTER ENCODING ATRIBUTES 
// router.use(bodyParser.urlencoded({ extended: false }));
// router.use(bodyParser.json());

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
    console.log('HIT EXCHANGE PUBLIC FOR ACCESS')
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

// POST: RETURNS HIGH-LEVEL ACCOUNTS INFORMATION
router.post('/test', function(req, res) {
    console.log('HIT /test ENDPOINT: ', req.body)
    return res.status(200).send({ error: false, data: JSON.stringify(req.body.accessTokenArray) })
});

// POST: RETURNS HIGH-LEVEL ACCOUNTS INFORMATION
router.post('/accounts', function(req, res) {

    console.log('HIT /accounts ENDPOINT: ', req.body)
    getBalancesForEachAccount(req.body.accessTokenArray)
        .then(result => { return res.status(200)
            .send({ error: false, balance: JSON.stringify(result) })
        })
        .catch(error => { return res.status(401)
            .send({ error: true, message:  JSON.stringify(error)})
        })
});

// POST: FOR A GIVEN NUMBER OF ACCOUNTS, 
// IT RETURNS A UNIFIED ARRAY OF TRANSACTIONS FOR THE LAST YEAR. 
router.post('/yearly_transactions', function(req, res) {

    // Set end and start dates.
    let startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')

     // Iterate over every access token, and return the asociated transactions.
     retrieveTransactionsForEachAccount(req.body.accessTokenArray, startDate, endDate)
        // Return all transactions merged toghether and sorted by date.
        .then(result => { return res.status(200)
            .send({ error: false, data: sortByDate(result[0].concat(result[1])) })
        })
        // Return error if occurs (this should be tested), 
        .catch(error => { return res.status(401)
            .send({ error: true, message:  JSON.stringify(error)})
        });
});

// POST: FOR A GIVEN NUMBER OF ACCOUNTS, 
// IT RETURNS A UNIFIED ARRAY OF TRANSACTIONS FOR THE LAST 90 DAYS. 
router.post('/last_90_days_transactions', async function(req, res){

    // Set end and start dates.
    let startDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
    let endDate = moment().format('YYYY-MM-DD')    

    // Iterate over every access token, and return the asociated transactions.
    retrieveTransactionsForEachAccount(req.body.accessTokenArray, startDate, endDate)
        // Return all transactions merged toghether and sorted by date.
        .then(result => { return res.status(200)
            .send({ error: false, tx: sortByDate(result[0].concat(result[1])) })
        })
        // Return error if occurs (this should be tested), 
        .catch(error => { return res.status(401)
            .send({ error: true, message:  JSON.stringify(error)})
        });

});


///* Helper Methods *///

const getBalancesForEachAccount = async ( accessTokenArray ) => {

    return await Promise.all(accessTokenArray.map(async acces_token => {

        return await getBalancePromise(acces_token)
    })) 
}

const getBalancePromise = ( access_token ) => {
    //
    return new Promise ( function(resolve, reject) {
        //
        plaidClient.getBalance(access_token, function(error, result) {
            // Reject if error,
            if (error) { reject(error) };
            //
            resolve(computeTotalBalance(result.accounts))
        })
    })
}

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
const retrieveTransactionsForEachAccount = 
    // Expected params.
    async ( accessTokenArray, startDate, endDate ) => {
    // For each access token,
    return await Promise.all(accessTokenArray.map(async access_token => {
        // it calls getTransactionsPromsise() helper method. 
        return await getTransactionsPromsise(access_token, startDate, endDate);
    }))
    // For every transaction array it returns, merge them into a single array. 
    .then(merge) 
}

// Plaid .getTransactions() method wraped as a promise. 
const getTransactionsPromsise = (access_token, startDate, endDate) => {
    // Create the promise, 
    return new Promise( function(resolve, reject) {
        // Call plaid method,
        plaidClient.getTransactions(access_token, startDate, endDate, function(error, result) {
            // Reject if error,
            if (error) { reject(error) };
            // If not, return the transactions array. 
            resolve(result.transactions);
        });
    });
};

// Concat arrays.
function merge(arrays) {
    //  Take 'n' number of arrays and turn them into 1.
    return [].concat(arrays)
}

// Sort array elements by date. 
const sortByDate = (array) => {
    // Iterate over array
    return array.sort((a, b) => {
        // 'subtracting' the first element to the second. 
        return new Date(b.date) - new Date(a.date);
    });
}

// Export router 
module.exports = router; 