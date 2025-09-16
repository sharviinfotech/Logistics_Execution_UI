/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
import { initFirebaseBackend } from './app/authUtils';
import { FakeBackendInterceptor } from './app/core/helpers/fake-backend';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { JwtInterceptor } from './app/core/helpers/jwt.interceptor';
import { ErrorInterceptor } from './app/core/helpers/error.interceptor';
import { provideRouter } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxSpinnerService } from 'ngx-spinner';
import { importProvidersFrom } from '@angular/core';
// ** Update Firebase Imports **
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Enable production mode if in production environment
if (environment.production) {
  enableProdMode();
}

// Initialize Firebase based on the configuration
if (environment.defaultauth === 'firebase') {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  FakeBackendInterceptor;
}

// ** Firebase Modular Initialization **

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);
// Initialize Firebase Authentication
const auth = getAuth(firebaseApp);

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // Required for API calls
    importProvidersFrom(NgxSpinnerModule), // Import Spinner Module Here 
    provideRouter([]),
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true },
    ...appConfig.providers,
    importProvidersFrom(NgxSpinnerModule) // Add ngx-spinner globally
    
  ],
})
  .catch((err) =>
    console.error('Error during bootstrapping the application:', err)
  );
