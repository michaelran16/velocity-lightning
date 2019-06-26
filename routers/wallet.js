// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/wallet')

// 我的钱包
router.get('/wallet', controllers.getWallet)
router.post('/wallet', controllers.postWallet)
router.post('/wallet-list', controllers.postWallet_list)

module.exports = router
