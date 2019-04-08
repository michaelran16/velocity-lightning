const koa = require('koa')
const path = require('path')
const bodyParser = require('koa-bodyparser')
const ejs = require('ejs')
const router = require('koa-router')
const views = require('koa-views')
const koaStatic = require('koa-static')
const staticCache = require('koa-static-cache')
const socket = require('socket.io')

const app = new koa()
app.keys = ['secret'];

app.use(koaStatic(
	path.join(__dirname, './static')
))

app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}))
app.use(bodyParser({
	formLimit : '1mb'
}))

// routing config
app.use(require('./routers/transaction.js').routes())

let server = app.listen(`3000`)
