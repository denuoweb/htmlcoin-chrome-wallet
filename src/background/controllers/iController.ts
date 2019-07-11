import HtmlcoinChromeController from '.';

export default abstract class IController {
  protected main: HtmlcoinChromeController;
  private name: string;

  constructor(name: string, main: HtmlcoinChromeController) {
    this.name = name;
    this.main = main;
    this.registerController();
  }

  public initFinished = () => {
    this.main.controllerInitialized(this.name);
  }

  private registerController = () => {
    this.main.registerController(this.name);
  }
}
