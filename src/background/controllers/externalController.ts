import axios from 'axios';

import HtmlcoinChromeController from '.';
import IController from './iController';
import { MESSAGE_TYPE } from '../../constants';

const INIT_VALUES = {
  getPriceInterval: undefined,
  htmlcoinPriceUSD: 0,
};

export default class ExternalController extends IController {
  private static GET_PRICE_INTERVAL_MS: number = 60000;

  private getPriceInterval?: number = INIT_VALUES.getPriceInterval;
  private htmlcoinPriceUSD: number = INIT_VALUES.htmlcoinPriceUSD;

  constructor(main: HtmlcoinChromeController) {
    super('external', main);
    this.initFinished();
  }

  public calculateHtmlcoinToUSD = (balance: number): number => {
    return this.htmlcoinPriceUSD ? Number((this.htmlcoinPriceUSD * balance).toFixed(2)) : 0;
  }

  /*
  * Starts polling for periodic info updates.
  */
  public startPolling = async () => {
    await this.getHtmlcoinPrice();
    if (!this.getPriceInterval) {
      this.getPriceInterval = window.setInterval(() => {
        this.getHtmlcoinPrice();
      }, ExternalController.GET_PRICE_INTERVAL_MS);
    }
  }

  /*
  * Stops polling for the periodic info updates.
  */
  public stopPolling = () => {
    if (this.getPriceInterval) {
      clearInterval(this.getPriceInterval);
      this.getPriceInterval = undefined;
    }
  }

  /*
  * Gets the current Htmlcoin market price.
  */
  private getHtmlcoinPrice = async () => {
    try {
      // const jsonObj = await axios.get('https://api.coinmarketcap.com/v2/ticker/xxxx/');
      const jsonObj = await axios.get('https://api.coinpaprika.com/v1/ticker/html-htmlcoin');
      // this.htmlcoinPriceUSD = jsonObj.data.data.quotes.USD.price;
      this.htmlcoinPriceUSD = jsonObj.data.price_usd;

      if (this.main.account.loggedInAccount
        && this.main.account.loggedInAccount.wallet
        && this.main.account.loggedInAccount.wallet.info
      ) {
        const htmlcoinUSD = this.calculateHtmlcoinToUSD(this.main.account.loggedInAccount.wallet.info.balance);
        this.main.account.loggedInAccount.wallet.htmlcoinUSD = htmlcoinUSD;

        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.GET_HTMLCOIN_USD_RETURN,
          htmlcoinUSD,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}
