import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

interface FreightDetails {
  basicFreight: number;
  detentionLoading: number;
  detentionUnloading: number;
  loadingCharges: number;
  unloadingCharges: number;
  routeChangeCharges: number;
  transhipmentCharges: number;
  otherCharges: number;
  deduction: number;
}

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
  freightDetails: FreightDetails;
  totalFreight: number = 0;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.freightDetails = this.resetDetails();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupWorkOrderListener();

  }

  initializeForm(): void {
    this.FreightBilling = this.fb.group({
      ponumber: [''],
      invoicenumber: [''],
      FreightBillNumber: ['', Validators.required],
      FreightBillDate: ['', Validators.required],
      FreightBillPhysicalSubmissionDate: ['', Validators.required],
      FreightCharges: ['', [Validators.required, Validators.min(0)]],
      WorkOrderNumber: [''],
      BillSubmission: ['', Validators.required],
    });
    this.loadInitialData();
  }

  // Setup listener for Work Order Number changes
  setupWorkOrderListener(): void {
    this.FreightBilling.get('WorkOrderNumber')?.valueChanges.subscribe((value) => {
      if (value && value !== '') {
        // If Work Order Number is selected, disable and clear validation for these fields
        this.FreightBilling.get('FreightBillNumber')?.clearValidators();
        this.FreightBilling.get('FreightBillNumber')?.disable();
        this.FreightBilling.get('FreightBillNumber')?.setValue('');

        this.FreightBilling.get('FreightBillDate')?.clearValidators();
        this.FreightBilling.get('FreightBillDate')?.disable();
        this.FreightBilling.get('FreightBillDate')?.setValue('');

        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.clearValidators();
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.disable();
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValue('');

        this.FreightBilling.get('FreightCharges')?.clearValidators();
        this.FreightBilling.get('FreightCharges')?.disable();
        this.FreightBilling.get('FreightCharges')?.setValue('');
      } else {
        // If Work Order Number is not selected, enable and restore validation
        this.FreightBilling.get('FreightBillNumber')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillNumber')?.enable();

        this.FreightBilling.get('FreightBillDate')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillDate')?.enable();

        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.enable();

        this.FreightBilling.get('FreightCharges')?.setValidators([Validators.required, Validators.min(0)]);
        this.FreightBilling.get('FreightCharges')?.enable();
      }

      // Update validity for all affected fields
      this.FreightBilling.get('FreightBillNumber')?.updateValueAndValidity();
      this.FreightBilling.get('FreightBillDate')?.updateValueAndValidity();
      this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.updateValueAndValidity();
      this.FreightBilling.get('FreightCharges')?.updateValueAndValidity();
    });
  }

  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.FreightBilling.reset();
  }

  onSapTypeChange(): void {
    this.FreightBilling.reset();
    this.showForm = !!(this.orderType && this.sapType);

    if (this.orderType === 'Inward') {
      this.FreightBilling.get('ponumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.FreightBilling.get('invoicenumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('ponumber')?.clearValidators();
    } else {
      this.FreightBilling.get('ponumber')?.clearValidators();
      this.FreightBilling.get('invoicenumber')?.clearValidators();
    }

    this.FreightBilling.get('ponumber')?.updateValueAndValidity();
    this.FreightBilling.get('invoicenumber')?.updateValueAndValidity();
    console.log('SAP Type changed to:', this.sapType, '| Form reset done.');
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

  saveFreightBilling(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    const formValue = this.FreightBilling.getRawValue();

    // Mark all enabled controls as touched
    Object.keys(this.FreightBilling.controls).forEach(key => {
      const control = this.FreightBilling.get(key);
      if (control?.enabled) {
        control.markAsTouched();
      }
    });

    if (this.FreightBilling.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        timer: 4000
      });
      return;
    }

    const record = {
      INV_NO: formValue.invoicenumber || '',
      BILLNO: formValue.FreightBillNumber || '',
      BILLDATE: formValue.FreightBillDate || '',
      PHY_DATE: formValue.FreightBillPhysicalSubmissionDate || '',
      FRT_CHARGES: formValue.FreightCharges || 0,
      ORDER_NO: formValue.WorkOrderNumber || '',
      BILL_SUBMISSION: formValue.BillSubmission
    };

    this.spinner.show();

    let request$ =
      this.sapType === 'SAP'
        ? this.service.FreightBillingSave({ SAVE: [record] })
        : this.service.FreightBillingNonSap({ CREATE: [record] });

    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            text: res.MESSAGE || 'Freight Billing saved successfully!',
            icon: 'success',
            timer: 3000
          }).then(() => {
            // ✅ Navigation controls
            if (action === 'next') {
              this.router.navigate(['/transit-damage-info']);  // ✅ Next Screen
            }
            else if (action === 'previous') {
              this.router.navigate(['/transit-info']);         // ✅ Previous Screen
            }
            else {
              this.resetForm();   // ✅ Stay on same screen
            }
          });
        } else {
          Swal.fire({
            text: res.MESSAGE || 'Failed to save!',
            icon: 'error',
            timer: 3000
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong while saving!',
          icon: 'error',
          timer: 3000
        });
      }
    });
  }


  resetDetails(): FreightDetails {
    return {
      basicFreight: 0,
      detentionLoading: 0,
      detentionUnloading: 0,
      loadingCharges: 0,
      unloadingCharges: 0,
      routeChangeCharges: 0,
      transhipmentCharges: 0,
      otherCharges: 0,
      deduction: 0,
    };
  }

  // Mock function to load existing data (e.g., from a service)
  loadInitialData() {
    // In a real app, you'd fetch this from the server
    const initialSavedData = { /* ... potentially saved data ... */ };
    Object.assign(this.freightDetails, initialSavedData);
    this.calculateTotal(); // Calculate the total to update the main field
  }

  // Calculation logic - must be called every time a field in the modal changes
  calculateTotal(): number {
    const d = this.freightDetails;

    // Convert all fields to numbers safely
    const toNum = (val: any) => Number(val) || 0;

    const sumCharges =
      toNum(d.basicFreight) +
      toNum(d.detentionLoading) +
      toNum(d.detentionUnloading) +
      toNum(d.loadingCharges) +
      toNum(d.unloadingCharges) +
      toNum(d.routeChangeCharges) +
      toNum(d.transhipmentCharges) +
      toNum(d.otherCharges);

    this.totalFreight = sumCharges - toNum(d.deduction);

    return this.totalFreight;
  }

  // 1. Function to open the modal
  openModal(calculateTotalpopup: any) {
    // Check if Freight Charges field is disabled
    if (this.FreightBilling.get('FreightCharges')?.disabled) {
      Swal.fire({
        title: 'Field Disabled',
        text: 'Freight Charges cannot be edited when Work Order Number is selected.',
        icon: 'info',
        confirmButtonText: 'Ok',
        timer: 3000
      });
      return;
    }

    // Ensure the internal total is calculated based on the current saved/loaded details
    this.calculateTotal();
    this.modalService.open(calculateTotalpopup, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

  // 2. Function to save and close the modal
  saveAndCloseModal() {
    // Final calculation before saving
    const finalTotal = this.calculateTotal();
    console.log("finalTotal", finalTotal);

    // Set the value of the main form control
    this.FreightBilling.get('FreightCharges')?.setValue(finalTotal);
    this.modalService.dismissAll();
    console.log("FreightCharges", this.FreightBilling.get('FreightCharges')?.value);

    // NOTE: At this point, you would typically save 'this.freightDetails' 
    // to your backend/database along with the main form data.
  }

  cancelModal() {
    this.modalService.dismissAll();
  }
}