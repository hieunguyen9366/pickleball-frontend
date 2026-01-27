import { enableProdMode, importProvidersFrom } from '@angular/core';
import '@angular/localize/init';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { errorInterceptor } from './app/player/interceptors/error.interceptor';
import { authInterceptor } from './app/player/interceptors/auth.interceptor';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        errorInterceptor,  // Error interceptor chạy trước để log errors
        authInterceptor    // Auth interceptor chạy sau để xử lý 401 và refresh token
      ])
    )
  ]
}).catch((err) => console.error(err));
