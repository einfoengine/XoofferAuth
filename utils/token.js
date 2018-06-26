'use strict';
const jwt = require('jsonwebtoken');
const xofferCommonConfig = require("xooffer-common")('config');

var token = {
  generateToken: function (data) {
    var token = jwt.sign(data, xofferCommonConfig.appSecret, { algorithm: 'HS256', expiresIn: xofferCommonConfig.tokenExpiry })
    return token
  },
  verifyToken: function (token,userType, cb) {
    if (token) {
      jwt.verify(token, xofferCommonConfig.appSecret, function (err, decoded) {
        if (err) {
          if(err.name==='TokenExpiredError'){
            cb('tokenExpired')
          }else{
            cb(false)
          }
        } else {
          if(userType.type === 'common'){
            if(decoded.accountType === 'VENDOR'){
              userType = userType.Vendor;
            }else if(decoded.accountType === 'GENERAL'){
              userType = userType.user;
            }
          }
          userType.findOne({'email': decoded.email}, function (err, user) {
            if (err) {
              cb(false)
            } else {
              if (user) {
                 
                delete user.password;
                delete user.loginAttempts;
                delete user.loggedIn;
                delete user.lastLogin;
                delete user.lockUntil;
                delete user.updateEmailToken;
                delete user.GENERATED_VERIFYING_URL;
                
                cb(user);
              } else {
                cb(false)
              }
            }
          })
        }
      })
    } else {
      return cb(false)
    }
  },
  verifyAdmin: function (req, res, next) {
    var usertype = req.user.accountType

    if (usertype === xofferCommonConfig.accountType.admin) {
      next()
    } else {
      return res.status(403).send({message: 'User not authorized'})
    }
  }
}
module.exports = token
