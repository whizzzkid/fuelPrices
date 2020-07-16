import { TWITTER_CONSUMER_KEY, TWITTER_ACCESS_TOKEN, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_SECRET } from "./secrets";
import { Tweet } from "./interfaces/Tweet";
import { OAuthParams } from "./interfaces/OAuthParams";
import { DEBUG } from "../config";

export class Twitter {
    _method: GoogleAppsScript.URL_Fetch.HttpMethod = 'post';
    _baseUrl: string = 'https://api.twitter.com/1.1/statuses/update.json';

    constructor() {}

    get baseParameters(): Omit<OAuthParams, 'oauth_signature'> {
        const timestamp = (Math.floor((new Date()).getTime() / 1000)).toString();
        
        return {
            include_entities: true,
            oauth_consumer_key: TWITTER_CONSUMER_KEY,
            oauth_nonce: timestamp + Math.floor(Math.random() * 100000000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_token: TWITTER_ACCESS_TOKEN,
            oauth_version: '1.0'
        };
    }

    generateUrlParamsArray({
        obj,
        translationMethod
    }: {
        obj: Object,
        translationMethod: Function
    }): Array<string> {
        if (Object.entries(obj).length === 0) {
            return [];
        }
        return Object.entries(obj).map(entry => translationMethod(entry)).sort();
    }

    generateUrlParamsString({
        obj = {}, 
        translationMethod, 
        delimiter = '&', 
        prepend = [], 
        append = []
    } : {
        obj?: Object,
        translationMethod?: Function, 
        delimiter?: string,
        prepend?: Array<string>,
        append?: Array<string>
    }): string {
        return [...prepend, ...this.generateUrlParamsArray({obj, translationMethod}), ...append].join(delimiter);
    }

    generateOauthParameters(payload: Tweet): OAuthParams {
        const baseParams: Omit<OAuthParams, 'oauth_signature'> = this.baseParameters;
        
        const baseEncoded = this.generateUrlParamsString({
            obj: {...baseParams, ...payload},
            translationMethod: ([key, value]: [string, string]): string => (`${this.percentEncode(key)}=${this.percentEncode(value)}`)
        })

        const baseString: string = this.generateUrlParamsString({
            prepend: [
                this._method.toUpperCase(),
                this.percentEncode(this._baseUrl),
                this.percentEncode(baseEncoded),
            ]
        });

        if (DEBUG) {
            Logger.log(baseString);
        }

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
        if (DEBUG) {
            Logger.log(oauthParameters);
        }
        
        const authorization: string = this.generateUrlParamsString({
            obj: oauthParameters, 
            translationMethod: ([key, value]: [string, string]): string => `${key}="${value}"`, 
            delimiter: ', '
        });

        const payload: string = this.generateUrlParamsString({
            obj: tweet, 
            translationMethod: ([key, value]: [string, string]): string => `${key}=${value}`
        });
        
        return {
            method: this._method,
            headers: {
                authorization: `OAuth ${authorization}`
            },
            payload,
            muteHttpExceptions: true
        }
    }

    percentEncode(str: string): string {
        return encodeURIComponent(str)
            .replace(/\!/g, '%21')
            .replace(/\*/g, '%2A')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\'/g, '%27');
    }

    tweet(msg: string): void {
        const payload = {
            status: this.percentEncode(msg)
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