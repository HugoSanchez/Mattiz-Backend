
///* Dependencies & Set Up */// 

// SERVER SIDE DEPENDENCIES
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const axios = require('axios');

// CONFIG FILE 
const config = require('../../config');

// ROUTER ENCODING ATRIBUTES 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

///* Data Routes *///


// GET: .
router.get('/get_historical_data', function(req, res) {
    // First, get the public_token and return error if it doesn't exist. 
    axios.get(
        'https://api.nomics.com/v1/exchange-rates/history?key=' 
        + config.nomics.key
        + '&currency=ETH&start=2018-01-01T00%3A00%3A00Z&end=2019-04-18T00%3A00%3A00Z'
        )
        .then( async response => {
            res.status(200).send({ 
                error: false, 
                rates: response.data.map(d =>  parseFloat(d.rate).toFixed(2))
            })
        })
        .catch(err => console.log(err))
});

// Export router 
module.exports = router; 