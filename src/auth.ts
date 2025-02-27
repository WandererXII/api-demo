import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { readStream } from './ndJsonStream';
import { BASE_PATH } from './routing';

//export const lishogiHost = 'https://lishogi.org';
export const lishogiHost = 'http://localhost:9663';
export const scopes = ['board:play'];
export const clientId = 'lishogi-api-demo';
export const clientUrl = `${location.protocol}//${location.host}${BASE_PATH || '/'}`;

export interface Me {
  id: string;
  username: string;
  httpClient: HttpClient; // with pre-set Authorization header
  perfs: { [key: string]: any };
}

export class Auth {
  oauth = new OAuth2AuthCodePKCE({
    authorizationUrl: `${lishogiHost}/oauth`,
    tokenUrl: `${lishogiHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: console.warn,
  });
  me?: Me;

  async init() {
    try {
      const accessContext = await this.oauth.getAccessToken();
      if (accessContext) await this.authenticate();
    } catch (err) {
      console.log(err);
    }
    if (!this.me) {
      try {
        const hasAuthCode = await this.oauth.isReturningFromAuthServer();
        if (hasAuthCode) await this.authenticate();
      } catch (err) {
        console.log(err);
      }
    }
  }

  async login() {
    await this.oauth.fetchAuthorizationCode();
  }

  async logout() {
    if (this.me) await this.me.httpClient(`${lishogiHost}/api/token`, { method: 'DELETE' });
    localStorage.clear();
    this.me = undefined;
  }

  private authenticate = async () => {
    const httpClient = this.oauth.decorateFetchHTTPClient(window.fetch);
    const res = await httpClient(`${lishogiHost}/api/account`);
    const me = {
      ...(await res.json()),
      httpClient,
    };
    if (me.error) throw me.error;
    this.me = me;
  };

  openStream = async (path: string, config: any, handler: (_: any) => void) => {
    const stream = await this.fetchResponse(path, config);
    return readStream(`STREAM ${path}`, stream, handler);
  };

  fetchBody = async (path: string, config: any = {}) => {
    const res = await this.fetchResponse(path, config);
    const body = await res.json();
    return body;
  };

  private fetchResponse = async (path: string, config: any = {}) => {
    const res = await (this.me?.httpClient || window.fetch)(`${lishogiHost}${path}`, config);
    if (res.error || !res.ok) {
      const err = `${res.error} ${res.status} ${res.statusText}`;
      alert(err);
      throw err;
    }
    return res;
  };
}
