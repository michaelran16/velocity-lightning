// 模块引入
var mysql = require('mysql')
var config = require('../common/config.js')

// 链接数据库
var pool = mysql.createPool({
	host : config.database.HOST,
	user : config.database.USERNAME,
	password : config.database.PASSWORD,
	database : config.database.DATABASE,
})

// 执行SQL
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

// 添加联系人
let insertData = function(value) {
	let sql = "insert into contack(user_id, user_name) values(?, ?);"
	return query(sql, value)
}

// 通过ID查找联系人
let findDataById = function(value) {
	let sql = `select * from contack where user_id = ?;`
	return query(sql, value)
}

// 通过名字找联系人
let findDataByName = function(value) {
	let sql = `select * from contack where user_name = ?;`
	return query(sql, value)
}

// 通过名字找联系人数量
let findDataCountByName = function(value) {
	let sql = `select count(id) as count from contack where user_name = ?;`
	return query(sql, value)
}

module.exports = {
	insertData,
	findDataById,
	findDataByName,
	findDataCountByName,
}
