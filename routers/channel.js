//引入模块
const router = require('koa-router')()
const controllers = require('../controllers/channel.js')
//注册页面
router.get('/channel-list', controllers.getChannel_list)
router.post('/channel-list', controllers.postChannel_list)
module.exports = router