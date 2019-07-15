// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/contack.js')

router.post('/contack-add', controllers.postContack_add)

module.exports = router
