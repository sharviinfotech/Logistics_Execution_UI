import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';

import { DashboardsRoutingModule } from './dashboards-routing.module';
import { OrderInfoComponent } from './order-info/order-info.component';
import { ShipmentDetailsComponent } from './shipment-details/shipment-details.component';
import { VechileInfoComponent } from './vechile-info/vechile-info.component';
import { InvoiceLoadDetailsComponent } from './invoice-load-details/invoice-load-details.component';
import { SegmentInfoComponent } from './segment-info/segment-info.component';
import { TransitInfoComponent } from './transit-info/transit-info.component';
import { FreightBillingComponent } from './freight-billing/freight-billing.component';
import { TransitDamageInfoComponent } from './transit-damage-info/transit-damage-info.component';
import { InsuranceClaimTrackingComponent } from './insurance-claim-tracking/insurance-claim-tracking.component';
import { DispatchComponent } from './dispatch/dispatch.component';
import { UserCreationComponent } from './user-creation/user-creation.component';
// import { CooisComponent } from './coois/coois.component';
// import { Co11Component } from './co11/co11.component';


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

    // OrderInfoComponent

    // ShipmentDetailsComponent

    // VechileInfoComponent

    // InvoiceLoadDetailsComponent

    // SegmentInfoComponent

    // TransitInfoComponent

    // FreightBillingComponent

    // TransitDamageInfoComponent

    // InsuranceClaimTrackingComponent



    UserCreationComponent
  ]
})
export class DashboardsModule { }
