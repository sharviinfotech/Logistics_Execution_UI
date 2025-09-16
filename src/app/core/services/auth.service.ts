import { Injectable } from '@angular/core';

import { getFirebaseBackend } from '../../authUtils';
import { User } from 'src/app/store/Authentication/auth.models';
import { from, map } from 'rxjs';


@Injectable({ providedIn: 'root' })

export class AuthenticationService {

    user: User;

    constructor() {
    }

    /**
     * Returns the current user
     */
    public currentUser(): User {
        return getFirebaseBackend().getAuthenticatedUser();
    }


    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(email: string, password: string) {
        return from(getFirebaseBackend().loginUser(email, password).pipe(map(user => {
            return user;
        }
        )));
    }

    // login(obj){
    //     return this.http.post('http://localhost:3000/api/invoice/authenticationLogin',obj);
    //   }

    /**
     * Performs the register
     * @param email email
     * @param password password
     */
    register(user: User) {
        // return from(getFirebaseBackend().registerUser(user));

        return from(getFirebaseBackend().registerUser(user).then((response: any) => {
            const user = response;
            return user;
        }));
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend().forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

    /**
     * Logout the user
     */
    logout() {
        // logout the user
        getFirebaseBackend().logout();
    }
}

// private apiUrl = 'http://localhost:3000/api/invoice/authenticationLogin'; // Your API URL

// constructor(private http: HttpClient) {}

// login(email: string, password: string): Observable<any> {
//   const loginPayload = {
//     userName: email,
//     userPassword: password
//   };

//   return this.http.post<any>(this.apiUrl, loginPayload).pipe(
//     map((response) => {
//       if (response.status === 200 && response.isValid) {
//         localStorage.setItem('token', response.token); // Store token in localStorage
//         return response;
//       } else {
//         throw new Error('Invalid credentials');
//       }
//     }),
//     catchError((error) => throwError(() => new Error(error.error?.message || 'Login failed')))
//   );
// }