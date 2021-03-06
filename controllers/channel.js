// 引入模块
const md5 = require('md5');
const bigInt = require('big-integer')
const channelModel = require('../models/channel.js');
const userModel = require('../models/user.js');
const messageModel = require('../models/message.js');
const transactionModel = require('../models/transaction.js');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment');
const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();

const TIMEOUT_CLAIM = 60 * 60 * 24 * 7 // 一星期时间戳
const TIMEOUT_CLAIM_DELAY = 60 * 60 * 24 * 7 *2 // 俩星期时间戳

// const TIMEOUT_CLAIM = 60 * 5 // 五分钟时间戳
// const TIMEOUT_CLAIM_DELAY = 60 * 10 // 十分钟时间戳

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

exports.getChannel_list = async ctx => {

	await checkLogin(ctx);

	let list,
		count;

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

	await checkLogin(ctx);

	let info;

	await channelModel.findDataById([ctx.params.id])
	.then(async(res) => {
		info = res[0]
		if (info.channel_receive_id === ctx.session.id && info.channel_status==3) {
			await messageModel.findDataByEventIdType([ctx.params.id])
			.then(res => {
				ctx.redirect('/channel-invite-create/'+res[0].message_id)
				return false;
			}).catch(err => {
				console.log(err)
			});
		}
	}).catch(err => {
		console.log(err)
	})

	await transactionModel.findDataCountById([ctx.session.id, 1, info.channel_id])
	.then(async (res) => {
		count = res[0]['count']
	}).catch(err => {
		console.log(err)
	})

	await transactionModel.listData([1, ctx.session.id, 1, info.channel_id])
	.then(async (res) => {
		list = res
	}).catch(err => {
		console.log(err)
    })

	await ctx.render('channel/channel-details', {
		session : ctx.session,
		info : info,
		list : list,
		countPage : Math.ceil(count / 5),
	})
}

exports.postChannel_details = async ctx => {
	let page = ctx.request.body.page;
	await transactionModel.listData([page, ctx.session.id, 1, ctx.params.id])
	.then(result => {
		ctx.body = result
	}).catch(() => {
		ctx.body = 'error'
	})
}

exports.getChannel_create = async ctx => {

	await checkLogin(ctx);

	await ctx.render('channel/channel-create', {
		session : ctx.session,
	})
}

