import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-insurance-claim-tracking',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insurance-claim-tracking.component.html',
  styleUrl: './insurance-claim-tracking.component.css'
})
export class InsuranceClaimTrackingComponent {
InsuranceClaimTracking!: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    const today = new Date().toISOString().substring(0, 10);
    this.InsuranceClaimTracking = this.fb.group({
      FinanceYear: ['', Validators.required],
      ReportedDate: ['', Validators.required],
      ClaimRef: ['', Validators.required],
      InvoiceValueBasic : ['', Validators.required],
      LossDeclaredRs: ['', Validators.required],
      ClaimReceivedFinalised: ['', Validators.required],
      SalvageValue: ['', Validators.required],
      Customer: ['', Validators.required],
      PONumber: ['', Validators.required],
     NoOfSets: ['', Validators.required],
      Location: ['', Validators.required],
      InvoiceNumber:['',Validators.required],
      InvoiceDate:['',Validators.required],
      Transporter:['',Validators.required],
      TruckNumber:['',Validators.required],
      LRNumber:['',Validators.required],
      DamageRemarks:['',Validators.required],
      ClaimInformationSentOn:['',Validators.required],
      ClaimStatus:['',Validators.required],
      ClaimDocumentsStatus:['',Validators.required],
      CourierDetails:['',Validators.required],
      PaymentStatus:['',Validators.required],
      PaymentInfo:['',Validators.required],
      NEFT:['',Validators.required]
    });
  }

  savePlan() {
  if (this.InsuranceClaimTracking.valid) {
    console.log('Plan submitted:', this.InsuranceClaimTracking.value);
    // Add your API call or logic here
  } else {
    // Show validation errors
    Object.keys(this.InsuranceClaimTracking.controls).forEach(key => {
      this.InsuranceClaimTracking.get(key)?.markAsTouched();
    });
  }
}
}

