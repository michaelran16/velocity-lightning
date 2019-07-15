// 引入模块
const md5 = require('md5');
const contackModel = require('../models/contack.js');
const userModel = require('../models/user.js');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment')



exports.postContack_add = async ctx => {

	let {user_name} = ctx.request.body

	// 获取登录用户信息
	await userModel.findDataById([ctx.session.id])
    .then(res => {
        myData = res[0]
    }).catch(err => {
        console.log(err)
    })
	// myData.user_id
	await userModel.findDataCountByName([name])
	.then(async res => {
		if (res[0].count>0) {
			ctx.body = {
				code : 200,
				message : '联系人存在',
			}
		} else {
			try {
				var sourceKeys = Keypair.fromSecret(secret);
				await userModel.insertData([name, sourceKeys.publicKey(), sourceKeys.secret(), moment().format('YYYY-MM-DD HH:mm:ss')])
				.then(res => {
					ctx.body = {
						code : 200,
						message : '注册成功'
					}
				}).catch(err => {
					console.log(err)
				})
			} catch (e) {
				ctx.body = {
					code : 200,
					message : 'stellar账户验证失败，请重试'
				}
				return false;
			}
		}
	}).catch(err => {
		console.log(err)
	})
}
