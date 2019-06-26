// 引入模块
const md5 = require('md5');
const userModel = require('../models/user.js');
const channelModel = require('../models/channel.js');
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
        channelByReceiveBalance;
    
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

    let myKeyPair = StellarSdk.Keypair.fromSecret(myData.user_secret_key)
    var account = await server.loadAccount(myKeyPair.publicKey())
    
	await ctx.render('wallet/wallet', {
        session : ctx.session,
        account_balance : account.balances[0].balance,
        channel_balance : channelBySponsorBalance + channelByReceiveBalance,
	})
}

exports.postWallet = async ctx => {
    await checkLogin(ctx);

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
        .then(res => {
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
                ctx.body = {
                    code : 200,
                    message : "转账成功",
                }
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
