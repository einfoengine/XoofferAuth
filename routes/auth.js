'use strict';
const authService = require('../services/authService');
const userService = require('../services/userService');
const vendorService = require('../services/vendorService');

const logger = require('logger').createLogger();
const xofferCommonConfig = require("xooffer-common")('config');
// var logger = require('logger').createLogger('development.log');
let middleware = require('../middlewares/apiMiddleware');

module.exports = function (app) {

  app.post('/auth/login/:type', function (req, res) {
    authService.userLogin(req.body.email, req.body.password, req.params.type, function (message) {
      res.json(message);
    })
  });

  app.post('/auth/signup/:type', function (req, res) {
    authService.userSignup(req.body.email, req.body.password, req.body.country, req.body.brandName, req.params.type, function (message) {
      if (message.err) {
        logger.error(message.message)
        res.sendStatus(400);
      } else {
        res.json(message);
      }

    })
  });

  app.put('/auth', middleware.checkAccess, function (req, res) {
    if (Object.keys(req.body).length === 0) {
      return res.sendStatus(400);
    }
    if (req.user.accountType === 'GENERAL') {
      userService.updateUser(req.user._id, req.body, function (message) {
        res.json(message);
      })
    } else if (req.user.accountType === 'VENDOR') {
      vendorService.updateVendor(req.user._id, req.body, function (status,message) {
        res.status(status).json(message);
      })
    } else {
      return res.sendStatus(400);
    }
  });

  app.get('/auth', middleware.checkAccess, function (req, res) {
    if (req.user.accountType === 'GENERAL') {
      userService.getUser(req.user._id, function (status, message) {
        res.status(status).json(message);
      });
    } else if (req.user.accountType === 'VENDOR') {
      vendorService.getUser(req.user._id, function (status, message) {
        res.status(status).json(message);
      });
    } else {
      return res.sendStatus(400);
    }
  });

  app.put('/auth/update-password',middleware.checkAccess, function(req,res){
    authService.changePasword(req.body.oldPassword,req.body.newPassword, req.user, function (status, message) {
      res.status(status).json(message);
    })
  });

  app.put('/auth/update-email/:email', middleware.checkAccess, function (req, res) {
    authService.sendTokenToUpdatedEmail(req.params.email, req.user, function (status, message) {
      res.status(status).json(message);
    })
  });

  app.get('/auth/update-email-verify/:token', function (req, res) {
    authService.verifyUpdatedEmailToken(req.params.token, function (status, message) {
      if (status === 200) {
        res.redirect(xofferCommonConfig.userEmailConfimRedirect)
      } else {
        res.status(status).json(message);
      }
    })
  });

  app.get('/verify-email/:type/:URL', function (req, res) {
    authService.confirmUserEmail(req.params.URL, req.params.type, function (message) {
      if (message.message === 'Confirmed') {
        res.redirect(xofferCommonConfig.userEmailConfimRedirect);
      } else {
        res.json(message);
      }
    })
  });

  app.post('/auth/logo/vendor', middleware.accessVendorOnly, function (req, res) {
    let data = {
      id: req.user._id,
      files: req.files
    };
    vendorService.uploadLogo(data, function (status,message) {
      res.status(status).json(message);
    });
  });
};
