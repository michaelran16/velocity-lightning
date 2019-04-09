const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fs = require('fs')
const moment = require('moment')
const bigInt = require('big-integer')
const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

exports.getLobby = async ctx => {
	await ctx.render('transaction/lobby', {
		session : ctx.session
	})
}

exports.getCreate = async ctx => {

	let json = await new Promise((resolve, reject) => {
		fs.readFile('./user.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				resolve(JSON.parse(data))
			}
		})
	})

	let account = await server.loadAccount(json.stellarPublic);

	await ctx.render('transaction/create', {
		session : ctx.session,
		balance : account.balances[0].balance
	})
}

exports.postCreate = async ctx => {

	let {stellar_address, ip_address, amount} = ctx.request.body

	ctx.body = {
		code : 200,
	}
}