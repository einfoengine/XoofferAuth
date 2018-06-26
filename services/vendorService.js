'use strict';
let Vendor = require("xooffer-common")('models').Vendor(db);
const logger = require('logger').createLogger();
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const xofferCommonConfig = require("xooffer-common")('config');

let vendorService = {
  createFolder: function (id, cb) {
    let dir = xofferCommonConfig.vendorImageAddresUbuntu + id;
    mkdirp(dir, function (err) {
      if (err) {
        return cb({ message: 'error creating vendor folder' });
      }
      return cb({ message: 'Vendor folder created successfully' });
    });
  },

  getUser: function (id, cb) {
    Vendor.findById(id, function (err, user) {
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
  },

  updateVendor: function (id, body, cb) {
    Vendor.findById(id, function (err, vendor) {
      if (err) {
        logger.error(err);
        return cb(400,"Can not update vendor");
      }
      if (!vendor) {
        return cb(400,"No account found")
      }
      vendor.updated = Date.now();
      vendor.brandName = body.brandName || vendor.brandName;
      vendor.description = body.description || vendor.description;
      vendor.contactPerson = body.contactPerson || vendor.description,
      vendor.contactPersonEmail = body.contactPersonEmail || vendor.description,
      vendor.contactPersonPhone = body.contactPersonPhone || vendor.description,
      vendor.save(function (err, res) {
        if (err) {
          logger.error(err);
          return cb(400,'Can not update vendor');
        }
        return cb(200,"Vendor updated successfully");
      })
    })
  },

  updateOffer: function (data, cb) {
    let updates = {
      $push: { offers: data.offerId },
      updated: Date.now()
    };
    Vendor.findByIdAndUpdate(data.brandId, updates, function (err, res) {
      if (err) {
        return cb({ message: "Can not update vendor" });
      }
      if (!res) {
        return cb({ message: "No vendor found" })
      }
      cb({ message: "Vendor offer field updated" });
    })
  },

  deleteOffer: function (data, cb) {
    let updates = {
      $pull: { offers: data.offerId },
      updated: Date.now()
    };
    Vendor.findByIdAndUpdate(data.brandId, updates, function (err, res) {
      if (err) {
        return cb({ message: "Can not update vendor" });
      }
      cb({ message: "Vendor offer field updated" });
    })
  },

  updateStore: function(data,cb){
    let updates = {
      $push: { stores: data.storeId },
      updated: Date.now()
    };
    Vendor.findByIdAndUpdate(data.brandId, updates, function (err, res) {
      if (err) {
        return cb({ message: "Can not update vendor" });
      }
      if (!res) {
        return cb({ message: "No vendor found" })
      }
      cb({ message: "Vendor Store field updated" });
    })
  },

  deleteStore: function (data, cb) {
    let updates = {
      $pull: { stores: data.storeId },
      updated: Date.now()
    };
    Vendor.findByIdAndUpdate(data.brandId, updates, function (err, res) {
      if (err) {
        return cb({ message: "Can not update vendor" });
      }
      cb({ message: "Vendor store field updated" });
    })
  },

  uploadLogo: function (data, cb) {
    let that = this;
    let v = data.files.logo;
    if (!data.files) {
      return cb(400,"No Files Provided");
    }
    let upload = ()=>{
      if (v.mimetype === 'image/jpeg' || v.mimetype === 'image/gif' || v.mimetype === 'image/png') {
        v.mv(xofferCommonConfig.vendorImageAddresUbuntu + data.id + '/' + v.name, function (err) {
          if (err) {
            logger.error('Can not upload file: ', err);
            return cb(400,"Can not upload file");
          } else {
            let updates = {
              logo: v.name,
              updated: Date.now()
            };
            Vendor.findByIdAndUpdate(data.id, updates, function (err, res) {
              if (err) {
                return cb(400,"Can not update vendor logo");
              }
              if (!res) {
                return cb(400,"No vendor found")
              }
              cb(200,"Vendor logo updated");
            })
          }
        });
      } else {
        cb(400,"Unsupported File")
      }
    }

    Vendor.findById(data.id,function(err,vendor){
      if(vendor.logo){
        that.removeLogo(data.id,vendor.logo,function(message){
          logger.info('Vendor previous logo delete: ',message)
          upload();
        })
      }else{
        upload();
      }
    });
  },//==> end upload images
  removeLogo: function (id, fileName,cb) {
    rimraf(xofferCommonConfig.vendorImageAddresUbuntu + id + '/' + fileName, function (err) {
      if (err) {
        return cb(400,'Error deleting file');
      }
      return cb(200,"File removed successfully");
    });
  }
}

module.exports = vendorService;