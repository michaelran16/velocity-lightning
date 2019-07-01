// 模块引入
var mysql = require('mysql')
var config = require('../common/config.js')

// 建立连接池
var pool = mysql.createPool({
	host : config.database.HOST,
	user : config.database.USERNAME,
	password : config.database.PASSWORD,
	database : config.database.DATABASE,
})

let query = function(sql, values) {
	return new Promise((resolve, reject) => {
		pool.getConnection(function(err, connection) {
			if (err) {
				reject(err)
			} else {
				connection.query(sql, values, (err, rows) => {
					if (err) {
						reject(err)
					} else {
						resolve(rows)
					}
					connection.release()
				})
			}
		})
	})
}

// 通道数据添加
let insertData = function(value) {
	let sql = "insert into channels(channel_name, channel_sponsor_id, channel_receive_id, channel_add_time, channel_status," +
	" channel_sponsor_amount, channel_receive_amount, channel_sponsor_ratchet_pubkey, channel_sponsor_ratchet_secret_key," +
	" channel_receive_ratchet_pubkey, channel_receive_ratchet_secret_key, channel_escrow_pubkey, channel_escrow_secret_key," +
	" channel_sponsor_deposit, channel_receive_deposit, channel_settle_with_sponsor_tx, channel_settle_with_receive_tx, channel_sponsor_ratchet_tx," +
	" channel_receive_ratchet_tx) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
	return query(sql, value)
}

// 通过ID查找通道
let findDataById = function(value) {
	let sql = `select * from channels where channel_id = ?;`
	return query(sql, value)
}

// 通过ID查找通道数量
let findDataCountById = function(value) {
	let sql = `select count(*) as count from channels where channel_sponsor_id = ${value} or channel_receive_id = ${value};`
	return query(sql, value)
}

// 通道列表
let listData = function(value) {
	let sql = `select * from channels where channel_sponsor_id = ${value[1]} or channel_receive_id = ${value[1]} order by channel_id desc limit ${(value[0]-1)*10},10;`
	return query(sql)
}

// 确定开启通道，向里存钱
let updateStatusReceiveDepositById = function(value) {
	let sql = `update channels set channel_status = ${value[0]}, channel_receive_deposit = ${value[1]}, channel_receive_amount = ${value[1]} where channel_id = ${value[2]};`
	return query(sql)
}

// 查询通道发起人在有效通道中的余额
let findSponsorAmountById = function(value) {
	let sql = `select ifnull(sum(channel_sponsor_amount), 0) as amount from channels where channel_sponsor_id = ${value[0]} and (channel_status = 1 or channel_status=3);`
	return query(sql)
}

// 查询通道接受人在有效通道中的余额
let findReceiveAmountById = function(value) {
	let sql = `select ifnull(sum(channel_receive_amount), 0) as amount from channels where channel_receive_id = ${value[0]} and (channel_status = 1 or channel_status=3);`
	return query(sql)
}

//查询自己开的通道有多少
let findDataCountByself = function(value) {
	let sql = `select count(*) as count from channels where channel_sponsor_id = ${value} and (channel_status=1 or channel_status=3);`
	return query(sql)
}

module.exports = {
	insertData,
	findDataById,
	findDataCountById,
	listData,
	updateStatusReceiveDepositById,
	findSponsorAmountById,
	findReceiveAmountById,
	findDataCountByself,
}
