import { mergeApplicationConfig, ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { AppBrandingService } from './core/services/app-branding.service';
import { SeoService } from './services/seo';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      const branding = inject(AppBrandingService);
      const seo = inject(SeoService);
      return firstValueFrom(branding.getLogo())
        .then((res) => {
          if (res?.logo) seo.setOrganizationBranding(res.logo);
        })
        .catch(() => undefined);
    }),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
