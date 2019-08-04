// 引入模块
const md5 = require('md5');
const userModel = require('../models/user.js');
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

// 定义方法
exports.getRegister = async ctx => {
	await checkNotLogin(ctx);
	await ctx.render('user/register', {
		session : ctx.session
	})
}

exports.postRegister = async ctx => {

	let {name, secret} = ctx.request.body

	await userModel.findDataCountByName([name])
	.then(async res => {
		if (res[0].count>0) {
			ctx.body = {
				code : 200,
				message : 'User existed',
			}
		} else {
			try {
				var sourceKeys = Keypair.fromSecret(secret);
				await userModel.insertData([name, sourceKeys.publicKey(), sourceKeys.secret(), moment().format('YYYY-MM-DD HH:mm:ss')])
				.then(res => {
					ctx.body = {
						code : 200,
						message : 'Operation Successful'
					}
				}).catch(err => {
					console.log(err)
				})
			} catch (e) {
				ctx.body = {
					code : 200,
					message : 'stellar account unverified，try again'
				}
				return false;
			}
		}
	}).catch(err => {
		console.log(err)
	})
}

exports.getLogin = async ctx => {
	await checkNotLogin(ctx)
	await ctx.render('user/login', {
		session : ctx.session
	})
}

exports.postLogin = async ctx => {

	let {name, secret} = ctx.request.body

	await userModel.findDataByName([name])
	.then(res => {
		if (res.length && res[0].user_name===name && res[0].user_secret_key===secret) {
			ctx.session = {
				name : name,
				id : res[0].user_id,
			}
			ctx.body = {
				code : 200,
				message : 'Login Successful'
			}
		} else {
			ctx.body = {
				code : 500,
				message : 'Login Failed'
			}
		}
	}).catch(err => {
		console.log(err)
	})
}

exports.getLogout = async ctx => {
	ctx.session = null
	ctx.body = {
		code : 200,
		message : 'Logout Successful'
	}
}
