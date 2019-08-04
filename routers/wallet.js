// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/wallet')

// Stellar Wallet
router.get('/wallet', controllers.getWallet)
router.post('/wallet', controllers.postWallet)
router.post('/wallet-list', controllers.postWallet_list)

module.exports = router
