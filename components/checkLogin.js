module.exports = {
	// already logged in
	checkNotLogin : (ctx) => {
		if (ctx.session && ctx.session.name) {
			ctx.redirect('/lobby')
			return false;
		}
		return true;
	},
    
	// not logged in yet
	checkLogin : (ctx) => {
		if (!ctx.session || !ctx.session.name) {
			ctx.redirect('/login')
			return false;
		}
		return true;
	}
}