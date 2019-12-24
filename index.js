const request = require('request');
const r = request.defaults();

const locales = new Map([
	['de', 'de_DE'],
	['en', 'en_GB'],
	['fr', 'fr_FR']
]);

// Enjoy this nice CB hell :)
function login({ email, password, accountId = null, language = 'en' }, cb) {
	if (!locales.has(language)) language = 'en';

	getBearer({ email, password, language }, (err, bearer) => {
		if (err) return cb(err);

		getAccounts({ bearer }, (err, accounts) => {
			if (err) return cb(err);

			if (!accounts.length) return cb(new Error('No tera account on this gf account'));
			else if (!accounts.includes(accountId)) {
				accountId = accounts[0];
				console.log('Fixed accountId to', accountId);
			}

			getMAuthSession({ accountId, bearer }, (err, mauth_session) => {
				if (err) return cb(err);

				getCookie({ mauth_session, language }, (err, jar) => {
					if (err) return cb(err);

					getServerInfo({ jar }, (err, serverInfo) => {
						if (err) return cb(err);

						return cb(null, serverInfo);
					});
				});
			});
		});
	});
}

/**
 * Get bearer
 */
function getBearer({ email, password, language }, cb) {
	r.post(
		{
			url: 'https://spark.gameforge.com/api/v1/auth/sessions',
			json: { email, password, locale: locales.get(language) }
		},
		(err, res, body) => {
			if (err) return cb(err);
			if (body.error) return cb(new Error(body.error));

			return cb(null, body.token);
		}
	);
}

/**
 * Get accounts list
 */
function getAccounts({ bearer }, cb) {
	r.get(
		{
			url: 'https://spark.gameforge.com/api/v1/user/accounts',
			auth: { bearer },
			json: true
		},
		(err, res, body) => {
			if (err) return cb(err);
			if (body.error) return cb(new Error(body.error));

			const accounts = [];
			for (const account of Object.values(body)) {
				if (account.gameId === '68f799ce-b2cf-44f5-8638-ce992d7fd0f4' || account.guls.game === 'tera') accounts.push(account.id);
			}

			return cb(null, accounts);
		}
	);
}

/**
 * Get mauth_session
 */
function getMAuthSession({ accountId, bearer }, cb) {
	r.post(
		{
			url: 'https://spark.gameforge.com/api/v1/auth/thin/codes',
			json: { platformGameAccountId: accountId },
			auth: { bearer }
		},
		(err, res, body) => {
			if (err) return cb(err);
			if (body.error) return cb(new Error(body.error));

			return cb(null, body.code);
		}
	);
}

/**
 * Get Cookie
 */
function getCookie({ mauth_session, language }, cb) {
	const j = request.jar();

	r.post(
		{
			url: 'https://login.tera.gameforge.com/launcher/loginMAuth',
			form: { mauth_session, language },
			json: true,
			jar: j
		},
		(err, res, body) => {
			if (err) return cb(err);
			if (res.statusCode === 403) return cb(new Error('Account blocked, Please contact Support'));
			// 412 = Server in maintenance
			if (body.error) return cb(new Error(body.error));

			return cb(null, j);
		}
	);
}

/**
 * Get ServerInfo
 */
function getServerInfo({ jar }, cb) {
	r.get(
		{
			url: 'https://login.tera.gameforge.com/launcher/getServerInfo',
			json: true,
			jar
		},
		(err, res, body) => {
			if (err) return cb(err);
			if (body.error) return cb(body.error);

			return cb(null, body);
		}
	);
}

module.exports = login;
