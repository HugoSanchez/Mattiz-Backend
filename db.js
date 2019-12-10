require('dotenv').config();

const mongoose = require('mongoose');

const db = process.env.DB_URL;

mongoose.connect(db);

mongoose.connection.on("open", function(ref) {
    console.log("\n Connected to mongo server.");
});
  
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!");
    return console.log(err);
});