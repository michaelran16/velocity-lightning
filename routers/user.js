// import
const router = require('koa-router')()
const controllers = require('../controllers/user')

// registration page
router.get('/register', controllers.getRegister)

// login page
router.get('/', controllers.getLogin)
router.get('/login', controllers.getLogin)

// log out
router.get('/logout', controllers.getLogout)

//post register and login
router.post('/register', controllers.postRegister)
router.post('/login', controllers.postLogin)

module.exports = router