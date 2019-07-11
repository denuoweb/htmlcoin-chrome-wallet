import { action } from 'mobx';
import { Wallet as HtmlcoinWallet, Insight, WalletRPCProvider } from 'htmlcoinjs-wallet';
import deepEqual from 'deep-equal';

import { ISigner } from '../types';
import { ISendTxOptions } from 'htmlcoinjs-wallet/lib/tx';
import { RPC_METHOD, NETWORK_NAMES } from '../constants';

export default class Wallet implements ISigner {
  public qjsWallet?: HtmlcoinWallet;
  public rpcProvider?: WalletRPCProvider;
  public info?: Insight.IGetInfo;
  public htmlcoinUSD?: number;
  public maxHtmlcoinSend?: number;

  constructor(qjsWallet: HtmlcoinWallet) {
    this.qjsWallet = qjsWallet;
    this.rpcProvider = new WalletRPCProvider(this.qjsWallet);
  }

  @action
  public updateInfo = async () => {
    if (!this.qjsWallet) {
      console.error('Cannot updateInfo without qjsWallet instance.');
    }

    /**
     * We add a timeout promise to handle if qjsWallet hangs when executing getInfo.
     * (This happens if the insight api is down)
     */
    let timedOut = false;
    const timeoutPromise = new Promise((_, reject) => {
      const wait = setTimeout(() => {
        clearTimeout(wait);
        timedOut = true;
        reject(Error('wallet.getInfo failed, insight api may be down'));
      }, 30000);
    });

    const getInfoPromise = this.qjsWallet!.getInfo();
    const promises = [timeoutPromise, getInfoPromise];
    let newInfo: any;
    try {
      newInfo = await Promise.race(promises);

      // if they are not equal, then the balance has changed
      if (!timedOut && !deepEqual(this.info, newInfo)) {
        this.info = newInfo;
        return true;
      }
    } catch (e) {
      throw(Error(e));
    }

    return false;
  }

  // @param amount: (unit - whole HTMLCOIN)
  public send = async (to: string, amount: number, options: ISendTxOptions): Promise<Insight.ISendRawTxResult> => {
    if (!this.qjsWallet) {
      throw Error('Cannot send without wallet.');
    }

    // convert amount units from whole HTMLCOIN => SATOSHI HTMLCOIN
    return await this.qjsWallet!.send(to, amount * 1e8, { feeRate: options.feeRate });
  }

  public sendTransaction = async (args: any[]): Promise<any> => {
    if (!this.rpcProvider) {
      throw Error('Cannot sign transaction without RPC provider.');
    }
    if (args.length < 2) {
      throw Error('Requires first two arguments: contractAddress and data.');
    }

    try {
      return await this.rpcProvider!.rawCall(RPC_METHOD.SEND_TO_CONTRACT, args);
    } catch (err) {
      throw err;
    }
  }

  public calcMaxHtmlcoinSend = async (networkName: string) => {
    if (!this.qjsWallet || !this.info) {
      throw Error('Cannot calculate max send amount without wallet or this.info.');
    }
    this.maxHtmlcoinSend = await this.qjsWallet.sendEstimateMaxValue(this.maxHtmlcoinSendToAddress(networkName));
    return this.maxHtmlcoinSend;
  }

  /**
   * We just need to pass a valid sendTo address belonging to that network for the
   * htmlcoinjs-wallet library to calculate the maxHtmlcoinSend amount.  It does not matter what
   * the specific address is, as that does not affect the value of the
   * maxHtmlcoinSend amount
   */
  private maxHtmlcoinSendToAddress = (networkName: string) => {
    return networkName === NETWORK_NAMES.MAINNET ?
      'HqLg1oj1o2YRE6ZwctvpYP4kfaXvGZV2WT' : 'hqLg1oj1o2YRE6ZwctvpYP4kfaXvGZV2WT';
  }
}
