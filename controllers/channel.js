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
	let myData;

	await userModel.findDataById([ctx.session.id])
	.then(async (res) => {
		myData = res[0]
	}).catch(err => {
		console.log(err)
	})

	await userModel.findDataByName([user_name])
	.then( async (res) => {

		if (res.length && res[0].user_status==1) {

			let myKeyPair = Keypair.fromSecret(myData.user_secret_key)
			var sponsor = await server.loadAccount(myKeyPair.publicKey())

			if (parseFloat(sponsor.balances[0].balance) > (parseFloat(amount)+3)) {

				let sponsor_version = Keypair.random()
				let sponsor_ratchet = Keypair.random()
				let receive_version = Keypair.random()
				let receive_ratchet = Keypair.random()

				const setupAccountsTx = new TransactionBuilder(sponsor, {fee: 100}).addOperation(
					Operation.createAccount({
						destination: sponsor_version.publicKey(),
						startingBalance: '1',
					})
				).addOperation(
					Operation.createAccount({
						destination: receive_version.publicKey(),
						startingBalance: '1',
					})
				).addOperation(
					Operation.createAccount({
						destination: receive_ratchet.publicKey(),
						startingBalance: '1',
					})
				)
				.setTimeout(1000)
				.build()
				setupAccountsTx.sign(myKeyPair)
				await server.submitTransaction(setupAccountsTx)

				ctx.body = {
					code : 200,
					message : '申请成功'
				}
			} else {
				ctx.body = {
					code : 500,
					message : '余额不足'
				}
				return false;
			}
		} else {
			ctx.body = {
				code : 500,
				message : '对方异常或不存在，请重新输入'
			}
		}
	}).catch(err => {
		console.log(err)
	})
}