const koa = require('koa')
const path = require('path')
const ejs = require('ejs')
const router = require('koa-router')
const views = require('koa-views')

const app = new koa()
app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}))

// routing config
app.use(require('./routers/transaction.js').routes())

let server = app.listen(`3000`)
