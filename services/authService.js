'use strict';
const bcrypt = require('bcrypt');
const xofferCommonConfig = require("xooffer-common")('config');
let Vendor = require("xooffer-common")('models').Vendor(db);
let User = require("xooffer-common")('models').User(db);
let vendorEmailVerification = require('../utils/emailVerification')(Vendor, 'xooffer_temp_vendor', 'vendor');
let userEmailVerification = require('../utils/emailVerification')(User, 'xooffer_temp_user', 'user');
const Token = require('../utils/token');
const logger = require('logger').createLogger();
const chalk = require('chalk');
const uuidv1 = require('uuid/v1');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: xofferCommonConfig.emailId,
    pass: xofferCommonConfig.emailpassword
  }
});

let VendorPublisher = new cote.Publisher({
  name: 'Vendor Publisher',
  namespace: 'Vendor'
});
/***********************************************
  Initialize Email Verification for Vendor
***********************************************/
vendorEmailVerification.configure();
vendorEmailVerification.generateTemporaryUserModel();

/********************************************
  Initialize Email Verification Basic User
********************************************/
userEmailVerification.configure();
userEmailVerification.generateTemporaryUserModel();

let checkUserType = function (type) {
  if (type === 'user') {
    return User;
  } else if (type === 'vendor') {
    return Vendor;
  } else {
    return false
  }
}

