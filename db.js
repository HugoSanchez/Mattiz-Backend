const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL);

module.exports = mongoose.connection.on("open", function(ref) {
    console.log("\n Connected to mongo server.");
});
  
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!");
    return console.log(err);
});
  
