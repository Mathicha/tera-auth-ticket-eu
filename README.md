# tera-auth-ticket-eu

Simulate logging onto a Gameforge TERA account to retrieve an auth ticket.

**Can be broken or/and get ur account banned.**

```js
const auth = require('tera-auth-ticket-eu');

auth.login('uwu@uwu.uwu', 'uwu', { accountId: 'xxxxxxxx', language: 'eu' }, (err, serverInfo) => {
  if (err) console.error(err);
  else console.log(serverInfo);
});
```

## API

- `auth.logger`: A custom logger (ex: [pino](https://www.npmjs.com/package/pino), [bunyan](https://www.npmjs.com/package/bunyan), [log](https://github.com/pinkipi/log))
- `auth.logLevel`: default to `log`, Logger level

### login(email, password[,{ accountId, language }], cb)

- `email`: Account email
- `password`: Account password
- `accountId`: default to `null`, TERA account ID (Use this option if your Gameforge account have multiples TERA accounts linked, if set to `null` the first account will be used)
- `language`: default to `'en'` (Supported languages : `'en'` `'de'` `'fr'`)

## Internal API

### Im lazy to doc this thx bye