module.exports = {
  userLogin: function (email, password, type, cb) {
    let userType = {};
    if (!email && !password) {
      return cb({ message: 'Email or password is incorrect', error: false })
    }
    if (email) {
      email = email.toLowerCase();
    }
    userType = checkUserType(type);
    if (!userType) {
      return cb({ message: 'Invalid UserType', error: true })
    }
    userType.getAuthenticated(email, password, function (err, user, message) {
      if (err) {
        return cb({ message: 'error login', error: true })
      }
      if (!user) {
        return cb({ message: message, error: false })
      }
      if (user) {
        logger.info(user);
        let _user = {
          email: user.email,
          _id: user._id,
          accountType: user.accountType,
          brandName: user.brandName
        };
        var token = Token.generateToken(_user)
        return cb({ token: token })
      }
    })
  },
  userSignup: function (email, password, country, brandName, type, cb) {
    let userType = {};
    if (email) {
      email = email.toLowerCase()
    }
    userType = checkUserType(type);
    if (!userType) {
      return cb({ message: 'Invalid UserType', err: true })
    }
    if (email) {
      email = email.toLowerCase();
    }
    userType.findOne({ 'email': email }, function (err, user) {
      if (err) {
        logger.error(err)
        return err
      }
      if (user) {
        return cb({ message: 'That email is already taken.', err: false, emailTaken: true })
      } else {
        bcrypt.genSalt(xofferCommonConfig.salt_work_factoral, function (err, salt) {
          if (err) {
            logger.error(err)
            return err
          }
          bcrypt.hash(password, salt, function (err, hash) {
            if (err) {
              logger.error(err)
              return err
            }

            if (userType.collection.collectionName === 'vendors') {
              var newUser = new userType({
                brandName: brandName,
                email: email,
                password: hash,
                country: country
              })
              vendorEmailVerification.createTemporaryUser(newUser, email, function (message) {
                cb(message)
              });
            } else if (userType.collection.collectionName === 'users') {
              var newUser = new userType({
                email: email,
                password: hash
              })
              userEmailVerification.createTemporaryUser(newUser, email, function (message) {
                cb(message);
              })
            } else {
              cb({ message: 'Unvalid User Type', err: true })
            }
          })
        })
      }
    });
  },
  confirmUserEmail: function (url, type, cb) {
    if (type === 'user') {
      userEmailVerification.confirmTemporaryUser(url, function (err, message, user) {
        cb(message)
      })
    } else if (type === 'vendor') {
      vendorEmailVerification.confirmTemporaryUser(url, function (err, message, vendor) {
        console.log(vendor)
        cb(message);
        if (!err) {
          VendorPublisher.publish('Vendor Created', { id: vendor._id })
        }
      })
    }
  },
  verifyUpdatedEmailToken: function (token, cb) {
    if (!token) {
      return cb(400, 'No token')
    }

    jwt.verify(token, xofferCommonConfig.appSecret, function (err, decoded) {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return cb(401, 'Token Expired, Please send a new request');
        } else {
          return cb(400, 'Invalid token');
        }
      } else {
        let type = {};
        logger.info(decoded);
        if (decoded.type === 'VENDOR') {
          type = Vendor;
        } else if (decoded.type === 'GENERAL') {
          type = User;
        } else {
          return cb(401, 'Unauthorized');
        }

        type.findOne({ 'email': decoded.email }, function (err, user) {
          if (err) {
            return cb(400, 'Invalid token');
          } else {
            if (user) {
              user.email = decoded.newEmail;
              user.updated = Date.now();
              user.updateEmailToken = null;
              user.save(function (err, res) {
                if (err) {
                  logger.error(err);
                  return cb(400, 'Can not update email');
                }
                return cb(200, 'Email Updated');
              });
            } else {
              return cb(400, 'Invalid token');
            }
          }
        })
      }
    })

  },
  sendTokenToUpdatedEmail: function (email, user, cb) {
    logger.info("Email update request, To: From: ", email, user.email);
    if (email != user.email) {

      let type = {};
      if (user.accountType === 'VENDOR') {
        type = Vendor;
      } else if (user.accountType === 'GENERAL') {
        type = User;
      } else {
        return cb(400, 'Invalid request');
      }
      let token = jwt.sign({ email: user.email, type: user.accountType, newEmail: email }, xofferCommonConfig.appSecret, { algorithm: 'HS256', expiresIn: '10h' });

      type.findOneAndUpdate({ email: email }, { updateEmailToken: token }, function (err, res) {
        if (err) {
          return cb(400, 'can not update email');
        }

        let mailOptions = {
          from: xofferCommonConfig.emailId,
          to: email,
          subject: 'XOOFFER | DO NOT REPLY | Your email update request',
          html: `<h2>Please click the link below</h2>
                <a href="${xofferCommonConfig.domain}/auth/update-email-verify/${token}">${xofferCommonConfig.domain}/update-email-verify/${token}</a> 
                `
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            logger.error(err);
            return cb(400, 'Error!, Can not update email, internal problem.');
          } else {
            logger.info(info)
            return cb(200, 'Email sent, please check your mail box.')

          }
        });
      });

    } else {
      return cb(400, 'Email same as previous');
    }
  },
  changePasword: function(oldPassword,newPassword, user,cb){
    if(!oldPassword && !newPassword){
      return cb(400,'Password missing');
    }
    let type = {};
    if (user.accountType === 'VENDOR') {
      type = Vendor;
    } else if (user.accountType === 'GENERAL') {
      type = User;
    } else {
      return cb(400, 'Invalid request');
    }
    type.findById(user._id,function(err,user){
      if(err) return cb(400,'Can not update password');
      if(user){
        user.comparePassword(oldPassword,function(err,isMatch){
          if(err) return cb(400,'Password did not matched')
          if(isMatch){
            bcrypt.genSalt(xofferCommonConfig.salt_work_factoral, function (err, salt) {
              if(err) return cb(400,'Can not update password')
              bcrypt.hash(newPassword, salt, function (err, hash) {
                if(err) return cb(400,'Can not update password')               
                user.password = hash;
                user.updated = Date.now();
                user.save(function(err,res){
                  if(err) return cb(400,'Can not update password')
                  return cb(200,'Password updated sucessfully');
                }) 
              })
            })

          }else{
            return cb(400,'Password did not matched');
          }
        })
      }else{
        return cb(400,'Can not update password');
      }
    })
    
  },

  logout: function (req, res) {

  }
}
