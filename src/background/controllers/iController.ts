import RunebaseChromeController from '.';

export default abstract class IController {
  protected main: RunebaseChromeController;
  private name: string;

  constructor(name: string, main: RunebaseChromeController) {
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
