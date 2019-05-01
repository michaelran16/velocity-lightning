// import
const md5 = require('md5');
const fs = require('fs');
const checkNotLogin = require('../components/checkLogin.js').checkNotLogin;
const checkLogin = require('../components/checkLogin.js').checkLogin;
const fetch = require('node-fetch');
const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

// function definitions
exports.getRegister = async ctx => {
	await checkNotLogin(ctx);
	await ctx.render('user/register', {
		session : ctx.session
	})
}
exports.postRegister = async ctx => {
	let {name, password} = ctx.request.body
	let pair = StellarSdk.Keypair.random()
	let response = await fetch(
		`https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
	);
	let json = {
		name:name,
		password:password,
		stellarPublic:pair.publicKey(),
		stellarSecret:pair.secret(),
	}
	let data = JSON.stringify(json, null, "\t")
	fs.writeFile('./user.txt', data, function(err) {
        if (err) {
            throw err;
        }
    });
	ctx.body = {
		code : 200,
		message : '注册成功'
	}
}
exports.getLogin = async ctx => {
	await checkNotLogin(ctx)
	await ctx.render('user/login', {
		session : ctx.session
	})
}
exports.postLogin = async ctx => {
	let {name, password} = ctx.request.body
	let json  = await new Promise((resolve, reject) => {
		fs.readFile('./user.txt', 'utf-8', function(err, data){
			if (err) {
				reject(err)
			} else {
				resolve(JSON.parse(data))
			}
		})
	})
	if (name==json.name && password==json.password) {
		ctx.session = {
			name : name
		}
    	ctx.body = {
    		code : 200,
    		message : '登陆成功'
    	}
    } else {
    	ctx.body = {
    		code : 500,
    		message : '登陆失败'
    	}
    }
}
exports.getLogout = async ctx => {
	ctx.session = null
	ctx.body = {
		code : 200,
		message : '退出成功'
	}
}