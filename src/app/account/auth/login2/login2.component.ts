import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../../core/services/authfake.service';
import { login } from 'src/app/store/Authentication/authentication.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { GeneralserviceService } from 'src/app/generalservice.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-login2',
  templateUrl: './login2.component.html',
  styleUrls: ['./login2.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SlickCarouselModule,NgxSpinnerModule],
  providers: [NgxSpinnerService]
})
/**
 * Login-2 component
 */
export class Login2Component implements OnInit {
  // fieldTextType !: boolean;
  
  images = [
    
    // 'assets/images/AircraftFlight.png',
    'assets/images/bgrdashboard.png',
    'assets/images/HBL_background_resized_1330x780.png',
     'assets/images/HBL_lightImage.png',
   
  ];
  currentIndex = 0;
  successMessage: string;
  errorMessage: string;
  constructor(private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService,
    private authFackservice: AuthfakeauthenticationService, public store: Store, private service: GeneralserviceService, private toaster: ToastrService,private spinner: NgxSpinnerService) { }
    loginForm: FormGroup;
    forgotPasswordForm: FormGroup;
    submitted = false;
    submittedForgot = false;
    isForgotPassword = false;
    showForgotPassword = false;
    
    fieldTextType = false;
    year = new Date().getFullYear();
    interval: any;
  ngOnInit(): void {
    document.body.classList.add("auth-body-bg");
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.startSlideshow();
// Change image every 5 seconds
  }
  // showSpinner() {
  //   this.spinner.show();
  //   setTimeout(() => this.spinner.hide(), 3000); // Auto-hide after 3 sec
  // }

