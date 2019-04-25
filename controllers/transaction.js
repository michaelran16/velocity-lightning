// import
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fs = require('fs')
const moment = require('moment')
const bigInt = require('big-integer')
const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

// function definitions
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
exports.getHelper = async ctx => {
	let message;
	let userData = await new Promise((resolve, reject) => {
		fs.readFile('./user.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				resolve(JSON.parse(data))
			}
		})
	})
	let account = await server.loadAccount(userData.stellarPublic);
	let helperData  = await new Promise((resolve, reject) => {
		fs.readFile('./helper.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				if (data) {
					resolve(JSON.parse(data))
				} else {
					resolve('')
				}
			}
		})
	})
	if (helperData) {
		message = '已经账号';
	} else {
		message = '没有账号，立即创建';
	}
	await ctx.render('transaction/helper', {
		session : ctx.session,
		message : message,
		balance : account.balances[0].balance,
	})
}
exports.postHelper = async ctx => {
	let aliceInfo  = await new Promise((resolve, reject) => {
		fs.readFile('./user.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				resolve(JSON.parse(data))
			}
		})
	})
	let Alice = await server.loadAccount(aliceInfo.stellarPublic)
	let AliceKeypair = StellarSdk.Keypair.fromSecret(aliceInfo.stellarSecret);

	let AliceVersionKeypair = StellarSdk.Keypair.random()
	let AliceVersionPublic = AliceVersionKeypair.publicKey()
	let AliceVersionSecret = AliceVersionKeypair.secret()

	let AliceRatchetKeypair = StellarSdk.Keypair.random()
	let AliceRatchetPublic = AliceRatchetKeypair.publicKey()
	let AliceRatchetSecret = AliceRatchetKeypair.secret()

	let jsonData = {
		AliceVersionPublic:AliceVersionPublic,
		AliceVersionSecret:AliceVersionSecret,
		AliceRatchetPublic:AliceRatchetPublic,
		AliceRatchetSecret:AliceRatchetSecret,
	}
	let data = JSON.stringify(jsonData, null, "\t")
	fs.writeFile('./helper.txt', data, function(err) {
        if (err) {
            throw err;
        }
    });

	let setupAccountsTx = new StellarSdk.TransactionBuilder(Alice,{
		fee : 100,
	}).addOperation(
		StellarSdk.Operation.createAccount({
			destination: AliceVersionPublic,
			startingBalance: '1',
		})
	).addOperation(
		StellarSdk.Operation.createAccount({
			destination: AliceRatchetPublic,
			startingBalance: '1',
		})
	)
	.setTimeout(1000)
	.build()
	setupAccountsTx.sign(AliceKeypair)
	let transactionResult = await server.submitTransaction(setupAccountsTx)
	ctx.body = {
		code : 200,
		message : '创建成功'
	}
}
exports.getSnapshoot = async ctx => {
	await ctx.render('transaction/snapshoot', {
		session : ctx.session,
	})
}
exports.postSnapshoot = async ctx => {
	let aliceInfo  = await new Promise((resolve, reject) => {
		fs.readFile('./user.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				resolve(JSON.parse(data))
			}
		})
	})
	let Alice = await server.loadAccount(aliceInfo.stellarPublic)
	let helperData  = await new Promise((resolve, reject) => {
		fs.readFile('./helper.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				if (data) {
					resolve(JSON.parse(data))
				} else {
					resolve('')
				}
			}
		})
	})
	
	let AliceRatchet = await server.loadAccount(helperData.AliceRatchetPublic);
	let Round0Time = moment().unix();

	let RatchetSequenceNumber = bigInt(AliceRatchet.sequenceNumber())
	let Ratchet0SequenceNumber = RatchetSequenceNumber.plus(3)

	let snapshot = new StellarSdk.TransactionBuilder(
		new StellarSdk.Account(
			helperData.AliceRatchetPublic,
			Ratchet0SequenceNumber.toString()
		),{
			fee : 100,
			timebounds: {
				minTime: Round0Time,
				maxTime: 0,
			},
		}
	).addOperation(
		StellarSdk.Operation.payment({
			destination: Alice.accountId(),
			asset: StellarSdk.Asset.native(),
			amount: '250',
		})
	)
	.setTimeout(1000)
	.build()
	console.log(snapshot)
	ctx.body = {
		code : 200,
		message : '成功'
	}
}