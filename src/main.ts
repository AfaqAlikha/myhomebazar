// main.ts (browser entry)
import 'zone.js'; // ✅ REQUIRED
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from './app/shared/shared.module';

bootstrapApplication(AppComponent, {
  providers: [
    ...(appConfig.providers || []),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(
      SharedModule,
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-bottom-right',
        preventDuplicates: false,
      })
    ),
  ],
}).catch((err) => console.error(err));
