'use strict';
let User = require("xooffer-common")('models').User(db);
const logger = require('logger').createLogger();
let userService = {
  updateUser: function (id, body, cb) {
    User.findById(id, function (err, user) {
      if (err) {
        logger.error(err);
        return cb({
          message: "Can not update user"
        });
      }
      if (!user) {
        return cb({
          message: "No user found"
        })
      }
      user.updated = Date.now();
      user.interestedBrands = body.interestedBrands || user.interestedBrands;
      user.interestedCategories = body.interestedCategories || user.interestedCategories;
      user.interestedTags = body.interestedTags || user.interestedTags;
      user.save(function (err, res) {
        if (err) {
          logger.error(err);
          return cb({
            message: "Can not update user"
          });
        }
        cb({
          message: "User updated successfully"
        });
      })
    })
  },
  getUser: function (id, cb) {
    User.findById(id, function (err, user) {
      if (err) {
        logger.error(err);
        return cb(400, "Can not get user info");
      }
      if (!user) {
        return cb(200, "No user found")
      }
      user.password = null;
      cb(200, user);
    })
  }
};

module.exports = userService;