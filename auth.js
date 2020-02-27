const { teenyRequest } = require('teeny-request');

const locales = new Map([
  ['de', 'de_DE'],
  ['en', 'en_GB'],
  ['fr', 'fr_FR']
]);

class Auth {
  /**
   * @param {*} logger A custom logger (ex: bunyan, pino)
   * @param {*} logLevel Logger level
   */
  constructor(logger = null, logLevel = 'log') {
    this.logger = logger;
    this.logLevel = logLevel;
    this.request = teenyRequest.defaults();
  }

  get log() {
    return this.logger ? (this.logger[this.logLevel] ? this.logger[this.logLevel] : console.log) : console.log;
  }

  /**
   * Simulate logging onto a Gameforge TERA account to retrieve an auth ticket.
   * @param {*} email Account email
   * @param {*} password Account password
   * @param {...any} opts
   */
  login(email, password, ...opts) {
    const cb = opts.pop();
    if (typeof cb !== 'function') throw new Error('Last argument should be a function.');
    let accountId, language;
    if (opts.length) ({ accountId, language } = opts[0]);
    if (!locales.has(language)) language = 'en';

    this.getBearer({ email, password }, (err, bearer) => {
      if (err) return cb(err);

      this.getAccounts({ bearer }, (err, accounts) => {
        if (err) return cb(err);

        if (!accounts.length) return cb(new Error('No TERA account on this Gameforge account.'));
        else if (!accountId) {
          accountId = accounts[0].id;
          if (accounts.length > 1) this.log(`Multiples TERA accounts are linked to this Gameforge account, I'll use TERA account: '${accountId}'.`);
        } else if (!accounts.filter(account => account.id === accountId).length) {
          const submittedAccountId = accountId;
          accountId = accounts[0].id;
          if (accounts.length > 1)
            this.log(
              `Multiples TERA accounts are linked to this Gameforge account, TERA account '${submittedAccountId}' don't exist on this Gameforge account, I'll use TERA account: '${accountId}'.`
            );
          else this.log(`TERA account '${submittedAccountId}' don't exist on this Gameforge account, I'll use TERA account: '${accountId}'.`);
        }

        this.getMAuthSession({ accountId, bearer }, (err, mauth_session) => {
          if (err) return cb(err);

          this.getSID({ mauth_session, language, accountId }, (err, SID) => {
            if (err) return cb(err);

            this.getServerInfo({ SID }, (err, serverInfo) => {
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
  getBearer({ email, password }, cb) {
    this.request(
      {
        url: 'https://spark.gameforge.com/api/v1/auth/sessions',
        method: 'POST',
        json: { email, password, locale: 'en_GB' }
      },
      (err, res, body) => {
        if (err) return cb(err);
        if (body.error) return cb(new Error(body.error.message || body.error));

        return cb(null, body.token);
      }
    );
  }

  /**
   * Get accounts list
   */
  getAccounts({ bearer }, cb) {
    this.request(
      {
        url: 'https://spark.gameforge.com/api/v1/user/accounts',
        headers: { Authorization: `Bearer ${bearer}` }
      },
      (err, res, body) => {
        if (err) return cb(err);
        if (body.error) return cb(new Error(body.error.message || body.error));

        const accounts = Object.values(body).filter(account => account.gameId === '68f799ce-b2cf-44f5-8638-ce992d7fd0f4' || account.guls.game === 'tera');

        return cb(null, accounts);
      }
    );
  }

  /**
   * Get mauth_session
   */
  getMAuthSession({ accountId, bearer }, cb) {
    this.request(
      {
        url: 'https://spark.gameforge.com/api/v1/auth/thin/codes',
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}` },
        json: { platformGameAccountId: accountId }
      },
      (err, res, body) => {
        if (err) return cb(err);
        if (body.error) return cb(new Error(body.error.message || body.error));

        return cb(null, body.code);
      }
    );
  }

  /**
   * Get SID
   */
  getSID({ mauth_session, language }, cb) {
    this.request(
      {
        url: 'https://login.tera.gameforge.com/launcher/loginMAuth',
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `mauth_session=${mauth_session}&language=${locales.get(language)}`
      },
      (err, res, body) => {
        if (err) return cb(err);
        if (res.statusCode === 403) return cb(new Error('Account blocked, Please contact Support'));
        // statusCode 412 = Server in maintenance?
        if (body.error) return cb(new Error(body.error.message || body.error));

        if (!res.headers['set-cookie']) return cb(new Error('No set-cookie in header.'));
        const regex = /SID=(?<SID>[\d\w-%]{1,50});/.exec(res.headers['set-cookie']);
        if (!regex || !regex.groups.SID) return cb(new Error(`Cant find SID in cookie. ${res.headers['set-cookie']}`));

        return cb(null, regex.groups.SID);
      }
    );
  }

  /**
   * Get ServerInfo
   */
  getServerInfo({ SID }, cb) {
    this.request(
      {
        url: 'https://login.tera.gameforge.com/launcher/getServerInfo',
        headers: { cookie: `SID=${SID}` }
      },
      (err, res, body) => {
        if (err) return cb(err);
        if (body.error) return cb(body.error);

        return cb(null, body);
      }
    );
  }
}

module.exports = Auth;
