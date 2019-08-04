// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/user')

// 注册页面
router.get('/register', controllers.getRegister)
// post注册
router.post('/register', controllers.postRegister)
// 登录页面
router.get('/login', controllers.getLogin)
router.get('/', controllers.getLogin)
// Log Out
router.get('/logout', controllers.getLogout)
// post登录
router.post('/login', controllers.postLogin)

module.exports = router
