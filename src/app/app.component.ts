import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SessionServiceService } from './pages/ui/session-service.service';
import { NotificationService } from './notification.service';
import { GeneralserviceService } from './generalservice.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet,CommonModule,NgxSpinnerModule],
})
export class AppComponent implements OnInit {
  data: any[] = []
  constructor(private spinner: NgxSpinnerService,private sessionService:SessionServiceService,private notificationService: NotificationService,private service:GeneralserviceService) {}
  ngOnInit() {
    // this.spinner.show(undefined, {
    //   type: 'square-jelly-box',
    //   size: 'medium',
    //   bdColor: 'rgba(0, 0, 0, 0.8)',
    //   color: '#fff',
    //   fullScreen: true
    // });

    // setTimeout(() => {
    //   this.spinner.hide();
    // },5000);
  //   setInterval(() => 
  //     this.fetchData(), 5000
  // ); // Check API every 5 seconds
  }
  // fetchData() {
  //   this.service.getAllInvoice().subscribe(response => {
  //     if (Array.isArray(response)) { // Ensure response is an array
  //       if (response.length !== this.data.length) { // Detect new data
  //         this.notificationService.playNotificationSound();
  //       }
  //       this.data = response;
  //     } else {
  //       console.error('Expected an array but received:', response);
  //     }
  //   });
  // }
  
}
