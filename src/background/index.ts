import RunebaseChromeController from './controllers';

// Add instance to window for debugging
const controller = new RunebaseChromeController();
Object.assign(window, { controller });
