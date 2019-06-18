//引入模块
const md5 = require('md5');
const channelModel = require('../models/channel.js');
const userModel = require('../models/user.js')
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment')

exports.getMessage_list = async ctx => {
    await ctx.render('message/message-list')
}

exports.postMessage_list = async ctx => {

}

exports.getMessage_details = async ctx => {

}

exports.postMessage_details = async ctx => {

}