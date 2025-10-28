import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-invoice-load-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './invoice-load-details.component.html',
  styleUrls: ['./invoice-load-details.component.css'],
})
export class InvoiceLoadDetailsComponent implements OnInit {
  InvoiceForm!: FormGroup;
  orderType = '';
  sapType = '';
  invoicenumber = '';
  showTable = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.InvoiceForm = this.fb.group({
      invoices: this.fb.array([]),
    });
  }

  get invoices(): FormArray {
    return this.InvoiceForm.get('invoices') as FormArray;
  }

  createInvoiceRow(data?: any): FormGroup {
    return this.fb.group({
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZACT_LOAD: [data?.ZACT_LOAD || '', Validators.required],
      ZACT_VOL: [data?.ZACT_VOL || '', Validators.required],
      ZLF_VOL: [data?.ZLF_VOL || '', Validators.required],
      ZLF_WT: [data?.ZLF_WT || '', Validators.required],
      ZWEEK_SF: [data?.ZWEEK_SF || '', Validators.required],
      ZEWAYBILL_NO: [data?.ZEWAYBILL_NO || '', Validators.required],
      ZEWAYBILL_DT: [data?.ZEWAYBILL_DT || '', Validators.required],
    });
  }

  addRow(data?: any): void {
    this.invoices.push(this.createInvoiceRow(data));
  }

  removeRow(i: number): void {
    if (this.invoices.length > 1) this.invoices.removeAt(i);
    else Swal.fire('Warning', 'At least one row required.', 'warning');
  }

  onSapTypeSelection(): void {
    this.invoices.clear();
    this.addRow();

    if (this.sapType === 'SAP') {
      this.showTable = false; // hide until GET clicked
    } else {
      this.showTable = true;  // show immediately for Non-SAP
    }
  }

  fetchInvoiceDetails(): void {
    if (!this.invoicenumber.trim()) {
      Swal.fire('Warning', 'Please enter invoice number', 'warning');
      return;
    }

    const payload = { INV_GET: this.invoicenumber };
    this.spinner.show();

    this.service.Invoiceloaddetailsfetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (Array.isArray(res) && res.length > 0) {
          this.invoices.clear();
          res.forEach((r) => this.addRow(r));
          this.showTable = true;
          Swal.fire('Success', 'Invoice details loaded', 'success');
        } else {
          Swal.fire('Info', 'No records found', 'info');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to fetch details', 'error');
      },
    });
  }

  // ✅ SAP Save
  saveInvoiceDetails(): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const payload = this.invoices.value.map((item: any, i: number) => ({
      SI_NO: i + 1,
      ...item,
    }));

    this.spinner.show();
    this.service.InvoiceloaddetailsSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire('Success', res.MSG || 'Saved Successfully', 'success');
          this.resetForm();
        } else Swal.fire('Info', res.MSG || 'Unexpected response', 'info');
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      },
    });
  }

  // ✅ Non-SAP Save
  saveInvoiceNonsapDetails(): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const payload = {
      NSAP_LOAD: this.invoices.value.map((inv: any) => ({
        MANDT: '234',
        VBELN: this.invoicenumber || '0000000000',
        POSNR: 10,
        ZTRUC_TYPE: inv.ZTRUC_TYPE,
        ZACT_LOAD: inv.ZACT_LOAD,
        ZACT_VOL: inv.ZACT_VOL,
        ZLF_VOL: inv.ZLF_VOL,
        ZLF_WT: inv.ZLF_WT,
        ZWEEK_SF: inv.ZWEEK_SF,
        ZEWAYBILL_NO: inv.ZEWAYBILL_NO,
        ZEWAYBILL_DT: inv.ZEWAYBILL_DT,
      })),
    };

    this.spinner.show();
    this.service.InvoiceloaddetailsNonSap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire('Success', res.MSG || 'Saved Successfully', 'success');
          this.resetForm();
        } else Swal.fire('Info', res.MSG || 'Unexpected response', 'info');
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      },
    });
  }
  onSave(): void {
    if (this.sapType === 'SAP') {
      this.saveInvoiceDetails(); // call SAP save
    } else if (this.sapType === 'Non-SAP') {
      this.saveInvoiceNonsapDetails(); // call Non-SAP save
    } else {
      Swal.fire('Warning', 'Please select SAP type before saving', 'warning');
    }
  }


  resetForm(): void {
    this.InvoiceForm.reset();
    this.invoices.clear();
    this.addRow();
    this.orderType = '';
    this.sapType = '';
    this.invoicenumber = '';
    this.showTable = false;
  }
}
