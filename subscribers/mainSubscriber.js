'use strict';
let vendorService = require('../services/vendorService');
const keyWordService = require('../services/keyWordService');
const logger = require('logger').createLogger();

const vendorSubscriber = new cote.Subscriber({
  name: 'Vendor subscriber',
  namespace: 'Vendor'
});
vendorSubscriber.on('Vendor Created', (data) => {
  vendorService.createFolder(data.id, function (message) {
    logger.info('Vendor service: create folder ', message)
  });
});

