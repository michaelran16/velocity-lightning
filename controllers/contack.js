// 引入模块
const md5 = require('md5');
const contackModel = require('../models/contack.js');
const userModel = require('../models/user.js');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const moment = require('moment')

// 联系人列表界面
exports.getContack_list = async ctx => {
    await ctx.render('contack/contack-list', {
        session : ctx.session
    })
}

// 获取联系人列表
exports.postContack_list = async ctx => {
	let list,count;

	// 获取用户的所有联系人个数
	await contackModel.findDataCountById([ctx.session.id])
	.then(async (res) => {
		count = res[0]['count']
	}).catch(err => {
		console.log(err)
	})

	// 获取数据列表
	await contackModel.listData([1, ctx.session.id])
	.then(async (res) => {
		list = res
		ctx.body = {
			error: 0,
			msg: 'Retrive Successful',
			data: {
				list : list,
				countPage : Math.ceil(count / 10)
			}
		}
	}).catch(err => {
		console.log(err)
	})
	// await ctx.render('contack/contack-list', {
	// 	session : ctx.session,
	// 	list : list,
	// 	countPage : Math.ceil(count / 10)
	// })
}

// 添加联系人页面
exports.getContack_add = async ctx => {
    await ctx.render('contack/contack-add', {
        session : ctx.session
    })
}

// 添加联系人操作
exports.postContack_add = async ctx => {

	let {user_name} = ctx.request.body

	// 获取登录用户ID
	user_id = ctx.session.id

	await contackModel.findDataCountByName([user_id, user_name])
	.then(async res => {
		if (res[0].count>0) {
			ctx.body = {
				error : 1001,
				msg : 'Contact already exist',
			}
		} else {
			try {
				await contackModel.insertData([user_id, user_name])
				.then(res => {
					ctx.body = {
						error : 0,
						msg : 'Add Successful'
					}
				}).catch(err => {
					console.log(err)
				})
			} catch (e) {
				ctx.body = {
					error : 1001,
					msg : 'Add failed'
				}
				return false;
			}
		}
	}).catch(err => {
		console.log(err)
	})
}

// 删除联系人操作
exports.postContack_delete = async ctx => {
	let {id} = ctx.request.body
	user_id = ctx.session.id

	await contackModel.deleteDate([id, user_id])
	.then(async res => {
		console.log(res)
	}).catch(err => {
		console.log(err)
	})
}
