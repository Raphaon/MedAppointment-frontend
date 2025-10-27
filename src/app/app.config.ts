import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from '@app/app.routes';
import { authInterceptor } from '@app/core/interceptors/auth.interceptor';
import { provideIonicAngular } from '@ionic/angular/standalone';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideIonicAngular(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};