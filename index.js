const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.use(require('./routers/stellar.js').routes())
app.listen(3000);
