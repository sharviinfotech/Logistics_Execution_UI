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
    this.addRow();
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
  onOrderTypeSelection(): void {
    this.showTable = false;
    this.invoices.clear();
    this.addRow();
    this.sapType = '';
    this.invoicenumber = '';
  }


  removeRow(i: number): void {
    if (this.invoices.length > 1) this.invoices.removeAt(i);
    else Swal.fire('Warning', 'At least one row required.', 'warning');
  }

  onSapTypeSelection(): void {
    this.invoices.clear();
    this.addRow();
    this.showTable = this.sapType !== 'SAP';
  }

  // ✅ Combined two API calls (fetchInvoiceList + sapget)
  fetchInvoiceDetails(): void {
    if (!this.invoicenumber.trim()) {
      Swal.fire('Warning', 'Please enter invoice number', 'warning');
      return;
    }

    const payload1 = { INV_GET: this.invoicenumber };
    this.spinner.show();

    // 🔹 Step 1: Fetch Invoice List
    this.service.Invoiceloaddetailsfetch(payload1).subscribe({
      next: (fetchRes: any) => {
        console.log('✅ FetchInvoiceList Response:', fetchRes);

        if (!Array.isArray(fetchRes) || fetchRes.length === 0) {
          this.spinner.hide();
          Swal.fire('Info', 'No invoice data found', 'info');
          return;
        }

        const firstRow = fetchRes[0];

        // 🔹 Prepare SAP Request Payload (static or based on your logic)
        const sapPayload = {
          TRUCK: firstRow.ZTRUC_TYPE || 'FTL 22 FEET',
          ZACT_LOAD: firstRow.ZACT_LOAD || 10,
          ZACT_VOL: firstRow.ZACT_VOL || '90',
        };

        // 🔹 Step 2: Call SAP Get API
        this.service.sapget(sapPayload).subscribe({
          next: (sapRes: any) => {
            console.log('✅ SAPGet Response:', sapRes);
            this.spinner.hide();

            // Merge both responses
            const merged = {
              MANDT: firstRow.MANDT,
              VBELN: firstRow.VBELN,
              POSNR: firstRow.POSNR,
              ZTRUC_TYPE: sapRes.ZTRUC_TYPE || sapPayload.TRUCK,
              ZACT_LOAD: sapRes.ZACT_LOAD ?? sapPayload.ZACT_LOAD,
              ZACT_VOL: sapRes.ZACT_VOL ?? sapPayload.ZACT_VOL,
              ZLF_VOL: sapRes.ZLF_VOL ?? 0,
              ZLF_WT: sapRes.ZLF_WT ?? '',
              ZWEEK_SF: firstRow.ZWEEK_SF,
              ZEWAYBILL_NO: firstRow.ZEWAYBILL_NO,
              ZEWAYBILL_DT: firstRow.ZEWAYBILL_DT,
            };

            // Display data in table
            this.invoices.clear();
            this.addRow(merged);
            this.showTable = true;

            Swal.fire('Success', 'Invoice and SAP data loaded', 'success');
          },
          error: (err) => {
            this.spinner.hide();
            console.error(err);
            Swal.fire('Error', 'SAP GET API failed', 'error');
          },
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire('Error', 'Fetch Invoice List API failed', 'error');
      },
    });
  }

  // ✅ Save for SAP

  saveInvoiceDetails(): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    // ✅ Build payload in exact backend format
    const payload = this.invoices.value.map((item: any) => ({
      MANDT: item.MANDT || '234',
      VBELN: this.invoicenumber,
      POSNR: item.POSNR || 10,
      ZTRUC_TYPE: item.ZTRUC_TYPE,
      ZACT_LOAD: Number(item.ZACT_LOAD),
      ZACT_VOL: Number(item.ZACT_VOL),
      ZLF_VOL: Number(item.ZLF_VOL),
      ZLF_WT: item.ZLF_WT,
      ZWEEK_SF: item.ZWEEK_SF,
      ZEWAYBILL_NO: item.ZEWAYBILL_NO,
      ZEWAYBILL_DT: item.ZEWAYBILL_DT,
    }));

    console.log('✅ Final SAP Save Payload:', JSON.stringify(payload, null, 2));

    this.spinner.show();
    this.service.InvoiceloaddetailsSave({ NSAP_LOAD: payload }).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire('Success', res.MSG || 'Saved Successfully', 'success');
          this.resetForm();
        } else {
          Swal.fire('Info', res.MSG || 'Unexpected response', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
        console.error('❌ Save Error:', err);
      },
    });
  }



  // ✅ Save for Non-SAP
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
    if (this.sapType === 'SAP') this.saveInvoiceDetails();
    else if (this.sapType === 'Non-SAP') this.saveInvoiceNonsapDetails();
    else Swal.fire('Warning', 'Please select SAP type before saving', 'warning');
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