exports.postChannel_create = async ctx => {
	let {channel_name, amount, user_name} = ctx.request.body;
	let myData,
		toData,
		channel_id;

	await userModel.findDataById([ctx.session.id])
	.then(async (res) => {
		myData = res[0]
	}).catch(err => {
		console.log(err)
	})

	await userModel.findDataByName([user_name])
	.then( async (res) => {

		if (res.length && res[0].user_status==1) {

			if (ctx.session.id==res[0].user_id) {
				ctx.body = {
					code : 500,
					message : '不能和自己开通道',
				}
				return false;
			} else {
				toData = res[0]
			}

			let myKeyPair = StellarSdk.Keypair.fromSecret(myData.user_secret_key)
			let toKeyPair = StellarSdk.Keypair.fromSecret(toData.user_secret_key)
			var sponsor = await server.loadAccount(myKeyPair.publicKey())

			if (parseFloat(sponsor.balances[0].balance) > (parseFloat(amount)+3)) {

				let sponsor_ratchet = StellarSdk.Keypair.random()
				let receive_ratchet = StellarSdk.Keypair.random()
				let escrow = StellarSdk.Keypair.random()

				var createAccountsTx = new StellarSdk.TransactionBuilder(sponsor, {fee: 100}).addOperation(
					StellarSdk.Operation.createAccount({
						destination : sponsor_ratchet.publicKey(),
						startingBalance: '1',
					})
				).addOperation(
					StellarSdk.Operation.createAccount({
						destination : receive_ratchet.publicKey(),
						startingBalance: '1',
					})
				).addOperation(
					StellarSdk.Operation.createAccount({
						destination: escrow.publicKey(),
						startingBalance: '1',
					})
				).setTimeout(0)
				.build()
				createAccountsTx.sign(myKeyPair)
				await server.submitTransaction(createAccountsTx)

				var roundTime = moment().unix()
				// 交换结算交易
				var escrowAccount = await server.loadAccount(escrow.publicKey())
				var sponsorRatchetAccount = await server.loadAccount(sponsor_ratchet.publicKey())
				var receiveRatchetAccount = await server.loadAccount(receive_ratchet.publicKey())
				var escrowSequenceNumber = bigInt(escrowAccount.sequenceNumber())
				var newEscrowSequenceNumber = escrowSequenceNumber.plus(3)
				var settlementSponsor = new StellarSdk.TransactionBuilder(new StellarSdk.Account(escrow.publicKey(), newEscrowSequenceNumber.toString()), {
					fee: 100,
					timebounds: {
						minTime: roundTime + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
						maxTime: 0,
					},
				}).addOperation(
					StellarSdk.Operation.payment({
						destination: sponsor_ratchet.publicKey(),
						asset: StellarSdk.Asset.native(),
						amount: amount,
					})
				)
				.setTimeout(0)
				.build()
				settlementSponsor.sign(toKeyPair)
				var settlementReceive = new StellarSdk.TransactionBuilder(new StellarSdk.Account(escrow.publicKey(), newEscrowSequenceNumber.plus(1).toString()), {
					fee: 100,
					timebounds: {
						minTime: roundTime + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
						maxTime: 0,
					},
				}).addOperation(
					StellarSdk.Operation.setOptions({
						signer: {
							ed25519PublicKey: toData.user_pubkey,
							weight: 2,
						}
					})
				)
				.setTimeout(0)
				.build()
				settlementReceive.sign(escrow)
				// 交换齿轮交易
				var ratchetSponsor = new StellarSdk.TransactionBuilder(sponsorRatchetAccount, {
					fee: 100,
					timebounds: {
						minTime: roundTime,
						maxTime: roundTime + TIMEOUT_CLAIM,
					}
				}).addOperation(
					StellarSdk.Operation.bumpSequence({
						bumpTo: newEscrowSequenceNumber.minus(1).toString(),
						source: escrow.publicKey(),
					})
				)
				.build()
				ratchetSponsor.sign(toKeyPair)
				var ratchetReceive = new StellarSdk.TransactionBuilder(receiveRatchetAccount, {
					fee: 100,
					timebounds: {
						minTime: roundTime,
						maxTime: roundTime + TIMEOUT_CLAIM,
					},
				}).addOperation(
					StellarSdk.Operation.bumpSequence({
						bumpTo: newEscrowSequenceNumber.minus(1).toString(),
						source: escrow.publicKey(),
					})
				)
				.build()
				ratchetReceive.sign(escrow)
				// 存钱和设置账号
				var setupAccountsTx = new StellarSdk.TransactionBuilder(sponsor, {
					fee: 100,
					timebounds : {
						minTime : 0,
						maxTime : moment().unix() + 7200,
					},
				}).addOperation(
					StellarSdk.Operation.payment({
						destination : escrow.publicKey(),
						asset : StellarSdk.Asset.native(),
						amount : amount,
					})
				).addOperation(
					StellarSdk.Operation.setOptions({
						lowThreshold : 2,
						medThreshold : 2,
						highThreshold : 2,
						signer : {
							ed25519PublicKey : toData.user_pubkey,
							weight : 1,
						},
						source : escrow.publicKey(),
					})
				).addOperation(
					StellarSdk.Operation.payment({
						destination : receive_ratchet.publicKey(),
						asset : StellarSdk.Asset.native(),
						amount : "1",
					})
				).addOperation(
					StellarSdk.Operation.setOptions({
						masterWeight : 0,
						lowThreshold : 2,
						medThreshold : 2,
						highThreshold : 2,
						signer : {
							ed25519PublicKey : toData.user_pubkey,
							weight : 1,
						},
						source : receive_ratchet.publicKey(),
					})
				).addOperation(
					StellarSdk.Operation.setOptions({
						signer : {
							ed25519PublicKey : escrow.publicKey(),
							weight : 1,
						},
						source : receive_ratchet.publicKey(),
					})
				).addOperation(
					StellarSdk.Operation.payment({
						destination : sponsor_ratchet.publicKey(),
						asset : StellarSdk.Asset.native(),
						amount : "0.5",
					})
				).addOperation(
					StellarSdk.Operation.setOptions({
						masterWeight : 0,
						signer : {
							ed25519PublicKey : escrow.publicKey(),
							weight : 1,
						},
						source : sponsor_ratchet.publicKey(),
					})
				)
				.build()
				setupAccountsTx.sign(myKeyPair)
				setupAccountsTx.sign(escrow)
				setupAccountsTx.sign(sponsor_ratchet)
				setupAccountsTx.sign(receive_ratchet)
				await server.submitTransaction(setupAccountsTx)
				await channelModel.insertData([
					channel_name, myData.user_id, toData.user_id, moment().format('YYYY-MM-DD HH:mm:ss'), 3, amount, 0,
					sponsor_ratchet.publicKey(), sponsor_ratchet.secret(), receive_ratchet.publicKey(), receive_ratchet.secret(), escrow.publicKey(),
					escrow.secret(), amount, 0, settlementSponsor.toXDR(), settlementReceive.toXDR(), ratchetSponsor.toXDR(), ratchetReceive.toXDR(), newEscrowSequenceNumber.toString()
				])
				.then(res => {
					channel_id = res.insertId
				}).catch(err => {
					console.log(err)
				})

				await messageModel.insertData([channel_id, moment().format('YYYY-MM-DD HH:mm:ss'), 0, "", 0, toData.user_id, myData.user_id, myData.user_name]).then(res => {
					ctx.body = {
						code : 200,
						message : 'Application Successful',
						toid : toData.user_id,
					}
				}).catch(err => {
					console.log(err)
				})
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
				message : 'Counterpart not exist'
			}
		}
	}).catch(err => {
		console.log(err)
	})
}

