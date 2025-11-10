import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insurance-claim-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './insurance-claim-tracking.component.html',
  styleUrls: ['./insurance-claim-tracking.component.css']
})
export class InsuranceClaimTrackingComponent implements OnInit {

  orderType = '';
  sapType = '';
  invoicenumber = '';

  showTable = false;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createForms();
  }

  createForms() {
    this.HeaderForm = this.fb.group({
      INV_NO: ['', Validators.required],
      FI: [''],
      REP_DATE: [''],
      CLAIM_REF: [''],
      INV_DATE: [''],
      INV_BV: [''],
      LOSS_DCL: [''],
      CLM_RF: [''],
      SOL_VAL: [''],
      CUSTOMER: [''],
      SO_NO: [''],
      LOCATION: [''],
      DAMAGE_RMK: [''],
      CLM_INF: [''],
      CLM_ST: [''],
      CLM_DOC_ST: [''],
      COURIER_DET: [''],
      PAY_ST: [''],
      PAY_INFO: [''],
      UTR: [''],
      CLM_SET_DT: ['']
    });

    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.ItemForm.get('ITEMS') as FormArray;
  }

  createItemRow(data?: any): FormGroup {
    return this.fb.group({
      INV_NO: [data?.INV_NO || this.invoicenumber],
      POSNR: [data?.POSNR || ''],
      VEH_LINE: [data?.VEH_LINE || ''],
      VEHICLE: [data?.VEHICLE || ''],
      TRUCK_NO: [data?.TRUCK_NO || ''],
      LR_NO: [data?.LR_NO || ''],
      AH: [data?.AH || ''],
      NO_SETS: [data?.NO_SETS || ''],
      TRANSPORTER: [data?.TRANSPORTER || '']
    });
  }

  addItemRow(data?: any) {
    this.items.push(this.createItemRow(data));
  }

  removeItemRow(i: number) {
    if (this.items.length === 1) {
      Swal.fire('Warning', 'At least one item required', 'warning');
      return;
    }
    this.items.removeAt(i);
  }

  onOrderTypeSelection() {
    this.sapType = '';
    this.invoicenumber = '';
    this.showTable = false;
    this.items.clear();
  }

  onSapTypeSelection() {
    this.showTable = false;
    this.items.clear();
  }

  fetchInvoiceDetails() {
    if (!this.invoicenumber.trim()) {
      Swal.fire('Error', 'Enter Invoice Number', 'error');
      return;
    }

    if (!this.sapType) {
      Swal.fire('Error', 'Select SAP / Non-SAP', 'error');
      return;
    }

    if (this.sapType === 'SAP') {
      this.fetchSAPInvoice();
    } else {
      this.fetchNonSAPInvoice();
    }
  }

  fetchSAPInvoice() {
    const payload = { VBELN: this.invoicenumber };
    this.service.InsuranceClaimTrackingfetch(payload).subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          Swal.fire('No Data', 'SAP Invoice not found', 'warning');
          return;
        }

        const response = res[0];

        // ✅ Patch INV_NO explicitly to avoid required error
        this.HeaderForm.patchValue({
          ...response.HEADER,
          INV_NO: this.invoicenumber
        });

        this.items.clear();
        if (response.ITEM?.length > 0) {
          response.ITEM.forEach((row: any) => this.addItemRow(row));
        }

        this.showTable = true;
        Swal.fire('Loaded', 'SAP Invoice Loaded Successfully', 'success');
      },
      error: () => {
        Swal.fire('Error', 'SAP Fetch API Failed', 'error');
      }
    });
  }

  fetchNonSAPInvoice() {
    const payload = { VBELN: this.invoicenumber };
    this.service.fetchinvoicelistnonsap(payload).subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          Swal.fire('No Data', 'Non-SAP Invoice not found', 'warning');
          return;
        }

        const response = res[0];

        this.HeaderForm.patchValue({
          ...response.HEADER,
          INV_NO: this.invoicenumber
        });

        this.items.clear();
        if (response.ITEM?.length > 0) {
          response.ITEM.forEach((row: any) => this.addItemRow(row));
        }

        this.showTable = true;
        Swal.fire('Loaded', 'Non-SAP Invoice Loaded Successfully', 'success');
      },
      error: () => {
        Swal.fire('Error', 'Non-SAP Fetch API Failed', 'error');
      }
    });
  }

  saveSAP(action: 'stay' | 'next' | 'previous' = 'stay') {
    this.HeaderForm.markAllAsTouched();
    this.ItemForm.markAllAsTouched();

    if (this.HeaderForm.invalid) {
      Swal.fire('Error', 'Header fields missing', 'error');
      return;
    }

    if (this.items.length === 0) {
      this.addItemRow();
      Swal.fire('Error', 'Add at least one row', 'error');
      // return;
    }

    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.items.value
    };

    this.service.InsuranceClaimTrackingSave(payload).subscribe({
      next: (res: any) => {
        if (res?.STATUS === "TRUE") {
          Swal.fire({
            icon: 'success',
            text: res.MESSAGE || 'SAP Data Saved Successfully',
            confirmButtonText: 'Ok'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/dashboard']);  // ✅ next screen
            } else if (action === 'previous') {
              this.router.navigate(['/transit-damage-info']); // ✅ previous screen
            } else {
              this.resetForms(); // ✅ stay on same screen
            }
          });
        } else {
          Swal.fire('Error', res?.MESSAGE || 'SAP Save Failed', 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'SAP Save API Failed', 'error');
      }
    });
  }

  saveNonSAP(action: 'stay' | 'next' | 'previous' = 'stay') {
    this.HeaderForm.markAllAsTouched();
    this.ItemForm.markAllAsTouched();

    if (this.HeaderForm.invalid) {
      Swal.fire('Error', 'Header fields missing', 'error');
      return;
    }

    if (this.items.length === 0) {
      this.addItemRow();
      Swal.fire('Error', 'Add at least one row', 'error');
      // return;
    }

    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.items.value
    };

    this.service.Nonsapsave(payload).subscribe({
      next: (res: any) => {
        if (res?.STATUS === "TRUE") {
          Swal.fire('Success', res.MESSAGE || 'Non-SAP Data Saved Successfully', 'success').then(() => {
            if (action === 'next') {
              this.router.navigate(['/dashboard']);
            } else if (action === 'previous') {
              this.router.navigate(['/transit-damage-info']);
            } else {
              this.resetForms();
            }
          });
        } else {
          Swal.fire('Error', res?.MESSAGE || 'Non-SAP Save Failed', 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'Non-SAP Save API Failed', 'error');
      }
    });
  }

  resetForms() {
    this.HeaderForm.reset();
    this.ItemForm.reset();
    this.items.clear();
    this.showTable = false;
  }
}
