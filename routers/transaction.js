// import
const router = require('koa-router')()
const controllers = require('../controllers/transaction')

// transaction pages
router.get('/lobby', controllers.getLobby)
router.get('/create', controllers.getCreate)
router.post('/create', controllers.postCreate)
router.get('/helper', controllers.getHelper)
router.post('/helper', controllers.postHelper)
router.get('/snapshoot', controllers.getSnapshoot)
router.post('/snapshoot', controllers.postSnapshoot)
router.get('/ratchet', controllers.getRatchet)
router.post('/ratchet', controllers.postRatchet)

module.exports = router