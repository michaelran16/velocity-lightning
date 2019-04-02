const router = require('koa-router')()
const controllers = require('../controllers/transaction')

router.get('/transaction-list', controllers.getTxList)
router.get('/create', controllers.getCreate)
router.post('/create', controllers.postCreate)

module.exports = router