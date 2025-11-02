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
  vehicleTypes: any[] = [];

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
    this.getVehicleTypes();
  }

  get invoices(): FormArray {
    return this.InvoiceForm.get('invoices') as FormArray;
  }

  createInvoiceRow(data?: any): FormGroup {
    return this.fb.group({
      MANDT: [data?.MANDT || '234'],
      VBELN: [data?.VBELN || this.invoicenumber],
      POSNR: [data?.POSNR || ''],
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

  // ✅ FETCH INVOICE API
  fetchInvoiceDetails(): void {
    if (!this.invoicenumber?.trim()) {
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
          res.forEach((item: any) => this.addRow(item));
          this.showTable = true;

          Swal.fire('Success', 'Invoice details loaded', 'success');
        } else {
          Swal.fire('Info', 'No records found', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Fetch failed', 'error');
      }
    });
  }

  // ✅ SAVE FOR SAP
  saveInvoiceDetails(): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

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
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      }
    });
  }

  // ✅ SAVE NON-SAP
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
        } else {
          Swal.fire('Info', res.MSG || 'Unexpected response', 'info');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      }
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

  onTruckTypeChange(i: number): void {

    // ✅ If NON-SAP, do not call API
    if (this.sapType === 'Non-SAP') {
      return; // Just allow user to type manually
    }

    // ✅ Continue only for SAP
    const row = this.invoices.at(i);
    const selectedTruck = row.get('ZTRUC_TYPE')?.value;

    if (!selectedTruck) return;

    const payload = {
      TRUCK: selectedTruck,
      ZACT_LOAD: 10,
      ZACT_VOL: "90"
    };

    this.spinner.show();
    this.service.sapget(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        const data = Array.isArray(res) ? res[0] : res;
        if (!data) return;

        row.patchValue({
          ZTRUC_TYPE: data.ZTRUC_TYPE || '',
          ZACT_LOAD: data.ZACT_LOAD || '',
          ZACT_VOL: data.ZACT_VOL || '',
          ZLF_VOL: data.ZLF_VOL || '',
          ZLF_WT: data.ZLF_WT || ''
        });
      },
      error: () => {
        this.spinner.hide();
        Swal.fire("Error", "SAP Truck API failed", "error");
      }
    });
  }

  // ✅ LOAD VEHICLE TYPES
  getVehicleTypes(): void {
    this.service.gettypeofvehicle().subscribe({
      next: (res: any) => {
        this.vehicleTypes = res || [];
      },
      error: () => {
        Swal.fire("Error", "Failed to load vehicle types", "error");
      }
    });
  }

}
