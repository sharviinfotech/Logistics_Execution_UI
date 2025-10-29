import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';

@Component({
  selector: 'app-insurance-claim-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './insurance-claim-tracking.component.html',
  styleUrls: ['./insurance-claim-tracking.component.css']
})
export class InsuranceClaimTrackingComponent implements OnInit {

  InsuranceClaimTracking!: FormGroup;
  showForm = false;
  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;
 

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.InsuranceClaimTracking = this.fb.group({
      FinanceYear: ['', Validators.required],
      ReportedDate: ['', Validators.required],
      ClaimRef: ['', Validators.required],
      InvoiceNumber: ['', Validators.required],
      InvoiceDate: ['', Validators.required],
      InvoiceValueBasic: ['', Validators.required],
      LossDeclaredRs: ['', Validators.required],
      ClaimReceivedFinalised: ['', Validators.required],
      SalvageValue: ['', Validators.required],
      Customer: ['', Validators.required],
      PONumber: ['', Validators.required],
      vechilenumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)]],
      AhLoadedInTruck: ['', [Validators.required]],
      NoOfSets: ['', Validators.required],
      Location: ['', Validators.required],
      Transporter: ['', Validators.required],
      TruckNumber: ['', Validators.required],
      LRNumber: ['', Validators.required],
      DamageRemarks: ['', Validators.required],
      ClaimInformationSentOn: ['', Validators.required],
      ClaimStatus: ['', Validators.required],
      ClaimDocumentsStatus: ['', Validators.required],
      CourierDetails: ['', Validators.required],
      PaymentStatus: ['', Validators.required],
      PaymentInfo: ['', Validators.required],
      UTR: ['', Validators.required],
      ClaimSettlementDate: ['', Validators.required],
      NEFT: ['', Validators.required]
    });
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.ponumber = '';
      this.invoicenumber = '';
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeChange(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
      this.ponumber = '';
      this.invoicenumber = '';
    }
    this.previousSapType = this.sapType;
    if (this.sapType === 'Non-SAP') {
      
    }
  }

  onInputChange(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.resetConditionalFields();
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
  const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
  if (!value || value.trim() === '') {
    this.showForm = false;
    return;
  }
  this.showForm = true;
  this.setValidatorsOnFormFields();
}


  savePlan() {
    this.InsuranceClaimTracking.markAllAsTouched();
    if (this.InsuranceClaimTracking.valid) {
      Swal.fire({
        title: 'Success',
        text: 'Form submitted successfully!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      this.InsuranceClaimTracking.reset();
      this.showForm = false;
      this.orderType = '';
      this.sapType = '';
      this.ponumber = '';
      this.invoicenumber = '';
    } else {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.InsuranceClaimTracking.reset();
  }

  setValidatorsOnFormFields(): void {
    Object.keys(this.InsuranceClaimTracking.controls).forEach(c => {
      this.InsuranceClaimTracking.get(c)?.setValidators(Validators.required);
      this.InsuranceClaimTracking.get(c)?.updateValueAndValidity();
    });
  }
}
