// 引入模块
const md5 = require('md5');
const userModel = require('../models/user.js');
const channelModel = require('../models/channel.js');
const transactionModel = require('../models/transaction.js');
const messageModel = require('../models/message.js');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment')

const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

// 定义方法
exports.getWallet = async ctx => {
    await checkLogin(ctx);

    let channelBySponsorBalance,
        channelByReceiveBalance,
        channelBySelfCount,
        list,
        count,
        myData;
    
    await userModel.findDataById([ctx.session.id])
	.then(res => {
		myData = res[0]
	}).catch(err => {
		console.log(err)
    })

    await channelModel.findSponsorAmountById([ctx.session.id])
    .then(res => {
        channelBySponsorBalance = res[0].amount
    }).catch(err => {
        console.log(err)
    })

    await channelModel.findReceiveAmountById([ctx.session.id])
    .then(res => {
        channelByReceiveBalance = res[0].amount
    }).catch(err => {
        console.log(err)
    })

    await channelModel.findDataCountByself([ctx.session.id])
    .then(res => {
        channelBySelfCount = res[0].count
    }).catch(err => {
        console.log(err)
    })

    let myKeyPair = StellarSdk.Keypair.fromSecret(myData.user_secret_key)
    var account = await server.loadAccount(myKeyPair.publicKey())
    
    await transactionModel.findDataCountById([ctx.session.id, 0, 0])
	.then(async (res) => {
		count = res[0]['count']
	}).catch(err => {
		console.log(err)
	})

	await transactionModel.listData([1, ctx.session.id, 0, 0])
	.then(async (res) => {
		list = res
	}).catch(err => {
		console.log(err)
    })

	await ctx.render('wallet/wallet', {
        session : ctx.session,
        account_balance : account.balances[0].balance,
        channel_balance : channelBySponsorBalance + channelByReceiveBalance + (channelBySelfCount * 4.5),
        list : list,
		countPage : Math.ceil(count / 5)
	})
}

exports.postWallet = async ctx => {
    await checkLogin(ctx);

    let transaction_id;
    let {name, amount} = ctx.request.body

    await userModel.findDataById([ctx.session.id])
    .then(res => {
        myData = res[0]
    }).catch(err => {
        console.log(err)
    })

    let myKeyPair = StellarSdk.Keypair.fromSecret(myData.user_secret_key)
    var account = await server.loadAccount(myKeyPair.publicKey())
    if (parseFloat(account.balances[0].balance) > parseFloat(amount)) {
        await userModel.findDataByName([name])
        .then(async (res) => {
            try {
                var sourceKeys =StellarSdk.Keypair.fromSecret(res[0].user_secret_key);
                server.loadAccount(res[0].user_pubkey).catch(StellarSdk.NotFoundError, function (error) {
                    ctx.body = {
                        code : 500,
                        message : '对方账户异常，请重试'
                    }
                })
                .then(function() {
                    return server.loadAccount(myKeyPair.publicKey());
                })
                .then(function(sourceAccount) {
                    var transaction = new StellarSdk.TransactionBuilder(sourceAccount, { 
                        fee : 100 
                    })
                    .addOperation(StellarSdk.Operation.payment({
                        destination : res[0].user_pubkey,
                        asset: StellarSdk.Asset.native(),
                        amount : amount,
                    }))
                    .setTimeout(30)
                    .build();
                    
                    transaction.sign(myKeyPair);
                    return server.submitTransaction(transaction);
                }).catch(function(error) {
                    console.error('Something went wrong!', error);
                })
                var toData = res[0]
                await transactionModel.insertData([0, amount, myData.user_id, toData.user_id, moment().format('YYYY-MM-DD HH:mm:ss'), myData.user_name, toData.user_name, 0])
                .then(res => {
                    transaction_id = res.insertId
                }).catch(err => {
                    console.log(err)
                })
                await messageModel.insertData([transaction_id, moment().format('YYYY-MM-DD HH:mm:ss'), 1, "", 0, toData.user_id, myData.user_id, myData.user_name])
                .then(res => {
					ctx.body = {
						code : 200,
						message : '转账成功',
						toid : toData.user_id,
					}
				}).catch(err => {
					console.log(err)
				})
			} catch (e) {
				ctx.body = {
					code : 500,
					message : '对方账户无效或验证失败，请重试'
				}
			}
        }).catch(err => {
            console.log(err)
        })
    } else {
        ctx.body = {
            code : 500,
            message : "余额不足",
        }
    }
}

exports.postWallet_list = async ctx => {
	let page = ctx.request.body.page;
	await transactionModel.listData([page, ctx.session.id, 0])
	.then(result => {
		ctx.body = result
	}).catch(() => {
		ctx.body = 'error'
	})
}
