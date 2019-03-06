var mongoose = require('mongoose');
var config = require('./config')

mongoose.connect(config.dbUrl);

mongoose.connection.on("open", function(ref) {
    console.log("\n Connected to mongo server.");
});
  
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!");
    return console.log(err);
});
  
