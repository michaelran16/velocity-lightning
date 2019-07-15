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
	key : "test",
	httpOnly : false,
}
app.use(session(sessionConfig, app));
//静态资源加载中间件配置
app.use(koaStatic(
	path.join(__dirname, './static')
))
//缓存配置
app.use(staticCache(path.join(__dirname, './static'), {dynamic:true}, {
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
app.use(require('./routers/contack.js').routes())
app.use(require('./routers/channel.js').routes())
app.use(require('./routers/message.js').routes())
app.use(require('./routers/wallet.js').routes())
//监听端口
let server = app.listen(`${config.port}`)
console.log(`listening on port ${config.port}`)
let io = socket(server);

function del_arr(arr, num) {
	for (i in arr) {
		if (arr[i]==num) {
			delete(arr[i]);
		}
	}
	return arr;
}

function query_arr(arr, num) {
	for (i in arr) {
		if (arr[i]==num) {
			return i;
		}
	}
}

arr = [];

io.on('connection', function (socket) {

	var _data = '{ "type" : "init" }';
	socket.emit('message', _data);

	socket.on('message', function(data) {
		
		var data = JSON.parse(data);

		switch(data.type){

			case "bind":
				arr[data.fromid] = socket.id;
				break;

			case "text":
				var _data = '{ "type" : "text", "data" : "'+data.content+'", "toid" : "'+data.toid+'", "fromid" : "'+data.fromid+'" }';
				io.to(arr[data.toid]).emit('message', _data);
				socket.emit('message', _data);
        		break;
        }
	})
	
	socket.on('disconnect', function() {
		del_arr(arr, socket.id);
	});
})