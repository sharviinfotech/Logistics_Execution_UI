import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../../core/services/authfake.service';

import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { login } from 'src/app/store/Authentication/authentication.actions';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable ,throwError } from 'rxjs';
import { GeneralserviceService } from 'src/app/generalservice.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule]
})

/**
 * Login component
 */
export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup;
  submitted: any = false;
  error: any = '';
  returnUrl: string;
  fieldTextType!: boolean;

  // set the currenr year
  year: number = new Date().getFullYear();
  // private apiUrl = 'http://localhost:3000/api/invoice/authenticationLogin';
  // tslint:disable-next-line: max-line-length
  constructor(private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService, private store: Store,
    private authFackservice: AuthfakeauthenticationService,private http:HttpClient,private service:GeneralserviceService) { }

  ngOnInit() {
    if (localStorage.getItem('currentUser')) {
      this.router.navigate(['/']);
    }
    // form validation
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    const email = this.f['email'].value; // Get the username from the form
    const password = this.f['password'].value; // Get the password from the form

this.login(email,password)

    
  }

  
  // onSubmit() {
  //   this.submitted = true;
  
  //   if (this.loginForm.invalid) return; // Don't submit if form is invalid
  
  //   const email = this.f['email'].value;
  //   const password = this.f['password'].value;
  
  //   // Use the authentication service to log the user in
  //   this.authenticationService.login(email, password).subscribe(
  //     (response) => {
  //       if (response.status === 200 && response.isValid) {
  //         localStorage.setItem('token', response.token); // Store token
  //         this.router.navigate(['/dashboard/']); // Navigate to dashboard
  //       }
  //     },
  //     (error) => {
  //       this.error = 'Invalid credentials';
  //     }
  //   );
  // }

  // onSubmit() {
  //   this.submitted = true;

  //   const email = this.f['email'].value; 
  //   const password = this.f['password'].value; 
  //   if (email && password) {
  //     let obj ={
  //       userName:email,
  //       userPassword:password
  //     }
  //     this.authenticationService.login(obj).subscribe(
  //       (response:any) => {
  //         // handle successful login (e.g., store token, redirect)
  //         console.log('Login successful', response);
  //         if(response.status == 200 && response.isValid == true){
  //           this.router.navigate(['default']);
  //           this.store.dispatch(login({ email: email, password: password }));
  //         }else{
  //          console.log("response else",response)
  //         }

         
  //       },
  //       (error) => {
  //         // handle login failure (e.g., show error message)
  //         console.error('Login failed', error);
  //       }
  //     );
  //   }

  //   // Login Api
  //   // this.store.dispatch(login({ email: email, password: password }));
  // }

  /**
 * Password Hide/Show
 */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }




  login(email: string, password: string){
      const loginPayload = {
        userName: email,
        userPassword: password
      };
    this.service.submitLogin(loginPayload).subscribe((response:any)=>{
      if (response.status === 200 && response.isValid) {
        localStorage.setItem('token', response.token); // Store token in localStorage
        // Login Api
        this.store.dispatch(login({ email: email, password: password }));
        Swal.fire({
          // title: 'question',
          text: response.message,
          icon: 'info',
          showCancelButton: true,
          showConfirmButton: true,
        }).then((result) => {
         
        });
        this.store.dispatch(login({ email: email, password: password }));
        // return response;
      } else {
        console.log("response",response)
         Swal.fire({
                  // title: 'question',
                  text: response.message,
                  icon: 'info',
                  showCancelButton: true,
                  showConfirmButton: true,
                }).then((result) => {
                  if (result.isConfirmed) {
                    
                  } else {
                    
                  }
                });
      }
    })
      // return this.http.post<any>(this.apiUrl, loginPayload).pipe(
      //   map((response) => {
      //     console.log("response",response)
      //     if (response.status === 200 && response.isValid) {
      //       localStorage.setItem('token', response.token); // Store token in localStorage
      //       // Login Api
      //       this.store.dispatch(login({ email: email, password: password }));
      //       // return response;
      //     } else {
      //       console.log("response",response)
      //       throw new Error('Invalid credentials');
      //     }
      //   }),
      //   // catchError((error) => throwError(() => new Error(error.error?.message || 'Login failed')))
      // );
    }
}
