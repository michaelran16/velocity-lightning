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
//用户注册
let insertData = function(value) {
	let sql = "insert into users(user_name, user_pubkey, user_secret_key, user_add_time) values(?, ?, ?, ?);"
	return query(sql, value)
}
//通过ID查找用户
let findDataById = function(value) {
	let sql = `select * from users where user_id = ?;`
	return query(sql, value)
}
//通过名字找用户
let findDataByName = function(value) {
	let sql = `select * from users where user_name = ?;`
	return query(sql, value)
}
//通过名字找用户数量
let findDataCountByName = function(value) {
	let sql = `select count(*) as count from users where user_name = ?;`
	return query(sql, value)
}
module.exports = {
	insertData,
	findDataById,
	findDataByName,
	findDataCountByName,
}