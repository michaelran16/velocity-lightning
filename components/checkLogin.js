module.exports = {
	// 已经登录
	checkNotLogin : (ctx) => {
		if (ctx.session && ctx.session.name) {
			ctx.redirect('/wallet')
			return false;
		}
		return true;
	},
	// 没有登录
	checkLogin : (ctx) => {
		if (!ctx.session || !ctx.session.name) {
			ctx.redirect('/login')
			return false;
		}
		return true;
	}
}
