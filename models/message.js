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

let insertData = function(value) {
	let sql = "insert into message(message_event_id, message_add_time, message_type, message_xdr, message_is_read, message_user_id,"+
	" message_from_user_id, message_from_user_name) values(?, ?, ?, ?, ?, ?, ?, ?);"
	return query(sql, value)
}

let findDataById = function(value) {
	let sql = `select * from message where message_id = ?;`
	return query(sql, value)
}

let findDataCountById = function(value) {
	let sql = `select count(*) as count from message where message_user_id = ${value};`
	return query(sql, value)
}

let listData = function(value) {
	let sql = `select * from message where message_user_id = ${value[1]} order by message_id desc limit ${(value[0]-1)*10},10;`
	return query(sql)
}

let updateReadById = function(value) {
	let sql = `update message set message_is_read = 1 where message_id = ${value}`
	return query(sql)
}

module.exports = {
	insertData,
	findDataById,
	findDataCountById,
	listData,
	updateReadById,
}
