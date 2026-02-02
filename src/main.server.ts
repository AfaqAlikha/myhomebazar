import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import 'zone.js/node';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

// --------------------
// Import global & third-party CSS for SSR
// --------------------
// main.server.ts

import './styles.css';


// --------------------
// Bootstrap application with SSR context
// --------------------
const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, config, context);

export default bootstrap;
