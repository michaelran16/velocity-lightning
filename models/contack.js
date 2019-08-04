// 模块引入
var mysql = require('mysql')
var config = require('../common/config.js')

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

// 联系人列表
let listData = function(value) {
	let sql = `select * from contack where user_id = ${value[1]} order by id desc limit ${(value[0]-1)*10},1000;`
	return query(sql)
}

// 通过名字找联系人
let findDataByName = function(value) {
	let sql = `select * from contack where user_name = ?;`
	return query(sql, value)
}

// 通过用户ID统计联系人总数
let findDataCountById = function(value) {
	let sql = `select count(id) as count from contack where user_id = ${value};`
	return query(sql, value)
}

// 通过名字找联系人数量
let findDataCountByName = function(value) {
	let sql = `select count(id) as count from contack where user_id = ? and user_name = ?;`
	return query(sql, value)
}

// 删除联系人
let deleteDate = function(value) {
	let sql = `delete from contack where id = ? and user_id = ?;`
	return query(sql, value)
}

module.exports = {
	listData,
	deleteDate,
	insertData,
	findDataById,
	findDataByName,
	findDataCountById,
	findDataCountByName,
}
