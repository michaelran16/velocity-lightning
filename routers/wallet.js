// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/wallet')

// 我的钱包
router.get('/wallet', controllers.getWallet)
router.post('/wallet', controllers.postWallet)

module.exports = router
