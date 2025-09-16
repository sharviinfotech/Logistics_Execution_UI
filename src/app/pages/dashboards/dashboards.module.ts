import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';

import { DashboardsRoutingModule } from './dashboards-routing.module';
import { CooisComponent } from './coois/coois.component';
import { Co11Component } from './co11/co11.component';


// Standalone components (import them directly)











@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardsRoutingModule,
    BsDatepickerModule.forRoot(),
    NgxSpinnerModule,

    // Standalone components go here
    
    
 
   
    
  ],
  providers: [BsDropdownConfig],
  declarations: [
    // CooisComponent
  
    
  
    // Co11Component
  ]
})
export class DashboardsModule {}
