// 引入模块
const router = require('koa-router')()
const controllers = require('../controllers/contack')

// 添加联系人
router.get('/contack-add', controllers.getContack_add)
router.post('/contack-add', controllers.postContack_add)

// 管理联系人
router.get('/contack-list', controllers.getContack_list)
router.post('/contack-list', controllers.postContack_list)

// 删除联系人
router.post('/contack-delete', controllers.postContack_delete)

module.exports = router
