# fuelPrices: Twitter Bot running on Google Apps Script.

Hosting a twitter posting bot on Google's Apps Script environment while using Google Sheets as your data store.

## Links

- Bot Account: https://twitter.com/FuelPriceHike
- Data Store: https://docs.google.com/spreadsheets/d/1fMASOyPWnOQyaNBg4SUwmtIW2C6uWEWIYrrTJq0HaI8/edit
- Post: https://nishantarora.in/Hosting-A-Twitter-Bot-With-Google-Apps-Script.naml

## Building

- This project uses [clasp](https://github.com/google/clasp) and rollup.
- to run:

```sh
$ npm i
$ npm build;
```
- This should build `fuelPrice.js` in the `dist` folder. Now just create a new GAppsScript project using clasp or pull something already existing.
- Add you secrets to the `dist` folder (don't commit them)
- To push:

```sh
$ npm push
```

## Posting tweets

The twitter module exposes a simple class, you need to have `secrets.ts` populated before you can build that module. An example file has been provided, just
fill those values and do not commit them. The usage is simple:

```js
const twitter = new Twitter();
twitter.tweet(`msg`);
```

This module can be separately used to post tweets using Google Apps Scripts.

## License

MIT
