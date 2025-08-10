//Connecting To Database
const mongoose = require("mongoose");
require("dotenv").config();
exports.dbconnect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("DB CONNECTED SUCCESFULLY"))
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
};
