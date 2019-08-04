var mysql = require('mysql')

const config = {
	database : {
		DATABASE : 'lightning',
		USERNAME : 'root',
		PASSWORD : 'root',
		PORT : 3306,
		HOST : '127.0.0.1',
	},
	// 启动端口
	port : 8000,
}

// 链接数据库
var pool = mysql.createPool({
	host : config.database.HOST,
	user : config.database.USERNAME,
	password : config.database.PASSWORD,
	database : config.database.DATABASE,
})

// 执行SQL
query = function(sql, values) {
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

module.exports = config
