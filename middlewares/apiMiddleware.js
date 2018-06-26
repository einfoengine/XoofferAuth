'use strict';
let client = new cote.Requester({ 
  name: 'API Access Verification Requester',
  namespace:'Auth'
 });

module.exports = {
  checkAccess: function (req, res, next) {
    
    let token = req.headers['x-access-token'];
    let type = '';
    if (!token) {
      res.sendStatus(401)
    } else {
      client.send({
        type: 'API Access',
        token: token,
        userType:'common'
      }, function (data) {
        if (!data) {
          res.sendStatus(401)
        } else {
          if (data === 'tokenExpired') {
            res.sendStatus(403)
          } else {
            req.user = data;
            next();
          }
        }
      });
    }
  },
  accessVendorOnly: function (req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token) {
      res.send('Unauthorized')
    } else {
      client.send({
        type: 'API Access',
        token: token,
        userType: 'vendor'
      }, function (data) {
        if (!data) {
          res.send('Unauthorized')
        } else {
          if (data === 'tokenExpired') {
            res.sendStatus(403)
          } else {
            req.user = data;
            next();
          }
        }
      });
    }
  }
}
