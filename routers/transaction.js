// import
const router = require('koa-router')()
const controllers = require('../controllers/transaction')

// transaction pages
router.get('/lobby', controllers.getLobby)
router.get('/create', controllers.getCreate)
router.post('/create', controllers.postCreate)
router.get('/snapshoot', controllers.getSnapshoot)
router.post('/snapshoot', controllers.postSnapshoot)

module.exports = router