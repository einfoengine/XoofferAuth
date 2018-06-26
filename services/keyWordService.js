const logger = require('logger').createLogger();
const Word = require("xooffer-common")('models').Word(db);

module.exports = {
  
  addKeyword: function (words,cb) {
    let _words = words.split(',').map(i => {

      Word.findOne({ word: i.trim() }, function (err, v) {
        if (err) return err;
        if(v){
          Word.findOneAndUpdate({word : i.trim()}, {$inc : {'items' : 1}}).exec();
        }
        else {
          let word = new Word({
            word: i.trim()
          });
          word.save(err => {
            if (err) return logger.error(err);
          });
        }
      });
    });
    cb([])
  },
  removeKeywords: function (words,cb){
    let _words = words.split(',').map(i => {

      Word.findOne({ word: i.trim() }, function (err, v) {
        if (err) return logger.error(err);
        if(v){
          if(v.items == 1){
            v.remove();
          }else if(v.items >1){
            v.items = v.items-1;
            v.save();
          }
          
        }
      });
    });
    cb([])
  },
  getKeyWords: function (term,sortBy,limit, cb) {
    var regex = new RegExp('^' + term.trim(), 'i');
    let _sortBy = sortBy || 'clicked';
    let _limit = limit || 10;

    var query = Word.find({ word: regex }).sort({clicked:'asc'}).limit(10);
    query.exec(function (err, words) {
      if (err) return cb([])
      cb(words)
    });
  },
  updateKeyword: function (word, cb) {
    Word.findOneAndUpdate({word : word.trim()}, {$inc : {'clicked' : 1}}).exec();
  }
};