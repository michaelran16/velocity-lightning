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
app.use(require('./routers/channel.js').routes())
//监听端口
let server = app.listen(`${config.port}`)
console.log(`listening on port ${config.port}`)
let io = socket(server);
users = [];
let kit = {
	//判断用户是否存在
	isHaveUser(user) {
		var flag = false;
		users.forEach(function (item) {
			if (item.name == user.name) {
				flag = true;
			}
		})
		return flag;
	},
	//删除某一用户
	delUser(id) {
		users.forEach(function (item, index) {
			if (item.id == id) {
				users.splice(index, 1);
			}
		})
	}
}
io.on('connection', function (socket) {
	socket.on('login', (user) => {
		if (kit.isHaveUser) {
      		socket.emit('loginFail', "登录失败,昵称已存在!");
		} else {
			socket.user = user;
			user.id = socket.id;
			user.address = socket.handshake.address;
			users.push(user)
			socket.broadcast.emit('system', user, 'join');
		}
	})
	socket.on('disconnect',()=> {
		if (socket.user != null) {
			kit.delUser(socket.id);
			socket.broadcast.emit('system', socket.user, 'logout');
		}
	});
    socket.on('message', function (id, msg, from) {
        socket.broadcast.emit('message', { text:data.text});
    });
});