  // swiper config
  slideConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true
  };
  startSlideshow() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }, 3000); // Change image every 3 seconds
  }
  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }
  get gForgot() { return this.forgotPasswordForm.controls; }
  /**
   * Form submit
   */
  // dynamic login below 
  // onSubmit() {
 
  //   if(this.loginForm.invalid == true){
  //     this.submitted = true;
  //   }else{
  //     const userName = this.f['userName'].value; // Get the username from the form
  //     const password = this.f['password'].value; // Get the password from the form
 
  //     // Login Api
  //     // this.store.dispatch(login({ userName: userName, password: password }));
   
  //     this.login(userName, password)
  //   }
   
 
   
  // }
  showForgotPasswordScreen() {
    this.showForgotPassword = true; 
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Toggle forgot password form
  toggleForgotPassword() {
    this.isForgotPassword = !this.isForgotPassword;
    this.submittedForgot = false;
    this.forgotPasswordForm.reset();
  }

  // Forgot password form submission
  onForgotPasswordSubmit() {
    this.submittedForgot = true;
    if (this.forgotPasswordForm.invalid) return;

    const payload = { 
      userEmail: this.forgotPasswordForm.value.email 
    };

    this.service.forgotPassword(payload).subscribe((res: any) => {
      const response = res
      console.log("this.response", response)
      // if (this.response.MSGTXT) {
      this.isForgotPassword = false
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message,
          timer:5000
        }).then(() => {
          
        });
      }
      else{
        Swal.fire('Login Failed', `${response.message} `, 'error');
        // Swal.fire("",dummy, "success")
        this.submitted = false;
      }
      
  },error=>{
    console.log("error",error)
    this.toaster.error(error)
   
  });
  }


  // Toggle password visibility
 

  // local login without API
  onSubmit() {
 
    if(this.loginForm.invalid == true){
      this.submitted = true;
    }else{
      const userName = this.f['userName'].value; // Get the username from the form
      const password = this.f['password'].value; // Get the password from the form
 
      // Login Api
      // this.store.dispatch(login({ userName: userName, password: password }));
     
        const  response   ={
            "message": "Login Successful",
            "status": 200,
            "data": {
                "userName": "1919",
                "userEmail": "sunil@gmail.com",
                "userUniqueId": 50,
                "userStatus": true,
                "isValid": true,
                "userActivity": "admin"
            },
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTA3NzJiMDg1ZjM5ODNkYWQ3N2Y1MyIsInVzZXJOYW1lIjoiMTkxOSIsImlhdCI6MTczODY1MzQyMiwiZXhwIjoxNzM4NjU3MDIyfQ.eljCCW-80W4gWJt0GhJPayd76Xmi7EZOFoOh3SRCP2I"
        }
          this.service.setLoginResponse(response);
          localStorage.setItem('currentUser', JSON.stringify(response || { token: response.token }));
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl], { skipLocationChange: true });
 
      // this.login(userName, password)
    }
   
 
   
  }
  // goBackToLogin() {
  //   this.showForgotPassword = false;
  //   this.successMessage = '';
  //   this.errorMessage = '';
  // }
 
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  //  login(userName: string, password: string){
  //       const loginPayload = {
  //         userName: userName,
  //         userPassword: password
  //       };
  //     this.service.submitLogin(loginPayload).subscribe((response:any)=>{
  //       if (response.status === 200 && response.isValid) {
  //         localStorage.setItem('token', response.token); // Store token in localStorage
  //         // Login Api
  //         this.store.dispatch(login({ userName: userName, password: password }));
  //         Swal.fire({
  //           // title: 'question',
  //           text: response.message,
  //           icon: 'info',
  //           showCancelButton: true,
  //           showConfirmButton: true,
  //         }).then((result) => {

  //         });
  //         this.store.dispatch(login({ userName: userName, password: password }));
  //         // return response;
  //       } else {
  //         console.log("response",response)
  //          Swal.fire({
  //                   // title: 'question',
  //                   text: response.message,
  //                   icon: 'info',
  //                   showCancelButton: true,
  //                   showConfirmButton: true,
  //                 }).then((result) => {
  //                   if (result.isConfirmed) {

  //                   } else {

  //                   }
  //                 });
  //       }
  //     })
  //       // return this.http.post<any>(this.apiUrl, loginPayload).pipe(
  //       //   map((response) => {
  //       //     console.log("response",response)
  //       //     if (response.status === 200 && response.isValid) {
  //       //       localStorage.setItem('token', response.token); // Store token in localStorage
  //       //       // Login Api
  //       //       this.store.dispatch(login({ userName: userName, password: password }));
  //       //       // return response;
  //       //     } else {
  //       //       console.log("response",response)
  //       //       throw new Error('Invalid credentials');
  //       //     }
  //       //   }),
  //       //   // catchError((error) => throwError(() => new Error(error.error?.message || 'Login failed')))
  //       // );
  //     }


  login(userName, password) {
    this.spinner.show();
    this.submitted = true;
  
    if (this.loginForm.invalid) {
      this.spinner.hide();
      return;
    }
  
    const loginPayload = {
      userName: userName,
      userPassword: password
    };
  
    this.service.submitLogin(loginPayload).subscribe(
      (res: any) => {
        const response = res;
  
        // First, stop the spinner
        this.spinner.hide();
  
        // Ensure UI update completes before showing Swal
        setTimeout(() => {
          if (response.status === 200 && response.data.isValid) {
            localStorage.setItem('currentUser', JSON.stringify(response || { token: response.token }));
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigate([returnUrl], { skipLocationChange: true });
            this.service.setLoginResponse(response);
  
            // Swal.fire(response.message, `Welcome ${response.data.userFirstName} ${response.data.userLastName}`, 'success');
            Swal.fire({
              title: response.message,
              text: `Welcome ${response.data.userFirstName} ${response.data.userLastName}`,
              icon: 'success',
              timer: 5000, // 10 seconds
              timerProgressBar: true, // Shows a progress bar
            });
          } 
          else if (response.status === 200 && response.data.isValid === false) {
            Swal.fire('Login Failed', `${response.message}`, 'error');
          } 
          else {
            Swal.fire('', 'Invalid login credentials!', 'error');
          }
  
          this.submitted = false;
        }, 0); // Delay ensures UI updates before modal appears
      },
      (error) => {
        this.spinner.hide();
  
        setTimeout(() => {
          console.log('error', error);
          this.toaster.error(error);
        }, 0);
      }
    );
  }
  
  
  

}
