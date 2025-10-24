export interface Environment {
  production: boolean;
  defaultauth: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  baseUrl: string;
  leApiUrl: string;
}

declare global {
  interface Window {
    env: Environment;
  }
}