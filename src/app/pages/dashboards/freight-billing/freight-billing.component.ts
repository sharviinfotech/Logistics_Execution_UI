import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-freight-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './freight-billing.component.html',
  styleUrls: ['./freight-billing.component.css']
})
export class FreightBillingComponent implements OnInit {

  FreightBilling!: FormGroup;
  isEditMode = false;
  orderType: string = '';
  sapType: string = '';
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.FreightBilling = this.fb.group({
      ponumber: [''],
      invoicenumber: [''],
      FreightBillNumber: ['', Validators.required],
      FreightBillDate: ['', Validators.required],
      FreightBillPhysicalSubmissionDate: ['', Validators.required],
      FreightCharges: ['', [Validators.required, Validators.min(0)]],
      WorkOrderNumber: ['', Validators.required],
      BillSubmission: ['', Validators.required],
    });
  }

  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.FreightBilling.reset();
  }

  onSapTypeChange(): void {
    this.showForm = !!(this.orderType && this.sapType);

    // reset values
    this.FreightBilling.patchValue({
      ponumber: '',
      invoicenumber: ''
    });

    // set required fields dynamically
    if (this.orderType === 'Inward') {
      this.FreightBilling.get('ponumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.FreightBilling.get('invoicenumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('ponumber')?.clearValidators();
    }

    this.FreightBilling.get('ponumber')?.updateValueAndValidity();
    this.FreightBilling.get('invoicenumber')?.updateValueAndValidity();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.FreightBilling.reset();
    this.isEditMode = false;
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
  }
  
  saveFreightBilling(): void {
  // Touch all form controls to trigger validation messages
  this.FreightBilling.markAllAsTouched();

  // Stop if form is invalid
  if (this.FreightBilling.invalid) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill all required fields before saving.',
      icon: 'warning',
      confirmButtonText: 'Ok',
      timer: 4000
    });
    return;
  }

  const formValue = this.FreightBilling.value;

  // Prepare payload structure
  const record = {
    INV_NO: formValue.invoicenumber || '',  // Invoice number
    BILLNO: formValue.FreightBillNumber,    // Freight Bill Number
    BILLDATE: formValue.FreightBillDate,    // Freight Bill Date
    PHY_DATE: formValue.FreightBillPhysicalSubmissionDate, // Physical Submission Date
    FRT_CHARGES: formValue.FreightCharges,  // Freight Charges
    ORDER_NO: formValue.WorkOrderNumber,    // Work Order Number
    BILL_SUBMISSION: formValue.BillSubmission // Bill Submission to F&A
  };

  // With SAP or Without SAP save logic
  if (this.sapType === 'SAP') {
    this.spinner.show();

    this.service.FreightBillingSave({ SAVE: [record] }).subscribe({
      next: (res: any) => {
        console.log('Response SAP:', res);

        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            title: '',
            text: res.MESSAGE || 'Freight Billing saved successfully!',
            icon: 'success',
            confirmButtonText: 'Ok',
            timer: 4000
          }).then(() => {
            this.FreightBilling.reset();
            this.showForm = false;
          });
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE || 'Failed to save Freight Billing!',
            icon: 'error',
            confirmButtonText: 'Ok',
            timer: 4000
          });
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error SAP:', err);
        this.spinner.hide();
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong while saving!',
          icon: 'error',
          confirmButtonText: 'Ok',
          timer: 4000
        });
      }
    });
  } else {
    // Non-SAP Save API
    this.spinner.show();

    this.service.FreightBillingNonSap({ CREATE: [record] }).subscribe({
      next: (res: any) => {
        console.log('Response Non-SAP:', res);

        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            title: '',
            text: res.MESSAGE || 'Freight Billing (Non-SAP) saved successfully!',
            icon: 'success',
            confirmButtonText: 'Ok',
            timer: 4000
          }).then(() => {
            this.FreightBilling.reset();
            this.showForm = false;
          });
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE || 'Failed to save Freight Billing!',
            icon: 'error',
            confirmButtonText: 'Ok',
            timer: 4000
          });
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error Non-SAP:', err);
        this.spinner.hide();
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong while saving!',
          icon: 'error',
          confirmButtonText: 'Ok',
          timer: 4000
        });
      }
    });
  }
}
}