exports.getChannel_invite_create = async ctx => {
	let messageData,
		channelData,
		toUserData;
	await messageModel.findDataById([ctx.params.id])
	.then(res => {
		messageData = res[0];
	}).catch(err => {
		console.log(err)
	})
	if (messageData.message_type==0) {
		await channelModel.findDataById([messageData.message_event_id])
		.then(res => {
			channelData = res[0]
		})
		if (channelData.channel_status<3) {
			ctx.redirect('/channel-details/'+channelData.channel_id)
			return false;
		}
	}
	await userModel.findDataById([channelData.channel_sponsor_id])
	.then(res => {
		toUserData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await ctx.render('channel/channel-invite-create', {
		session : ctx.session,
		messageData : messageData,
		channelData : channelData,
		toUserData : toUserData,
	});
}

exports.postChannel_invite_create = async ctx => {
	let channel_id = ctx.params.id;
	let amount = ctx.request.body.amount;
	let type = ctx.request.body.type;
	let channelData,
		toUserData,
		fromUserData;
	await channelModel.findDataById([channel_id])
	.then(res => {
		channelData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await userModel.findDataById([channelData.channel_receive_id])
	.then(res => {
		toUserData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await userModel.findDataById([channelData.channel_sponsor_id])
	.then(res => {
		fromUserData = res[0]
	}).catch(err => {
		console.log(err)
	})

	var fromAccount = await server.loadAccount(fromUserData.user_pubkey)
	var toAccount = await server.loadAccount(toUserData.user_pubkey)
	var escrowKeypair = StellarSdk.Keypair.fromSecret(channelData.channel_escrow_secret_key)
	var toUserKeypair = StellarSdk.Keypair.fromSecret(toUserData.user_secret_key)
	var fromUserKeypair = StellarSdk.Keypair.fromSecret(fromUserData.user_secret_key)

	if (type==0) {
		if (parseFloat(toAccount.balances[0].balance) > (parseFloat(amount))) {
			var depositTX = new StellarSdk.TransactionBuilder(toAccount, {
				fee: 100
			}).addOperation(
				StellarSdk.Operation.payment({
					destination: channelData.channel_escrow_pubkey,
					asset: StellarSdk.Asset.native(),
					amount: amount,
				})
			)
			.setTimeout(0)
			.build()
			depositTX.sign(toUserKeypair)
			await server.submitTransaction(depositTX)

			await channelModel.updateStatusReceiveDepositById([1, amount, channel_id])
			.catch(err => {
				console.log(err)
			})
		} else {
			ctx.body = {
				code: 500,
				message: '余额不足'
			}
			return false;
		}
	} else if(type==1) {
		var cancelChannelTx = new StellarSdk.TransactionBuilder(fromAccount, {
			fee: 100,
		}).addOperation(
			StellarSdk.Operation.accountMerge({
				destination: fromUserData.user_pubkey,
				source: channelData.channel_escrow_pubkey,
			})
		).addOperation(
			StellarSdk.Operation.accountMerge({
				destination: fromUserData.user_pubkey,
				source: channelData.channel_sponsor_ratchet_pubkey,
			})
		).addOperation(
			StellarSdk.Operation.accountMerge({
				destination: fromUserData.user_pubkey,
				source: channelData.channel_receive_ratchet_pubkey,
			})
		)
		.setTimeout(0)
		.build()
		cancelChannelTx.sign(escrowKeypair)
		cancelChannelTx.sign(toUserKeypair)
		cancelChannelTx.sign(fromUserKeypair)
		await server.submitTransaction(cancelChannelTx)
		channelModel.updateStatusReceiveDepositById([2, 0, channel_id]).catch(err => {
			console.log(err)
		})
	} else {
		ctx.body = {
			code: 500,
			message: '参数错误',
		}
		return false;
	}
	ctx.body = {
		code : 200,
		message : 'Operation Successful',
	}
}

exports.postChannel_pay = async ctx => {
	let {amount,channel_id} = ctx.request.body
	let fromUserData,
		channelData,
		sponsor_amount,
		receive_amount,
		toUserData,
		toUserId;

	await channelModel.findDataById([channel_id])
	.then(res => {
		if (res.length) {
			channelData = res[0]
		} else {
			ctx.body = {
				code: 500,
				message: '非法操作',
			}
			return false;
		}
	}).catch(err => {
		console.log(err)
	})

	if (channelData.channel_sponsor_id==ctx.session.id) {
		if (parseFloat(channelData.channel_sponsor_amount) < parseFloat(amount)) {
			ctx.body = {
				code: 500,
				message: '余额不足'
			}
			return false;
		}
		sponsor_amount = parseFloat(channelData.channel_sponsor_amount) - parseFloat(amount);
		receive_amount = parseFloat(channelData.channel_receive_amount) + parseFloat(amount);
		toUserId = channelData.channel_receive_id;
	} else if (channelData.channel_receive_id==ctx.session.id) {
		if (parseFloat(channelData.channel_receive_amount) < parseFloat(amount)) {
			ctx.body = {
				code: 500,
				message: '余额不足'
			}
			return false;
		}
		receive_amount = parseFloat(channelData.channel_receive_amount) - parseFloat(amount);
		sponsor_amount = parseFloat(channelData.channel_sponsor_amount) + parseFloat(amount);
		toUserId = channelData.channel_sponsor_id;
	} else {
		ctx.body = {
			code: 500,
			message: '非法操作',
		}
		return false;
	}

	await userModel.findDataById([ctx.session.id])
	.then(res => {
		fromUserData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await userModel.findDataById([toUserId])
	.then(res => {
		toUserData = res[0]
	}).catch(err => {
		console.log(err)
	})

	var roundTime = moment().unix()
	let toKeyPair = StellarSdk.Keypair.fromSecret(toUserData.user_secret_key)
	var escrow = StellarSdk.Keypair.fromSecret(channelData.channel_escrow_secret_key)
	var sponsor_ratchet = StellarSdk.Keypair.fromSecret(channelData.channel_sponsor_ratchet_secret_key)
	var receive_ratchet = StellarSdk.Keypair.fromSecret(channelData.channel_receive_ratchet_secret_key)
	// 交换结算交易
	var escrowAccount = await server.loadAccount(escrow.publicKey())
	var sponsorRatchetAccount = await server.loadAccount(sponsor_ratchet.publicKey())
	var receiveRatchetAccount = await server.loadAccount(receive_ratchet.publicKey())
	var escrowSequenceNumber = bigInt(channelData.channel_sequence_number)
	var newEscrowSequenceNumber = escrowSequenceNumber.plus(3)
	var settlementSponsor = new StellarSdk.TransactionBuilder(new StellarSdk.Account(escrow.publicKey(), newEscrowSequenceNumber.toString()), {
		fee: 100,
		timebounds: {
			minTime: roundTime + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
			maxTime: 0,
		},
	}).addOperation(
		StellarSdk.Operation.payment({
			destination: sponsor_ratchet.publicKey(),
			asset: StellarSdk.Asset.native(),
			amount: receive_amount.toString(),
		})
	)
	.setTimeout(0)
	.build()
	settlementSponsor.sign(toKeyPair)
	var settlementReceive = new StellarSdk.TransactionBuilder(new StellarSdk.Account(escrow.publicKey(), newEscrowSequenceNumber.plus(1).toString()), {
		fee: 100,
		timebounds: {
			minTime: roundTime + TIMEOUT_CLAIM + TIMEOUT_CLAIM_DELAY,
			maxTime: 0,
		},
	}).addOperation(
		StellarSdk.Operation.setOptions({
			signer: {
				ed25519PublicKey: toUserData.user_pubkey,
				weight: 2,
			}
		})
	)
	.setTimeout(0)
	.build()
	settlementReceive.sign(escrow)
	// 交换齿轮交易
	var ratchetSponsor = new StellarSdk.TransactionBuilder(sponsorRatchetAccount, {
		fee: 100,
		timebounds: {
			minTime: roundTime,
			maxTime: roundTime + TIMEOUT_CLAIM,
		}
	}).addOperation(
		StellarSdk.Operation.bumpSequence({
			bumpTo: newEscrowSequenceNumber.minus(1).toString(),
			source: escrow.publicKey(),
		})
	)
	.build()
	ratchetSponsor.sign(toKeyPair)
	var ratchetReceive = new StellarSdk.TransactionBuilder(receiveRatchetAccount, {
		fee: 100,
		timebounds: {
			minTime: roundTime,
			maxTime: roundTime + TIMEOUT_CLAIM,
		},
	}).addOperation(
		StellarSdk.Operation.bumpSequence({
			bumpTo: newEscrowSequenceNumber.minus(1).toString(),
			source: escrow.publicKey(),
		})
	)
	.build()
	ratchetReceive.sign(escrow)
	await transactionModel.insertData([1, amount, fromUserData.user_id, toUserId, moment().format('YYYY-MM-DD HH:mm:ss'),
		fromUserData.user_name, toUserData.user_name, channel_id, settlementSponsor.toXDR(), settlementReceive.toXDR(), ratchetSponsor.toXDR(),
		ratchetReceive.toXDR(), newEscrowSequenceNumber.toString(), sponsor_amount, receive_amount])
	// await channelModel.updateTx([channel_id, settlementSponsor.toXDR(), settlementReceive.toXDR(), ratchetSponsor.toXDR(), ratchetReceive.toXDR(), newEscrowSequenceNumber.toString()])
	.then(res => {
		console.log(res)
	}).catch(err => {
		console.log(err)
	})
	await channelModel.updateAmountData([sponsor_amount, receive_amount, channel_id])
	await messageModel.insertData([channel_id, moment().format('YYYY-MM-DD HH:mm:ss'), 2, "", 0, toUserId, fromUserData.user_id, fromUserData.user_name]).then(res => {
		ctx.body = {
			code : 200,
			message : 'Operation Successful',
			toid : toUserId,
		}
	}).catch(err => {
		console.log(err)
	})
}

exports.postChannel_close = async ctx => {
	let channel_id = ctx.request.body.channel_id;
	let channelData,
		toUserData,
		fromUserData;
	await channelModel.findDataById([channel_id])
	.then(res => {
		channelData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await userModel.findDataById([channelData.channel_receive_id])
	.then(res => {
		toUserData = res[0]
	}).catch(err => {
		console.log(err)
	})
	await userModel.findDataById([channelData.channel_sponsor_id])
	.then(res => {
		fromUserData = res[0]
	}).catch(err => {
		console.log(err)
	})

	var fromAccount = await server.loadAccount(fromUserData.user_pubkey)
	var escrowKeypair = StellarSdk.Keypair.fromSecret(channelData.channel_escrow_secret_key)
	var toUserKeypair = StellarSdk.Keypair.fromSecret(toUserData.user_secret_key)
	var fromUserKeypair = StellarSdk.Keypair.fromSecret(fromUserData.user_secret_key)
	var closeChannelTx = new StellarSdk.TransactionBuilder(fromAccount, {
		fee: 100,
	}).addOperation(
		StellarSdk.Operation.payment({
			destination: toUserKeypair.publicKey(),
			asset: StellarSdk.Asset.native(),
			amount: channelData.channel_receive_amount.toString(),
		})
	).addOperation(
		StellarSdk.Operation.accountMerge({
			destination: fromUserData.user_pubkey,
			source: channelData.channel_escrow_pubkey,
		})
	).addOperation(
		StellarSdk.Operation.accountMerge({
			destination: fromUserData.user_pubkey,
			source: channelData.channel_sponsor_ratchet_pubkey,
		})
	).addOperation(
		StellarSdk.Operation.accountMerge({
			destination: fromUserData.user_pubkey,
			source: channelData.channel_receive_ratchet_pubkey,
		})
	)
	.setTimeout(0)
	.build()
	closeChannelTx.sign(escrowKeypair)
	closeChannelTx.sign(toUserKeypair)
	closeChannelTx.sign(fromUserKeypair)
	await server.submitTransaction(closeChannelTx)
	channelModel.updateStatusReceiveDepositById([2, 0, channel_id]).catch(err => {
		console.log(err)
	})
	ctx.body = {
		code: 200,
		message: 'Operation Successful',
	}
}
