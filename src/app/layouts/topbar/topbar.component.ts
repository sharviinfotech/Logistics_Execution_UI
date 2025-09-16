import { Component, OnInit, Output, EventEmitter, Inject, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { AuthenticationService } from '../../core/services/auth.service';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { environment } from '../../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { changesLayout } from 'src/app/store/layouts/layout.actions';
import { getLayoutMode } from 'src/app/store/layouts/layout.selector';
import { RootReducerState } from 'src/app/store';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { SimplebarAngularModule } from 'simplebar-angular';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NotificationService } from 'src/app/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalReviewEditComponent } from '../../pages/dashboards/global-review-edit/global-review-edit.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  standalone:true,
  imports:[CommonModule,TranslateModule,BsDropdownModule,SimplebarAngularModule,ReactiveFormsModule ],
})

/**
 * Topbar component
 */

export class TopbarComponent implements OnInit {
   @ViewChild('notificationPopAdmin') notificationPopAdmin: TemplateRef<any>;
   @ViewChild('notificationPopMD') notificationPopMD: TemplateRef<any>;
   parentMessage: string = "Hello from Parent!";
   receivedMessage: string = "";
  mode: any
  element: any;
  cookieValue: any;
  flagvalue: any;
  countryName: any;
  valueset: any;
  theme: any;
  layout: string;
  dataLayout$: Observable<string>;
  loginData: any;
  isResetPasswordModalOpen = false;
  userUniqueId: any;
  submitted: boolean;
  fieldTextType: boolean = true;
newPasswordFieldTextType: boolean = true;
confirmFieldTextType: boolean = true;
currentPasswordFieldTextType: boolean = true;
data: any[] = []
notifications: any[] = []; // Stores the notifications
isNotificationDropdownOpen: boolean = false; // Tracks dropdown visibility
notificationCount: number = 0; // Tracks new notification count
  reviewedNotificationList: any;
  selectedInvoice: any = null;
  modalRef: NgbModalRef;
toggleFieldTextType() {
  this.fieldTextType = !this.fieldTextType;
}
toggleNewPasswordFieldTextType() {
  this.newPasswordFieldTextType = !this.newPasswordFieldTextType;
}
toggleConfirmFieldTextType() {
  this.confirmFieldTextType = !this.confirmFieldTextType;
}
toggleCurrentPasswordFieldTextType() {
  this.currentPasswordFieldTextType = !this.currentPasswordFieldTextType;
}
 
  resetPassword!: FormGroup;
  // Define layoutMode as a property

  constructor(@Inject(DOCUMENT) private document: any,private fb: FormBuilder, private router: Router, private authService: AuthenticationService,private modalService: NgbModal,
    private authFackservice: AuthfakeauthenticationService,
    public languageService: LanguageService,
    public translate: TranslateService,
    private toaster: ToastrService,private spinner: NgxSpinnerService,
    public _cookiesService: CookieService, public store: Store<RootReducerState>, private toastr: ToastrService,private service:GeneralserviceService,private notificationService: NotificationService ) {

  }

  listLang: any = [
    { text: 'English', flag: 'assets/images/flags/us.jpg', lang: 'en' },
    { text: 'Spanish', flag: 'assets/images/flags/spain.jpg', lang: 'es' },
    { text: 'German', flag: 'assets/images/flags/germany.jpg', lang: 'de' },
    { text: 'Italian', flag: 'assets/images/flags/italy.jpg', lang: 'it' },
    { text: 'Russian', flag: 'assets/images/flags/russia.jpg', lang: 'ru' },
  ];

  openMobileMenu: boolean;

  @Output() settingsButtonClicked = new EventEmitter();
  @Output() mobileMenuButtonClicked = new EventEmitter();

  ngOnInit() {


    // this.initialAppState = initialState;
    this.store.select('layout').subscribe((data) => {
      this.theme = data.DATA_LAYOUT;
    })
    this.openMobileMenu = false;
    this.element = document.documentElement;

    this.cookieValue = this._cookiesService.get('lang');
    const val = this.listLang.filter(x => x.lang === this.cookieValue);
    this.countryName = val.map(element => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) { this.valueset = 'assets/images/flags/us.jpg'; }
    } else {
      this.flagvalue = val.map(element => element.flag);
    }

   this.loginData= this.service.getLoginResponse()
   console.log("this.loginData",this.loginData);
   this.resetPassword = this.fb.group({
    userName: ['', Validators.required],
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.mustMatch('newPassword', 'confirmPassword') });

