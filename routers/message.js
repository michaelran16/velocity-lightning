// 引入模块

const router = require('koa-router')()
const controllers = require('../controllers/message.js')

router.get('/message-list', controllers.getMessage_list)
router.post('/message-list', controllers.postMessage_list)
router.get('/message-details/:id', controllers.getMessage_details)

module.exports = router
