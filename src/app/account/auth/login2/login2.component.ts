import { Component, OnInit,Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../../core/services/authfake.service';
import { login } from 'src/app/store/Authentication/authentication.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup} from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
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
    'assets/images/1.png',
     'assets/images/2.jpeg',
      'assets/images/Le1 image 6.png',
    // 'assets/images/HBL_background_resized_1330x780.png',
     'assets/images/LE image (3).png',
     'assets/images/4.jpg',
     'assets/images/5.jpg',
     
    //  'assets/images/loginbgimage 2.png',
   
  ];
  currentIndex = 0;
  successMessage: string;
  errorMessage: string;
  constructor(@Inject(DOCUMENT) private document: any,private formBuilder: UntypedFormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService,
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
    element: any;
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
  onSubmit() {
 
    if(this.loginForm.invalid == true){
      this.submitted = true;
    }else{
      const userName = this.f['userName'].value; // Get the username from the form
      const password = this.f['password'].value; // Get the password from the form
 
      // Login Api
      // this.store.dispatch(login({ userName: userName, password: password }));
   
      this.login(userName, password)
    }
   
 
   
  }
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
  // onSubmit() {
 
  //   if(this.loginForm.invalid == true){
  //     this.submitted = true;
  //   }else{
  //     const userName = this.f['userName'].value; // Get the username from the form
  //     const password = this.f['password'].value; // Get the password from the form
 
  //     // Login Api
  //     // this.store.dispatch(login({ userName: userName, password: password }));
  //    this.fullscreen()
  //       const  response   ={
  //           "message": "Login Successful",
  //           "status": 200,
  //           "data": {
  //               "userName": "1919",
  //               "userEmail": "sunil@gmail.com",
  //               "userUniqueId": 50,
  //               "userStatus": true,
  //               "isValid": true,
  //               "userActivity": "admin"
  //           },
  //           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTA3NzJiMDg1ZjM5ODNkYWQ3N2Y1MyIsInVzZXJOYW1lIjoiMTkxOSIsImlhdCI6MTczODY1MzQyMiwiZXhwIjoxNzM4NjU3MDIyfQ.eljCCW-80W4gWJt0GhJPayd76Xmi7EZOFoOh3SRCP2I"
  //       }
  //         this.service.setLoginResponse(response);
  //         localStorage.setItem('currentUser', JSON.stringify(response || { token: response.token }));
  //         const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  //         this.router.navigate([returnUrl], { skipLocationChange: true });
  //      setTimeout(() => {
  //             const menuButton = document.getElementById('vertical-menu-btn');
  //             if (menuButton) {
  //               menuButton.click(); // simulate toggle
  //             }
  //           }, 500); // wait a second for layout to render
  //     // this.login(userName, password)
  //   }
   
 
   
  // }
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

  // this.fullscreen();
  
  // ✅ CORRECT payload structure
  const loginPayload = {
    LOGIN: {
      USER: userName,
      PASSWORD: password
    }
  };

  this.service.GlobalUserAuth(loginPayload).subscribe(
    (res: any) => {
      const response = res;

      // Stop the spinner
      this.spinner.hide();

      // Ensure UI update completes before showing Swal
      setTimeout(() => {
        // ✅ CORRECT: Check if USER exists and STATUS is Active
        if (response.USER && response.STATUS === 'Active') {
          
          localStorage.setItem('currentUser', JSON.stringify(response));
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl], { skipLocationChange: true });
          this.service.setLoginResponse(response);

          // ✅ CORRECT: Use WARNMSG, FIRST_NAME, LAST_NAME
          Swal.fire({
            title: response.WARNMSG || 'Login Successful',
            text: `Welcome ${response.FIRST_NAME} ${response.LAST_NAME}`,
            icon: 'success',
            timer: 5000,
            timerProgressBar: true,
          });
          
          setTimeout(() => {
            const menuButton = document.getElementById('vertical-menu-btn');
            if (menuButton) {
              menuButton.click();
            }
          }, 1000);
          
        } 
        else if (response.USER && response.STATUS === 'Inactive') {
          Swal.fire('Login Failed', 'Your account is inactive', 'error');
        } 
        else {
          Swal.fire('', 'Invalid login credentials!', 'error');
        }

        this.submitted = false;
      }, 0);
    },
    (error) => {
      this.spinner.hide();

      setTimeout(() => {
        console.log('error', error);
        Swal.fire('Error', 'Login failed. Please try again.', 'error');
        this.toaster.error('Login failed');
      }, 0);
    }
  );
}
fullscreen() {
  const elem = document.documentElement; // or document.body

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }
}

  
  

}
