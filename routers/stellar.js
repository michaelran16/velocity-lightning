//引入模块
const router = require('koa-router')()
const controllers = require('../stellar')

router.get('/stellar/setup', controllers.setup)

module.exports = router
