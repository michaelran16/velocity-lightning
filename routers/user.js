// import
const router = require('koa-router')()
const controllers = require('../controllers/user')

// registration page
router.get('/register', controllers.getRegister)
router.post('/register', controllers.postRegister)

// login page
router.get('/login', controllers.getLogin)
router.get('/', controllers.getLogin)

// log out
router.get('/logout', controllers.getLogout)

//post login
router.post('/login', controllers.postLogin)

module.exports = router