  if (this.loginData == undefined) {
    this.router.navigate(['/auth/login-2']);
  }
  console.log("this.loginData?.data.userActivity",this.loginData?.data.userActivity)
 if(this.loginData){
  setInterval(() => 
   
    this.fetchData(), 600000
); 
 }
  
}

get f() {
  return this.resetPassword.controls;
}

mustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  }
}


  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.cookieValue = lang;
    this.languageService.setLanguage(lang);
  }

  /**
   * Toggles the right sidebar
   */
  toggleRightSidebar() {
    this.settingsButtonClicked.emit();
  }
  isLogoutDropdownOpen = false;

  toggleLogoutDropdown() {
    this.isLogoutDropdownOpen = !this.isLogoutDropdownOpen;
  }

  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /**
   * Logout the user
   */
  logout() {
    if (environment.defaultauth === 'firebase') {
      this.authService.logout();
    } else {
      this.authFackservice.logout();
    }
    // this.router.navigate(['/auth/login']);
    this.router.navigate(['/auth/login-2'],);

  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }

  changeLayout(layoutMode: string) {
    this.theme = layoutMode;
    this.store.dispatch(changesLayout({ layoutMode }));
    this.store.select(getLayoutMode).subscribe((layout) => {
      document.documentElement.setAttribute('data-layout', layout)
    })
  }

  openResetPasswordModal() {
    console.log("this.loginData.userName",this.loginData.data.userName)
    this.isResetPasswordModalOpen = true;
    this.resetPassword.patchValue({
      "userName":this.loginData.data.userName
    })

console.log("this.resetPassword",this.resetPassword.value.userName)
}

// closeResetPasswordModal() {
//     this.isResetPasswordModalOpen = false;
   
