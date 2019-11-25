const mongoose = require('mongoose');
const config = require('./config')


mongoose.connect(config.sessionConn);

module.exports = mongoose.connection.on("open", function(ref) {
    console.log("\n Connected to mongo server.");
});
  
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!");
    return console.log(err);
});
  
