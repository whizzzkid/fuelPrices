import { TWITTER_CONSUMER_KEY, TWITTER_ACCESS_TOKEN, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_SECRET } from "./secrets";
import { Tweet } from "./interfaces/Tweet";
import { OAuthParams } from "./interfaces/OAuthParams";
import { DEBUG } from "../config";

export class Twitter {
    _method: GoogleAppsScript.URL_Fetch.HttpMethod = 'post';
    _baseUrl: string = "https://api.twitter.com/1.1/statuses/update.json";

    constructor() {}

    get baseParameters(): Omit<OAuthParams, 'oauth_signature'> {
        const timestamp = (Math.floor((new Date()).getTime() / 1000)).toString();
        return {
            oauth_consumer_key: TWITTER_CONSUMER_KEY,
            oauth_token: TWITTER_ACCESS_TOKEN,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            oauth_nonce: timestamp + Math.floor(Math.random() * 100000000)
        };
    }

    generateUrlParamString(obj: Object, encode: boolean = false): string {
        return Object.entries(obj).map(([key, value]: [string, string]) => encode ? `${key}=${this.encode(value)}` : `${key}=${value}`).join('&');
    }

    generateOauthParameters(payload: Tweet): OAuthParams {
        const baseParams: Omit<OAuthParams, 'oauth_signature'> = this.baseParameters;
        const baseString: string = this.encode([
            this._method.toUpperCase(),
            this._baseUrl,
            this.generateUrlParamString({ ...baseParams, ...payload })
        ].join('&'));
        return {
            ...baseParams,
            oauth_signature: Utilities.base64Encode(
                Utilities.computeHmacSignature(
                    Utilities.MacAlgorithm.HMAC_SHA_1,
                    baseString,
                    `${TWITTER_CONSUMER_SECRET}&${TWITTER_ACCESS_SECRET}`
                )
            )
        }
    }

    generateOptions(tweet: Tweet): GoogleAppsScript.URL_Fetch.URLFetchRequestOptions {
        const oauthParameters: OAuthParams = this.generateOauthParameters(tweet);
        const authorization: string = Object.entries(oauthParameters).map(([key, value]: [string, string]) => `${key}="${this.encode(value)}"`).join(', ');
        const payload: string = this.generateUrlParamString(tweet, true);
        return {
            method: this._method,
            headers: {
                authorization: `OAuth ${authorization}`
            },
            payload,
            muteHttpExceptions: true
        }
    }

    encode(str: string): string {
        return encodeURIComponent(str)
            .replace('!', '%21')
            .replace('*', '%2A')
            .replace('(', '%28')
            .replace(')', '%29')
            .replace(`'`, '%27');
    }

    tweet(msg: string): void {
        const payload = {
            status: msg
        };

        const options = this.generateOptions(payload);

        const response = UrlFetchApp.fetch(this._baseUrl, options);
        Logger.log(JSON.stringify({
            tweet: msg,
            options,
            responseHeader: response.getHeaders(),
            responseText: response.getContentText()
        }));
    }

}