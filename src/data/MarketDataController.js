
///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const axios = require('axios');

// CONFIG FILE 
const config = require('../../config');

// // ROUTER ENCODING ATRIBUTES 
// router.use(bodyParser.urlencoded({ extended: false }));
// router.use(bodyParser.json());

///* Data Routes *///


// POST: GET ETH HISTORICAL DATA.
router.post('/get_historical_data', function(req, res) {
    console.log(req.body)
    console.log('\n\n HIIIIIIIIIIT \n\n')
    // Get the currency from the body.
    const currency = req.body.currency;
    // Get current time up to minutes.
    const dayAndHour = moment().format().slice(0, 13)
    const minutes = moment().format().slice(14, 16)
    // Then subtract based on timeframe.
    const startTime = start(req.body.timeframe)
    
    // Call Nomics API.
    axios.get('https://api.nomics.com/v1/exchange-rates/history?key=' 
    + config.nomics.key + '&currency=' + currency
    + '&start='+ startTime + 'T00%3A00%3A00Z'
    + '&end=' + dayAndHour + '%3A' + minutes + '%3A00Z')
        // Then send status 200 with rates array.
        .then( async response => {
            res.status(200).send({ 
                error: false, 
                rates: response.data.map(d =>  parseFloat(d.rate).toFixed(2))
            })
        })
        .catch(err => console.log(err))
});

// HELPER METHODS // 
const start = timeframe => {
    switch (timeframe) {
        case 'week':
            return moment().subtract(7, 'days').format().slice(0, 10);
        case 'month':
            return moment().subtract(1, 'month').format().slice(0, 10);
        case 'quarter':
            return moment().subtract(3, 'month').format().slice(0, 10);
        case 'year':
            return moment().subtract(12, 'month').format().slice(0, 10);
        default:
            return moment().subtract(3, 'month').format().slice(0, 10);
    }
}

// Export router 
module.exports = router; 