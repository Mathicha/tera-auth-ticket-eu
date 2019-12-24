# tera-auth-ticket-eu

Simulate logging onto a Gameforge TERA account to retrieve an auth ticket.

**Can be broken or/and get ur account banned.**

```js
const auth = require('tera-auth-ticket-eu');

auth({ email: 'uwu@uwu.uwu', password: 'uwu' }, (err, serverInfo) => {
	console.log(serverInfo);
});
```

Optional args :

- `accountId`: default to `null`
- `language`: default to `'en'`, (supported languages : `'en'` `'de'` `'fr'`)
