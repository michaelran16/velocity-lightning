//引入模块
const router = require('koa-router')()
const controllers = require('../controllers/stellar')

router.get('/stellar/step1', controllers.step1)

module.exports = router
