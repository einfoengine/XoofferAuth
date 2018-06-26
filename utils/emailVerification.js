'uset strict';
const xofferCommonConfig = require("xooffer-common")('config');
const utils = require('../utils/utils');
const logger = require('logger').createLogger();
const chalk = require('chalk');
var emailTemplate = '<h4>Please click the link below to verify your <a href="www.xooffer.com">xooffer</a> account</h4>' +
            '<a href="${URL}">${URL}</a>' + '<p>Thank you for your support</p>' + '<div><h4>contact us</h4></div>';

class EmailVerification {
  constructor (persistentUser, tempUserCollection, userType) {
    this.nev = require('email-verification')(db);
    this.persistentUser = persistentUser || null;
    this.tempUserCollection = tempUserCollection || null;
    this.userType = userType || null;
  }
  configure () {
    this.nev.configure({
      verificationURL: xofferCommonConfig.domain + '/verify-email/' + this.userType + '/${URL}',
      URLLength: 48,
      persistentUserModel: this.persistentUser,
      tempUserCollection: this.tempUserCollection,
      emailFieldName: 'email',
      passwordFieldName: 'password',
      URLFieldName: 'GENERATED_VERIFYING_URL',
      expirationTime: 864000,
      transportOptions: {
        service: 'Gmail',
        auth: {
          user: xofferCommonConfig.emailId,
          pass: xofferCommonConfig.emailpassword
        }
      },
      verifyMailOptions: {
        from: 'Do Not Reply <support@xooffer.com>',
        subject: 'XOOFFER | Please confirm account',
        html: emailTemplate,
        text: 'Please confirm your account by clicking the following link: ${URL}'
      }
    }, function (err, options) {
      console.log(err)
    })
  }

  generateTemporaryUserModel () {
    this.nev.generateTempUserModel(this.persistentUser, function (err, tempUserModel) {
      if (err) {
        logger.error('Error generating temp user: ', err)
        return
      }
    })
  }

  createTemporaryUser (newUser, email, cb) {
    var thatNev = this.nev
    this.nev.createTempUser(newUser, function (err, existingPersistentUser, newTempUser) {
      if (err) {
        logger.error('Creating temp user FAILED, ', chalk.red(err))
        return cb({'message': 'Creating temp user FAILED',err:true})
      }
      if (existingPersistentUser) {
        logger.error('Sending verification email FAILED ', chalk.red('already signedup and confirmed'))
        return cb({message: 'You have already signed up and confirmed your account',err:false})
      }
      if (newTempUser) {
        var URL = newTempUser[thatNev.options.URLFieldName]

        thatNev.sendVerificationEmail(email, URL, function (err, info) {
          if (err) {
            logger.error('Sending verification email FAILED ', chalk.red(err))
            return cb({'message': 'Sending verification email FAILED',err:true})
          }
          return cb({'message': 'An email is sent to you, please check your mailbox.',err:false})
        })
      } else {
        logger.error('Sending verification email FAILED ', chalk.red('already signedup'))
        return cb({'message': 'You have already signed up. Please check your email to verify your account.',err:false})
      }
    })
  }

  resendVerificationEmail (email, res) {
    this.nev.resendVerificationEmail(email, function (err, userFound) {
      if (err) {
        return res.status(403).send(utils.generateErrorInfo('resending verification email FAILED', 403, null))
      }
      if (userFound) {
        return res.send(utils.generateSuccessInfo('An email has been sent to you, yet again. Please check it to verify your account.', 200, null))
      } else {
        return res.status(403).send(utils.generateErrorInfo('Your verification code has expired. Please sign up again.', 403, null))
      }
    })
  }

  confirmTemporaryUser (url, cb) {
    var thatNev = this.nev
    this.nev.confirmTempUser(url, function (err, user) {
      if (err) {
        logger.error(chalk.red('Error confirming email, '), err)
        return cb(true,{message: 'Sending confirmation email FAILED'})
      }
      if (user) {
        
        thatNev.sendConfirmationEmail(user.email, function (err, info) {
          if (err) {
            logger.error(chalk.red('Sending email failed : ', user))
            return cb(true,{message: 'Sending confirmation email FAILED'})
          }
          return cb(false,{message: 'Confirmed'},user)
        })
      } else {
        logger.error(chalk.red('Confirming temp user FAILED, '), user)
        return cb(true,{message: 'Confirming temp user FAILED'})
      }
    })
  }
}

module.exports = function (persistentUser, tempUserCollection, userType) {
  return new EmailVerification(persistentUser, tempUserCollection, userType)
}
