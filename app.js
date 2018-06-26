
const express = require('express');
const app = express();
const xofferCommonConfig = require("xooffer-common")('config');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || xofferCommonConfig.auth.port;
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');

let cote = require('cote')({ multicast: xofferCommonConfig.multicastAddress });

mongoose.Promise = global.Promise;

mongoose.connect(xofferCommonConfig.xoofferMongodb);

mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + xofferCommonConfig.xoofferMongodb);
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});
app.use(fileUpload({
  limits: { fileSize: xofferCommonConfig.offerMaxImageSize}
}));
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');
//set global variables
global.db = mongoose;
global.cote = cote;

//import routes
require('./routes/auth.js')(app);

//import responders
require('./responders/mainResponder.js');

//import subscribers
require('./subscribers/mainSubscriber.js');

app.listen(port);
console.log('======>Auth running on: ' + port);
