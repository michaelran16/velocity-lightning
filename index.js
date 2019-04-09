const koa = require('koa')
const path = require('path')
const bodyParser = require('koa-bodyparser')
const ejs = require('ejs')
const config = require('./common/config.js')
const router = require('koa-router')
const views = require('koa-views')
const session = require('koa-session')
const koaStatic = require('koa-static')
const staticCache = require('koa-static-cache')
const socket = require('socket.io')

const app = new koa()
app.keys = ['secret'];
const sessionConfig = {
	key : "alice", /* cookie key (default is koa:sess) */
	httpOnly : false, /** (boolean) httpOnly or not (default true) */
}
app.use(session(sessionConfig, app));

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

let server = app.listen(`${config.port}`)
console.log(`listening on port ${config.port}`)
let io = socket(server);
io.on('connection', function (socket) {
    socket.on('send', function (data) {
        console.log(data)
        socket.broadcast.emit('receive', { text:data.text});
    });
});
