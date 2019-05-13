//引入模块
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
//实例化Koa
const app = new koa()
app.keys = ['secret'];
const sessionConfig = {
	key : "alice",
	httpOnly : false,
}
app.use(session(sessionConfig, app));
//静态资源加载中间件配置
app.use(koaStatic(
	path.join(__dirname, './static')
))
//缓存配置
app.use(staticCache(path.join(__dirname, './static/css'), {dynamic:true}, {
	maxAge : 365*24*60*60
}))
//模板渲染中间件配置
app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}))
app.use(bodyParser({
	formLimit : '1mb'
}))
//路由配置
app.use(require('./routers/user.js').routes())
app.use(require('./routers/transaction.js').routes())
//监听端口
let server = app.listen(`${config.port}`)
console.log(`listening on port ${config.port}`)
let io = socket(server);
io.on('connection', function (socket) {
    socket.on('send', function (data) {
        console.log(data)
        socket.broadcast.emit('receive', { text:data.text});
    });
});