// }
closeResetPasswordModal() {
  this.isResetPasswordModalOpen = false; // Close the modal
  this.resetPassword.reset(); // Reset the form
  this.submitted = false; // Reset the submitted flag, if used for validation
}
     resetpasswordSave() {

    console.log("this.resetPasswordData",this.resetPassword)
    // this.spinner.show();
    
  
    if (this.resetPassword.invalid == true) {
      // this.spinner.hide();
      this.submitted = true;
      return;
    }
  
    const Payload = {
      userUniqueId:this.loginData.data.userUniqueId,
      userName: this.resetPassword.value.userName,
      currentPassword:this.resetPassword.value.currentPassword,
      newPassword:this.resetPassword.value.newPassword,
      confirmPassword:this.resetPassword.value.confirmPassword
    };
  
    this.service.resetpassword(Payload).subscribe(
      (res: any) => {
        const response = res;
  
        // First, stop the spinner
        // this.spinner.hide();
  
        // Ensure UI update completes before showing Swal
       
          if (response.status === 200) {
           
            // this.service.getLoginResponse(response);
  
            // Swal.fire(response.message, `Welcome ${response.data.userFirstName} ${response.data.userLastName}`, 'success');
            Swal.fire({
              title: response.message,
             
              icon: 'success',
              timer: 5000, // 10 seconds
              timerProgressBar: true, // Shows a progress bar
            });
            this.router.navigate(['/auth/login-2'],);
            this.submitted = false;
          } 
          
          else {
            this.toaster.error(res.message)
          }
  
          
        
      },
      (error) => {
        // this.spinner.hide();
  
        setTimeout(() => {
          console.log('error', error);
          this.toaster.error(error);
        }, 0);
      }
    );
  }
  // fetchData() {
  //   console.log("fetchData topbar")
  //   this.service.getAllInvoice().subscribe(response => {
  //     if (Array.isArray(response)) { // Ensure response is an array
  //       console.log("topbar",response)
  //       if (response.length > this.data.length) { // New invoice detected
  //         this.notificationService.playNotificationSound();
  //         this.notificationCount++; // Increment notification count
  //         this.notifications.unshift({
  //           title: 'New Invoice Created',
  //           message: 'A new invoice has been added successfully.',
  //           time: new Date().toLocaleTimeString()
  //         });
  //       }
  //       this.data = response; // Update data
  //     } else {
  //       console.error('Expected an array but received:', response);
  //     }
  //   });
  // }
  private previousNotificationCount = 0; // Store previous count

  fetchData() {
    this.notificationService.getAllNotification().subscribe((response: any) => {
      console.log("topbar", response, response.data?.length, this.data?.length);
      
      if(this.loginData?.data.userActivity == 'ADMIN'){
        const newCount = response.adminNotificationCount || 0; // Ensure count is always a number
        console.log("newCount Admin",newCount,this.previousNotificationCount)
        if (newCount > this.previousNotificationCount) { // Play sound only if count increased
          this.spinner.show()
          this.reviewedNotificationList = []
          this.notificationService.playNotificationSound();
          this.notifications.unshift({
            title: 'New Invoice Reviewed',
            message: 'A new invoice has been added successfully.',
            time: new Date().toLocaleTimeString()
          });
        }
        console.log('this.notifications',this.notifications)
        this.notificationCount = newCount; // Update the displayed count
        this.previousNotificationCount = newCount; // Store new count for next comparison
        this.data = response.adminList || []; // Ensure `this.data` is always an array\
        this.reviewedNotificationList = response.adminList
        console.log("this.reviewedNotificationList",this.reviewedNotificationList)
        setTimeout(() => {
          this.spinner.hide()
        }, 500);
        
      }else{
        const newCount = response.mdNotificationCount || 0; // Ensure count is always a number
        console.log("newCount MD",newCount,this.previousNotificationCount)
      if (newCount > this.previousNotificationCount) { // Play sound only if count increased
        this.spinner.show()
        this.reviewedNotificationList = []
        this.notificationService.playNotificationSound();
        this.notifications.unshift({
          title: 'New Invoice Reviewed',
          message: 'A new invoice has been added successfully.',
          time: new Date().toLocaleTimeString()
        });
        // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        //   this.router.navigate(['InvoiceDecision']); // Replace 'parent' with your actual route
        // });
      }
      console.log('this.notifications',this.notifications)
      this.notificationCount = newCount; // Update the displayed count
      this.previousNotificationCount = newCount; // Store new count for next comparison
      this.data = response.mdList || []; // Ensure `this.data` is always an array\
      this.reviewedNotificationList = response.mdList
      console.log("this.reviewedNotificationList",this.reviewedNotificationList)
      setTimeout(() => {
        this.spinner.hide()
      }, 500);
      }
      console.log("this.notificationCount",this.notificationCount,this.reviewedNotificationList)
      
    }, error => {
      this.spinner.hide();
      console.error("Error fetching notifications:", error);
    });
  }
  
  

  
  openNotificationPop() {

    if(this.reviewedNotificationList.length>0){
      if(this.loginData?.data.userActivity == 'ADMIN'){
        // if(this.reviewedNotificationList.length>0){
        //   this.modalService.open(this.notificationPopAdmin, { 
        //     size: 'xl', 
        //     backdrop: 'static', // Prevent closing on outside click
        //     keyboard: false // (Optional) Prevent closing with Esc key
        //   });
        // }
        this.router.navigate(['/ReviewNotification'], { queryParams: { role: 'admin' } });
      }else{
        // if(this.reviewedNotificationList.length>0){
        //   this.modalService.open(this.notificationPopMD, { 
        //     size: 'lg', 
        //     backdrop: 'static', // Prevent closing on outside click
        //     keyboard: false // (Optional) Prevent closing with Esc key
        //   });
        // }
        this.router.navigate(['/ReviewNotification'], { queryParams: { role: 'MD' } });
      }
    }
  }

closeInvoice() {
  this.modalService.dismissAll(); 
}
verifyedInvoice(invoice){




  let obj={
      "originalUniqueId": invoice.originalUniqueId,
      "reviewed":false,
      "reviewedReSubmited":true
     }
   this.spinner.show()
  this.service.verifyedAndUpdated(obj).subscribe(
        (response: any) => {
          console.log('Response:', response); 
          this.spinner.hide()
          this.modalService.dismissAll(); 
        },
        (error) => {
          // Handle API errors
          Swal.fire('Error!', 'Failed to update status. Please try again.', 'error');
          console.error('Approval error:', error);
          this.spinner.hide()
        }
      );
  
  

}
// openGlobalReviewPopup(invoice: any) {
//   this.selectedInvoice = invoice;

//   // Open GlobalReviewEditComponent in a modal
//   this.modalRef = this.modalService.open(GlobalReviewEditComponent, { size: 'lg' });

//   // Pass data to the component
//   this.modalRef.componentInstance.invoiceData = this.selectedInvoice;

//   // Handle modal close
//   this.modalRef.componentInstance.closeModal.subscribe(() => {
//     this.modalRef.close();
//   });
// }
  
  
}