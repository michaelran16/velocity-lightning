//模块引入
var mysql = require('mysql')
var config = require('../common/config.js')

//建立连接池
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
	let sql = "insert into channels() values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
	return query(sql, value)
}

let findDataById = function(value) {
	let sql = `select * from channels where channel_id = ?;`
	return query(sql, value)
}

let findDataCountById = function(value) {
	let sql = `select count(*) as count from channels where channel_sponsor_id = ${value} or channel_receive_id = ${value};`
	return query(sql, value)
}

let listData = function(value) {
	let sql = `select * from channels where channel_sponsor_id = ${value[1]} or channel_receive_id = ${value[1]} limit ${(value[0]-1)*10},10;`
	return query(sql)
}

module.exports = {
	insertData,
	findDataById,
	findDataCountById,
	listData,
}