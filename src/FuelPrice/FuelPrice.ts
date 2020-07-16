import { API_URL, SHEET_NAME, SNAPSHOT_INTERVALS, CAUSED } from './constants';
import { DestFuelPrice } from './interfaces/DestFuelPrice';
import { ApiResponse } from './interfaces/ApiResponse';
import { Twitter } from '../Twitter';
import { DEBUG } from '../config';

export class FuelPrice {
    _sheet: GoogleAppsScript.Spreadsheet.Sheet;
    _results: Array<DestFuelPrice>;
    _headers: Array<String>;
    _twitter: Twitter;

    constructor(twitter?: Twitter) {
        this._twitter = twitter;
    }

    run(): void {
        this.refreshResults();
        this.loadSheet();
        this.refreshHeaders();
        const createdDate = new Date(this._results[0].createdDate);
        const lastDate = new Date(this._sheet.getRange(2,1).getValue() || 0);
        if (createdDate > lastDate || DEBUG) {
            this._sheet.insertRowAfter(1);
            this._sheet.getRange(2,1).setValue(createdDate);
            this._results.forEach(({cityState, ...result}: DestFuelPrice, idx: number) => {
                const r = {...result, cityState: cityState.replace(' ', '')};
                const petrolCol = (2 * idx) + 2;
                const dieselCol = petrolCol + 1;
                this.digestPrice(r, petrolCol, 'Petrol')
                this.digestPrice(r, dieselCol, 'Diesel');
            });
        }
    }

    digestPrice(result: DestFuelPrice, col: number, commodity: 'Petrol' | 'Diesel') {
        this.fixHeaders(result, col, commodity);
        const newPriceKey: (keyof DestFuelPrice) = commodity === 'Petrol' ? 'petrolPrice': 'dieselPrice';;
        const {
            [newPriceKey]: newPriceStr,
            cityState
        } = result;
        const newPrice = parseFloat(parseFloat(`${newPriceStr}`).toFixed(2));
        const oldPrice = parseFloat(this._sheet.getRange(3, col).getValue() || newPrice);
        
        // save value
        this._sheet.getRange(2,col).setValue(newPrice);
        
        // process msg.
        if (oldPrice !== newPrice) {
            let snapshotMsgs = [];
            let snapshotMsg = '';
            SNAPSHOT_INTERVALS.forEach((day) => {
                const dayPrice = parseFloat(this._sheet.getRange(day + 2, col).getValue() || newPrice);
                const change = this.priceChange(dayPrice, newPrice, 'percentage');
                if (change !== '') {
                    snapshotMsgs.push(`${day} days: ${change}`);
                }
            });
            if (snapshotMsgs.length) {
                snapshotMsg = `Change since: [ ${snapshotMsgs.join(', ')} ]`
            }
            const tweet = `#${commodity}Price in #${cityState} ${this.resultCaused(oldPrice, newPrice)} by ${this.priceChange(oldPrice, newPrice)}, new price: ${this.currencyStr(newPrice)}. ${snapshotMsg}`;
            this.sendTweet(tweet);
        }
    }

    sendTweet(msg: string): void {
        try {
            this._twitter.tweet(msg);
        } catch (err) {
            Logger.log(err);
        }
    }

    priceChange(oldPrice: number, newPrice: number, type: string = 'val'): string {
        const diff = this.calculateDiff(oldPrice, newPrice);
        
        if (diff === 0.00) {
          return '';
        }
        
        if (type === 'val') {
          return this.currencyStr(diff);
        }
      
        if (type === 'percentage') {
          const percentage = ((diff/oldPrice)*100).toFixed(2);
          return `${this.resultCaused(oldPrice, newPrice, 'sym')}${percentage}%`;
        }
    }

    calculateDiff(a: number, b: number): number {
        const high = Math.max(a, b);
        const low = Math.min(a, b);
        const diff = (high - low).toFixed(2);
        return Number(diff);
    }

    currencyStr(val: number): string {
        if (val < 1) {
          return `${val.toFixed(2)} paisa/L`;
        }
        return `₹${val.toFixed(2)}/L`;
    }

    resultCaused(oldPrice: number, newPrice: number, type: string = 'msg'): string {
        if (oldPrice < newPrice) {
          return CAUSED.increase[type];
        }
        return CAUSED.decrease[type];
    }

    fixHeaders({ cityState }: DestFuelPrice, col: number, commodity: string): void {
        const header = `${cityState}_${commodity}`;
        if (this._headers[col - 1] !== header) {
            this._sheet.insertColumnBefore(col);
            this._sheet.getRange(1,col).setValue(header);
            this.refreshHeaders();
        }
    }

    refreshHeaders(): void {
        ({ [0]: this._headers } = this._sheet.getSheetValues(1, 1, 1, (this._results.length * 2) + 1));
    }

    loadSheet(): void {
        this._sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    }

    getResponseFromApi(type: string): ApiResponse {
        return <ApiResponse>JSON.parse(UrlFetchApp.fetch(`${API_URL}${type}`).getContentText());
    }

    refreshResults(): void {
        const { results: cityResults }: ApiResponse = this.getResponseFromApi('city');
        const { results: stateResults }: ApiResponse = this.getResponseFromApi('state');  
        this._results = [...cityResults, ...stateResults].sort((a, b) => {
            if ( a.seoname < b.seoname ){
                return -1;
            }
            if ( a.seoname > b.seoname ){
                return 1;
            }
            return 0;
        });
    }
}