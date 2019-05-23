//引入模块
const md5 = require('md5');
const channelModel = require('../models/channel.js');
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
	await checkLogin(ctx);
	await ctx.render('channel/channel-list', {
		session : ctx.session,
	})
}

exports.postChannel_list = async ctx => {
	console.log(456)
}