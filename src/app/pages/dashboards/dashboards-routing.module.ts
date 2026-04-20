import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultComponent } from './default/default.component';
import { SaasComponent } from './saas/saas.component';
import { CryptoComponent } from './crypto/crypto.component';
import { BlogComponent } from './blog/blog.component';
import { JobsComponent } from "./jobs/jobs.component";
import { SampleComponentComponent } from './default/sample-component/sample-component.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { InvoiceLayoutComponent } from './invoice-layout/invoice-layout.component';
import { InvoiceReportsComponent } from './invoice-reports/invoice-reports.component';
import { InvoiceUserCreationComponent } from './invoice-user-creation/invoice-user-creation.component';
import { InvoiceDecisionComponent } from './invoice-decision/invoice-decision.component';
import { CustomerCreationComponent } from './customer-creation/customer-creation.component';
import { ServiceChargesComponent } from './service-charges/service-charges.component';
import { GlobalReviewEditComponent } from './global-review-edit/global-review-edit.component';
import { ReviewNotificationComponent } from './review-notification/review-notification.component';
import { SectorWiseComponent } from './sector-wise/sector-wise.component';
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
import { TransitReportsComponent } from '../reports/transit-reports/transit-reports.component';
import { ServiceLevelComponent } from './service-level/service-level.component';
import { PendingPodComponent } from '../reports/pending-pod/pending-pod.component';
import { FreightbillsComponent } from '../reports/freightbills/freightbills.component';
import { LoadingFactorCostComponent } from '../reports/loading-factor-cost/loading-factor-cost.component';
import { BusinessShareMatrixComponent } from '../reports/business-share-matrix/business-share-matrix.component';
import { DispatchOrdersComponent } from './dispatch-orders/dispatch-orders.component';
import { DamageListComponent } from '../reports/damage-list/damage-list.component';


// import { CooisComponent } from './coois/coois.component';
// import { Co11Component } from './co11/co11.component';

// In all files that import this component














const routes: Routes = [
    {
        path: 'default',
        component: DefaultComponent
    },
    {
        path: 'sampleComponent',
        component: SampleComponentComponent
    },
    {
        path: 'Invoice',
        component: InvoiceComponent
    },
    {
        path: 'InvoiceLayout',
        component: InvoiceLayoutComponent
    },
    {
        path: 'InvoiceReports',
        component: InvoiceReportsComponent
    },
    {
        path: 'InvoiceUserCreation',
        component: InvoiceUserCreationComponent
    },
    {
        path: 'InvoiceDecision',
        component: InvoiceDecisionComponent
    },
    {
        path: 'CustomerCreation',
        component: CustomerCreationComponent
    },
    {
        path: 'ServiceCharges',
        component: ServiceChargesComponent
    },
    {
        path: 'globalReviewEdit',
        component: GlobalReviewEditComponent
    },
    {
        path: 'ReviewNotification',
        component: ReviewNotificationComponent
    },
    {
        path: 'sectorwise',
        component: SectorWiseComponent
    },
    {
        path: 'Dispatchorders',
        component:DispatchOrdersComponent
    },
    {
        path: 'dispatch',
        component: DispatchComponent
    },
    {
        path: 'order-info',
        component: OrderInfoComponent
    },
    {
        path: 'shipment-details',
        component: ShipmentDetailsComponent
    },
    {
        path: 'vechile-info',
        component: VechileInfoComponent
    },
    {
        path: 'invoice-load-details',
        component: InvoiceLoadDetailsComponent
    },
    {
        path: 'segment-info',
        component: SegmentInfoComponent
    },
    {
        path: 'transit-info',
        component: TransitInfoComponent
    },
    {
        path: 'freight-billing',
        component: FreightBillingComponent
    },
    {
        path: 'service-level',
        component: ServiceLevelComponent
    },
    {
        path: 'transit-damage-info',
        component: TransitDamageInfoComponent
    },
    {
        path: 'insurance-claim-tracking',
        component: InsuranceClaimTrackingComponent
    },
    {
        path: 'user-creation',
        component: UserCreationComponent
    },

    {
        path: "transit-report",
        component: TransitReportsComponent,
    },
    {
        path: "pending-pod",
        component: PendingPodComponent,
    },
    {
        path: "Freight-Bills",
        component: FreightbillsComponent,
    },
    {
        path: "Loading-Factor-Cost",
        component: LoadingFactorCostComponent,
    },
        {
            path: "businessshare-matrix",
            component: BusinessShareMatrixComponent,
        },
        {
            path: "damage-list",
            component: DamageListComponent,
        }



    // {
    //     path: 'co11',
    //     component: Co11Component
    // },

    //     {
    //     path: 'coois',
    //     component: CooisComponent
    // },



















    // {
    //     path: 'saas',
    //     component: SaasComponent
    // },
    // {
    //     path: 'crypto',
    //     component: CryptoComponent
    // },
    // {
    //     path: 'blog',
    //     component: BlogComponent
    // },
    // {
    //     path:"jobs",
    //     component:JobsComponent
    // }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardsRoutingModule { }
