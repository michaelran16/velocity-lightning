const Koa = require('koa');
const app = new Koa();
const views = require('koa-views')
const path = require('path')

app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}))
app.use(require('./routers/stellar.js').routes())

app.listen(3000);
console.log(`listening on port 3000`)
