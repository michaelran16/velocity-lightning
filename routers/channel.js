//引入模块
const router = require('koa-router')()
const controllers = require('../controllers/channel.js')
router.get('/channel-list', controllers.getChannel_list)
router.post('/channel-list', controllers.postChannel_list)
router.get('/channel-details/:id', controllers.getChannel_details)
router.post('/channel-details/:id', controllers.postChannel_details)
router.get('/channel-create', controllers.getChannel_create)
router.post('/channel-create', controllers.postChannel_create)
module.exports = router