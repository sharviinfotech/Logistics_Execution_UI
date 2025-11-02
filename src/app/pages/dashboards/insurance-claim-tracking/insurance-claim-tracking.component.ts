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
    private service: GeneralserviceService
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
  onSave() {
    if (this.sapType === 'SAP') {
      this.saveSAP();
    } else {
      this.saveNonSAP();
    }
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

  // ✅ ✅ FINAL: AUTO SELECT API BASED ON SAP TYPE
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

  // ✅ ✅ SAP FETCH
  fetchSAPInvoice() {

    const payload = { VBELN: this.invoicenumber };

    this.service.InsuranceClaimTrackingfetch(payload).subscribe({
      next: (res: any) => {

        if (!res || res.length === 0) {
          Swal.fire('No Data', 'SAP Invoice not found', 'warning');
          return;
        }

        const response = res[0];

        this.HeaderForm.patchValue(response.HEADER);

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

  saveSAP() {

    this.HeaderForm.markAllAsTouched();
    this.ItemForm.markAllAsTouched();

    if (this.HeaderForm.invalid) {
      Swal.fire('Error', 'Header fields missing', 'error');
      return;
    }

    if (this.items.length === 0) {
      Swal.fire('Error', 'Add at least one row', 'error');
      return;
    }

    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.items.value
    };

    this.service.InsuranceClaimTrackingSave(payload).subscribe({
      next: (res: any) => {

        if (res?.STATUS === "TRUE") {
          Swal.fire('Success', res.MESSAGE || 'SAP Data Saved Successfully', 'success');
        } else {
          Swal.fire('Error', res?.MESSAGE || 'SAP Save Failed', 'error');
        }
      },

      error: () => {
        Swal.fire('Error', 'SAP Save API Failed', 'error');
      }
    });
  }


  // ✅ ✅ NON-SAP FETCH
  fetchNonSAPInvoice() {

    const payload = { VBELN: this.invoicenumber };

    this.service.fetchinvoicelistnonsap(payload).subscribe({
      next: (res: any) => {

        if (!res || res.length === 0) {
          Swal.fire('No Data', 'Non-SAP Invoice not found', 'warning');
          return;
        }

        const response = res[0];

        this.HeaderForm.patchValue(response.HEADER);

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

  saveNonSAP() {

    this.HeaderForm.markAllAsTouched();
    this.ItemForm.markAllAsTouched();

    if (this.HeaderForm.invalid) {
      Swal.fire('Error', 'Header fields missing', 'error');
      return;
    }

    if (this.items.length === 0) {
      Swal.fire('Error', 'Add at least one row', 'error');
      return;
    }

    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.items.value
    };

    this.service.Nonsapsave(payload).subscribe({
      next: (res: any) => {

        if (res?.STATUS === "TRUE") {
          Swal.fire('Success', res.MESSAGE || 'Non-SAP Data Saved Successfully', 'success');
        } else {
          Swal.fire('Error', res?.MESSAGE || 'Non-SAP Save Failed', 'error');
        }
      },

      error: () => {
        Swal.fire('Error', 'Non-SAP Save API Failed', 'error');
      }
    });
  }


}
