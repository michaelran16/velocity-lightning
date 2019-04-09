const router = require('koa-router')()
const controllers = require('../controllers/transaction')

router.get('/lobby', controllers.getLobby)
router.get('/create', controllers.getCreate)
router.post('/create', controllers.postCreate)

module.exports = router