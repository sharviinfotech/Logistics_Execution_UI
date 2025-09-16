import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GeneralserviceService } from './generalservice.service';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
    private audio = new Audio('assets/Sounds/notification-2-2692.mp3'); // Adjusted path
  loginData: any;

    constructor(private http: HttpClient,private service:GeneralserviceService) {
    
      this.loginData= this.service.getLoginResponse()
      console.log("this.loginData=",this.loginData)
      if(this.loginData){
        // this.audio.load(); // Preload the audio
      }
     
    }
  
    playNotificationSound() {
      console.log("playNotificationSound");
  
      // Ensure the browser allows audio playback
      this.audio.play().catch(error => {
        console.error('Audio play error:', error);
        
        // Try resuming the AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            this.audio.play();
          });
        }
      });
    }
     getAllNotification(){
        return this.http.get(environment.baseUrl+'invoice/getAllNotification/');
     
      }
}