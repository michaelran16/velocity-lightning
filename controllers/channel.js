//引入模块
const md5 = require('md5');
const channelModel = require('../models/channel.js');
const userModel = require('../models/user.js')
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment')

const {
	Account,
	Asset,
	Keypair,
	Network,
	Operation,
	Server,
	TransactionBuilder,
} = require('stellar-sdk');
Network.useTestNetwork();

const server = new Server("https://horizon-testnet.stellar.org");

exports.getChannel_list = async ctx => {
	let list,
		count;

	await checkLogin(ctx);

	await channelModel.findDataCountById([ctx.session.id])
	.then(async (res) => {
		count = res[0]['count']
	}).catch(err => {
		console.log(err)
	})

	await channelModel.listData([1, ctx.session.id])
	.then(async (res) => {
		list = res
	}).catch(err => {
		console.log(err)
	})
	await ctx.render('channel/channel-list', {
		session : ctx.session,
		list : list,
		countPage : Math.ceil(count / 10)
	})
}

exports.postChannel_list = async ctx => {
	let page = ctx.request.body.page;
	await channelModel.listData([page, ctx.session.id])
	.then(result => {
		ctx.body = result
	}).catch(() => {
		ctx.body = 'error'
	})
}

exports.getChannel_details = async ctx => {
	let info
	await channelModel.findDataById([ctx.params.id])
	.then(res => {
		info = res[0]
	}).catch(err => {
		console.log(err)
	})
	console.log(info)
	await ctx.render('channel/channel-details', {
		session : ctx.session,
		info : info,
	})
}

exports.postChannel_details = async ctx => {

}

exports.getChannel_create = async ctx => {
	await ctx.render('channel/channel-create', {
		session : ctx.session,
	})
}

exports.postChannel_create = async ctx => {
	let {channel_name, amount, user_name} = ctx.request.body;

	await userModel.findDataByName([user_name])
	.then( async (res) => {
		if (res.length && res[0].user_status==1) {
			ctx.body = {
				code : 200,
				message : '申请成功'
			}
		} else {
			ctx.body = {
				code : 500,
				message : '对方名称输入错误'
			}
		}
		console.log(res)
	}).catch(err => {
		console.log(err)
	})
}