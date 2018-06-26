var utils = {
  
  generateErrorInfo:function(msg,status,err){
    return {class:'error',message:msg,status:status,error:err}
  },
  generateSuccessInfo:function(msg,status,data){
    return {class:'success',message:msg,status:status,data:data}
  }
}

module.exports = utils;
