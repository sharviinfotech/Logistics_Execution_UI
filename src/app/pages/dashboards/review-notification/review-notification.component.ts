import { GeneralserviceService } from 'src/app/generalservice.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NotificationService } from 'src/app/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { GlobalReviewEditComponent } from '../../dashboards/global-review-edit/global-review-edit.component';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
@Component({
  selector: 'app-review-notification',
  templateUrl: './review-notification.component.html',
  styleUrl: './review-notification.component.css',
   imports: [CommonModule, ReactiveFormsModule, FormsModule],
   standalone: true
})
export class ReviewNotificationComponent {
  private notificationSubscription!: Subscription;
  private previousNotificationCount = 0; // Store previous count
  reviewedNotificationADMINList: any=[];
  reviewedNotificationMDList:any=[]
  loginData: any;
  selectedInvoice: any = null;
  modalRef: NgbModalRef;
  notificationCard:any;
  reviewedNotificationList: any[];
  data: any;
  notifications: any[] = []; // Stores the notifications
  notificationCount: number = 0; // Tracks new notification count

 constructor(private fb: FormBuilder, private router: Router, private modalService: NgbModal,
    private toaster: ToastrService,private spinner: NgxSpinnerService,
   private service:GeneralserviceService,private notificationService: NotificationService,
   private cdr: ChangeDetectorRef ) {

  }
  ngOnInit() {
    this.loginData = this.service.getLoginResponse();
    console.log('this.loginData', this.loginData);

    // Fetch data initially
    this.fetchData();

    // Poll every 10 seconds
    setInterval(() => {
      this.checkForNewNotifications();
    }, 10000);
  }
  // fetchData() {

  //   this.reviewedNotificationADMINList = []
  //   this.spinner.show();  
  //   this.service.getAllNotification().subscribe((response: any) => {
  //     console.log("topbar", response,response.adminList,response.mdList);
      
  //     if(this.loginData?.data.userActivity == 'ADMIN'){
  //       this.notificationCard = "ADMIN"
  //       this.reviewedNotificationADMINList = response.adminList
  //       console.log("adminList this.reviewedNotificationList",this.reviewedNotificationADMINList)   
  //       this.spinner.hide();     
  //     }else{
  //       this.notificationCard = "MD"
  //     this.reviewedNotificationMDList = response.mdList
  //     console.log("this.reviewedNotificationList",this.reviewedNotificationMDList)
  //     this.spinner.hide();
  //     }
  //     console.log("this.reviewedNotificationADMINList",this.reviewedNotificationADMINList)
  //     console.log("this.reviewedNotificationMDList",this.reviewedNotificationMDList)

      
  //   }, error => {
  //     this.spinner.hide();
  //     console.error("Error fetching notifications:", error);
  //   });
  // }


  // private previousNotificationCount = 0; // Store previous count

  fetchData() {
    this.notificationService.getAllNotification().subscribe(
      (response: any) => {
        console.log('topbar', response);

        if (this.loginData?.data.userActivity === 'ADMIN') {
          this.notificationCard = 'ADMIN';
          this.handleNotificationUpdate(response.adminNotificationCount, response.adminList);
        } else {
          this.notificationCard = 'MD';
          this.handleNotificationUpdate(response.mdNotificationCount, response.mdList);
        }
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );
  }

  checkForNewNotifications() {
    this.notificationService.getAllNotification().subscribe(
      (response: any) => {
        const newCount =
          this.loginData?.data.userActivity === 'ADMIN'
            ? response.adminNotificationCount || 0
            : response.mdNotificationCount || 0;

        if (newCount !== this.previousNotificationCount) {
          console.log('Notification count changed! Fetching data...');
          this.fetchData(); // Fetch updated data if count changes
        } else {
          console.log('No change in notifications.');
        }
      },
      (error) => {
        console.error('Error checking new notifications:', error);
      }
    );
  }

  handleNotificationUpdate(newCount: number, notificationList: any[]) {
    console.log('New count:', newCount, 'Previous count:', this.previousNotificationCount);

    if (newCount > this.previousNotificationCount) {
      // this.notificationService.playNotificationSound();
      this.notifications.unshift({
        title: 'New Invoice Reviewed',
        message: 'A new invoice has been added successfully.',
        time: new Date().toLocaleTimeString(),
      });
    }

    // Always update count even if it decreases
    this.notificationCount = newCount;
    this.previousNotificationCount = newCount;
    this.reviewedNotificationList = notificationList || [];

    console.log('Updated notification list:', this.reviewedNotificationList);

    // Ensure UI refresh
    this.cdr.detectChanges();
  }
  openGlobalReviewPopup(invoice: any) {
    this.selectedInvoice = invoice;
  
    // Open GlobalReviewEditComponent in a modal
    this.modalRef = this.modalService.open(GlobalReviewEditComponent, {  backdrop: 'static', 
      keyboard: false,size:'lg' });
   
  
    // Pass data to the component
    this.modalRef.componentInstance.invoiceData = this.selectedInvoice;
  
    // Handle modal close
    this.modalRef.componentInstance.closeModal.subscribe(() => {
      this.modalRef.close();
    });
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
  
}
