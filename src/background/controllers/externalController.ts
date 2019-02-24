import axios from 'axios';

import RunebaseChromeController from '.';
import IController from './iController';
import { MESSAGE_TYPE } from '../../constants';

const INIT_VALUES = {
  getPriceInterval: undefined,
  runebasePriceUSD: 0,
};

export default class ExternalController extends IController {
  private static GET_PRICE_INTERVAL_MS: number = 60000;

  private getPriceInterval?: number = INIT_VALUES.getPriceInterval;
  private runebasePriceUSD: number = INIT_VALUES.runebasePriceUSD;

  constructor(main: RunebaseChromeController) {
    super('external', main);
    this.initFinished();
  }

  public calculateRunebaseToUSD = (balance: number): number => {
    return this.runebasePriceUSD ? Number((this.runebasePriceUSD * balance).toFixed(2)) : 0;
  }

  /*
  * Starts polling for periodic info updates.
  */
  public startPolling = async () => {
    await this.getRunebasePrice();
    if (!this.getPriceInterval) {
      this.getPriceInterval = window.setInterval(() => {
        this.getRunebasePrice();
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
  * Gets the current Runebase market price.
  */
  private getRunebasePrice = async () => {
    try {
      //const jsonObj = await axios.get('https://api.coinmarketcap.com/v2/ticker/xxxx/');
      const jsonObj = await axios.get('https://api.coinpaprika.com/v1/ticker/runes-runebase');
      //this.runebasePriceUSD = jsonObj.data.data.quotes.USD.price;
      this.runebasePriceUSD = jsonObj.data.price_usd;

      if (this.main.account.loggedInAccount
        && this.main.account.loggedInAccount.wallet
        && this.main.account.loggedInAccount.wallet.info
      ) {
        const runebaseUSD = this.calculateRunebaseToUSD(this.main.account.loggedInAccount.wallet.info.balance);
        this.main.account.loggedInAccount.wallet.runebaseUSD = runebaseUSD;

        chrome.runtime.sendMessage({
          type: MESSAGE_TYPE.GET_RUNEBASE_USD_RETURN,
          runebaseUSD,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}
