// 模块引入
var mysql = require('mysql')
var config = require('../common/config.js')

// // 建立连接池
// var pool = mysql.createPool({
// 	host : config.database.HOST,
// 	user : config.database.USERNAME,
// 	password : config.database.PASSWORD,
// 	database : config.database.DATABASE,
// })

// let query = function(sql, values) {
// 	return new Promise((resolve, reject) => {
// 		pool.getConnection(function(err, connection) {
// 			if (err) {
// 				reject(err)
// 			} else {
// 				connection.query(sql, values, (err, rows) => {
// 					if (err) {
// 						reject(err)
// 					} else {
// 						resolve(rows)
// 					}
// 					connection.release()
// 				})
// 			}
// 		})
// 	})
// }

// 交易数据添加
let insertData = function(value) {
	let sql = "insert into transaction(transaction_type, transaction_amount, transaction_sponsor_id, transaction_receive_id, transaction_add_time, transaction_sponsor_name, "+
	"transaction_receive_name, transaction_channel_id, transaction_sponsor_ratchet_tx, transaction_receive_ratchet_tx, transaction_settle_with_sponsor_tx, "+
	"transaction_settle_with_receive_tx, transaction_sequence_number, transaction_sponsor_amount, transaction_receive_amount) "+
	"values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
	return query(sql, value)
}

// 通过ID查找交易
let findDataById = function(value) {
	let sql = `select * from transaction where transaction_id = ?;`
	return query(sql, value)
}

// 通过ID查找交易数量
let findDataCountById = function(value) {
	let sql = `select count(*) as count from transaction where transaction_sponsor_id = ${value[0]} or transaction_receive_id = ${value[0]} 
	and transaction_type = ${value[1]} and transaction_channel_id = ${value[2]};`
	return query(sql, value)
}

// state channel
let listData = function(value) {
	let sql = `select * from transaction where (transaction_sponsor_id = ${value[1]} or transaction_receive_id = ${value[1]}) and transaction_type = ${value[2]} 
	and transaction_channel_id = ${value[3]} order by transaction_id desc limit ${(value[0]-1)*5},5;`
	return query(sql)
}

// 查询通道发起人在有效通道中的余额
let findSponsorAmountById = function(value) {
	let sql = `select ifnull(sum(channel_sponsor_amount), 0) as amount from transaction where channel_sponsor_id = ${value[0]} and channel_status = 1;`
	return query(sql)
}

// 查询通道接受人在有效通道中的余额
let findReceiveAmountById = function(value) {
	let sql = `select ifnull(sum(channel_receive_amount), 0) as amount from transaction where channel_receive_id = ${value[0]} and channel_status = 1;`
	return query(sql)
}

module.exports = {
	insertData,
	findDataById,
	findDataCountById,
	listData,
	findSponsorAmountById,
	findReceiveAmountById,
}
