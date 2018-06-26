'use strict';
const authService = require('../services/authService');
const userService = require('../services/userService');
const vendorService = require('../services/vendorService');
const token = require('../utils/token');
const Vendor = require("xooffer-common")('models').Vendor(db);
const User = require("xooffer-common")('models').User(db);


const auth = new cote.Responder({
  name: 'User Authentication and Authorization Responder',
  namespace:'Auth'
});

auth.on('API Access', (req, cb) => {
  if (req.userType === 'vendor') {
    token.verifyToken(req.token, Vendor, function (result) {
      cb(result);
    })
  } else if (req.userType === 'user') {
    token.verifyToken(req.token, User, function (result) {
      cb(result);
    })
  } else if (req.userType === 'common') {
    token.verifyToken(req.token,{type:'common',Vendor:Vendor,User:User} , function (result) {
      cb(result);
    })
  }else{
    cb(false)
  }
});

