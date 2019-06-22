// 引入模块
const md5 = require('md5');
const channelModel = require('../models/channel.js');
const userModel = require('../models/user.js');
const messageModel = require('../models/message.js');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment');

exports.getMessage_list = async ctx => {
    await checkLogin(ctx);

	let list,
		count;

	await messageModel.findDataCountById([ctx.session.id])
	.then(async (res) => {
		count = res[0]['count']
	}).catch(err => {
		console.log(err)
	})

	await messageModel.listData([1, ctx.session.id])
	.then(async (res) => {
		list = res
	}).catch(err => {
		console.log(err)
    })
    
    await ctx.render('message/message-list', {
		session : ctx.session,
		list : list,
		countPage : Math.ceil(count / 10)
	})
}

exports.postMessage_list = async ctx => {
	let page = ctx.request.body.page;
	await messageModel.listData([page, ctx.session.id])
	.then(result => {
		ctx.body = result
	}).catch(() => {
		ctx.body = 'error'
	})
}

exports.getMessage_details = async ctx => {
	await checkLogin(ctx);
	await messageModel.updateReadById([ctx.params.id])
	let info;
	await messageModel.findDataById([ctx.params.id])
	.then(res => {
		if (res[0].message_type==0) {
			ctx.redirect('/channel-invite-create/'+res[0].message_id)
			return false;
		}
	}).catch(err=>{
		console.log(err)
	})
}
