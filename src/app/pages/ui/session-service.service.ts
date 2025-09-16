import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment'
 
@Injectable({
  providedIn: 'root',
})
export class SessionServiceService implements OnDestroy {
  private sessionTimeout: any;
  private readonly timeoutDuration = 10 * 60 * 1000; // 10 minutes
  // private readonly timeoutDuration = 10 * 60 * 500; // 5 minute
 
  private activitySubject = new Subject<void>();
 
  constructor(private router: Router) {
    this.initializeActivityListener();
    this.resetSessionTimeout();
  }
 
  private initializeActivityListener() {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((event) =>
      window.addEventListener(event, () => this.activitySubject.next())
    );
 
    this.activitySubject.pipe(debounceTime(500)).subscribe(() => {
      this.resetSessionTimeout();
    });
  }
 
  private resetSessionTimeout() {
    console.log("session resetted")  ;
      clearTimeout(this.sessionTimeout);
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionExpiry();
    }, this.timeoutDuration);
  }
 
  private handleSessionExpiry() {
    // alert('Session expired due to inactivity. Redirecting to login.');
    // this.router.navigate(['/login']); // Redirect to login page
     localStorage.clear();
   
        Swal.fire({
          title: 'Session Expired',
          text: 'Redirecting to login Page.',
          icon: 'warning',
          confirmButtonText: 'OK'
        }).then(() => {
          //development HBL
        //   window.location.href = environment.URL;
          //Production
          // window.location.href = 'https://ims.hbl.in/';
          this.router.navigate(['/auth/login-2'],);
        });
  }
 
  ngOnDestroy(): void {
    clearTimeout(this.sessionTimeout);
    this.activitySubject.complete();
  }
}
 