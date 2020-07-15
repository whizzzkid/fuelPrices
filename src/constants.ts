export const DEBUG = false;
export const API_URL = 'https://mfapps.indiatimes.com/ET_Calculators/oilpricebycitystate.htm?type=';
export const SHEET_NAME = 'history';
export const SNAPSHOT_INTERVALS = [15, 30, 90, 180, 365];
export const CAUSED = {
    increase: {
        msg: '#hiked',
        sym: '+'
    },
    decrease: {
        msg: '#down',
        sym: '-'
    }
}