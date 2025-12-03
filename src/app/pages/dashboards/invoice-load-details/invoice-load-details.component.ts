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
import { Router } from '@angular/router';

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
  ponumber = '';
  showTable = false;
  vehicleTypes: any[] = [];

  // Search functionality
  selectedItems: any[] = [];
  searchReference: string = '';
 searchOptions = [
    { key: 'ref_no', label: 'Reference No' },
    { key: 'inv_no', label: 'Invoice No' },
    { key: 'odn_no', label: 'ODN No' },
    { key: 'so_no', label: 'SO No' },
    { key: 'lr_no', label: 'LR NO' }
  ];
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  showForm: boolean;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.InvoiceForm = this.fb.group({
      invoices: this.fb.array([]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
    this.addRow();
    this.getVehicleTypes();
  }

  get invoices(): FormArray {
    return this.InvoiceForm.get('invoices') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.InvoiceForm.get('referenceItems') as FormArray;
  }

  createInvoiceRow(data?: any): FormGroup {
    return this.fb.group({
      MANDT: [data?.MANDT || '234'],
      VBELN: [data?.VBELN || this.invoicenumber],
      POSNR: [data?.POSNR || ''],
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZPASS_WT: [data?.ZPASS_WT || '', Validators.required],
      ZACT_LOAD: [data?.ZACT_LOAD || '', Validators.required],
      ZACT_VOL: [data?.ZACT_VOL || '', Validators.required],
      ZLF_VOL: [data?.ZLF_VOL || '', Validators.required],
      ZLF_WT: [data?.ZLF_WT || '', Validators.required],
      ZWEEK_SF: [data?.ZWEEK_SF || '', Validators.required],
      ZEWAYBILL_NO: [data?.ZEWAYBILL_NO || '', Validators.required],
      ZEWAYBILL_DT: [data?.ZEWAYBILL_DT || '', Validators.required],
    });
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addRow(data?: any): void {
    this.invoices.push(this.createInvoiceRow(data));
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onOrderTypeSelection(): void {
    this.showTable = false;
    this.invoices.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
    this.sapType = '';
    this.invoicenumber = '';
    this.ponumber = '';
  }

  removeRow(i: number): void {
    if (this.invoices.length > 1) this.invoices.removeAt(i);
    else Swal.fire('Warning', 'At least one row required.', 'warning');
  }

  onSapTypeSelection(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    this.invoices.clear();
    this.addRow();
    this.showTable = this.sapType !== 'SAP';
  }

  resetConditionalFields(): void {
    this.showTable = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.InvoiceForm.reset();
    this.invoices.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
  }

  // Reference Table: Field Blur Handler
  onFieldBlur(index: number, fieldKey: string): void {
    if (index !== 0) return;

    const firstRow = this.referenceItems.at(0) as FormGroup;
    const values = firstRow.value;

    if (
      !values.referenceNumber &&
      !values.workOrderNumber &&
      !values.lrNumber &&
      !values.transporter
    ) {
      this.referenceItems.clear();
      this.referenceItems.push(this.createReferenceRow());
      return;
    }

    const obj = {
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : ''
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();
    this.service.GlobalReferenceNoFetch(obj).subscribe({
      next: (res: any) => {
        console.log('✅ GlobalRefSearch Response:', res);
        this.spinner.hide();
        this.populateReferenceRows(res);
      },
      error: err => {
        console.error('❌ Ref Fetch Error:', err);
        this.spinner.hide();
      }
    });
  }

  populateReferenceRows(data: any[]): void {
    this.referenceItems.clear();

    if (data && data.length > 0) {
      data.forEach(d => {
        this.referenceItems.push(
          this.fb.group({
            referenceNumber: [d.REF_NO || ''],
            workOrderNumber: [d.WORK_ORDER_NO || ''],
            lrNumber: [d.LR_NO || ''],
            transporter: [d.TRANSPORTER || '']
          })
        );
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'No Records Found',
        text: 'No matching reference details were found.',
        timer: 1500,
        showConfirmButton: false,
        width: '300px'
      });
      this.referenceItems.push(this.createReferenceRow());
    }
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;

    if (checkbox.checked) {
      const exists = this.selectedItems.some(
        (item) =>
          item.referenceNumber === rowValue.referenceNumber &&
          item.workOrderNumber === rowValue.workOrderNumber &&
          item.lrNumber === rowValue.lrNumber &&
          item.transporter === rowValue.transporter
      );
      if (!exists) {
        this.selectedItems.push(rowValue);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (item) =>
          !(
            item.referenceNumber === rowValue.referenceNumber &&
            item.workOrderNumber === rowValue.workOrderNumber &&
            item.lrNumber === rowValue.lrNumber &&
            item.transporter === rowValue.transporter
          )
      );
    }

    console.log('✅ Selected Items:', this.selectedItems);
  }
  isItemSelected(index: number): boolean {
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;

    return this.selectedItems.some(
      (item) =>
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter
    );
  }

  // Search functionality


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  // ✅ FETCH INVOICE API
  fetchInvoiceDetails(): void {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;
    
    if (!referenceNumber?.trim()) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number`, 'warning');
      return;
    }

    const payload = { INV_GET: referenceNumber.trim() };
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

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.fetchInvoiceDetails();
  }

  // ✅ SAVE FOR SAP
  saveInvoiceDetails(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    const payload = this.invoices.value.map((item: any, index: number) => ({
      MANDT: item.MANDT || '234',
      VBELN: referenceNumber,
      POSNR: item.POSNR || 10,
      ZREFNO: this.orderType === 'Outward' ? this.selectedItems[0]?.referenceNumber || 0 : 0,
      ZWORK_ORDER: this.selectedItems[0]?.workOrderNumber || "",
      ZLRNO: this.selectedItems[0]?.lrNumber || "",
      ZTRANSPORTER: this.selectedItems[0]?.transporter || "",
      ZLINE_NO: index + 1,
      ZSO_NO: "",
      ZODN_NO: "",
      ZTRUC_TYPE: item.ZTRUC_TYPE,
      ZPASS_WT: item.ZPASS_WT,
      ZACT_LOAD: Number(item.ZACT_LOAD),
      ZACT_VOL: Number(item.ZACT_VOL),
      ZLF_VOL: Number(item.ZLF_VOL),
      ZLF_WT: item.ZLF_WT,
      ZWEEK_SF: item.ZWEEK_SF,
      ZEWAYBILL_NO: item.ZEWAYBILL_NO,
      ZEWAYBILL_DT: item.ZEWAYBILL_DT,
      ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
    }));

    this.spinner.show();
    this.service.InvoiceloaddetailsSave({ payload }).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Saved Successfully',
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/segment-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/shipment-details']);
            } else {
              this.resetForm();
            }
          });
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
  saveInvoiceNonsapDetails(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    this.InvoiceForm.markAllAsTouched();
    if (this.InvoiceForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const payload = {
      NSAP_LOAD: this.invoices.value.map((inv: any) => {
        const selectedRow = this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {};
        return {
          MANDT: '234',
          REF_NO: selectedRow.referenceNumber || "",
          WORK_ORDER_NO: selectedRow.workOrderNumber || "",
          LR_NO: selectedRow.lrNumber || "",
          TRANSPORTER: selectedRow.transporter || "",
          VBELN: this.invoicenumber || '0000000000',
          POSNR: 10,
          ZTRUC_TYPE: inv.ZTRUC_TYPE,
          ZPASS_WT: inv.ZPASS_WT,
          ZACT_LOAD: inv.ZACT_LOAD,
          ZACT_VOL: inv.ZACT_VOL,
          ZLF_VOL: inv.ZLF_VOL,
          ZLF_WT: inv.ZLF_WT,
          ZWEEK_SF: inv.ZWEEK_SF,
          ZEWAYBILL_NO: inv.ZEWAYBILL_NO,
          ZEWAYBILL_DT: inv.ZEWAYBILL_DT
        };
      }),
    };

    this.spinner.show();
    this.service.InvoiceloaddetailsNonSap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Saved Successfully',
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/segment-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/shipment-details']);
            } else {
              this.resetForm();
            }
          });
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

  onSave(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    if (this.sapType === 'SAP') {
      this.saveInvoiceDetails(action);
    } else if (this.sapType === 'Non-SAP') {
      this.saveInvoiceNonsapDetails(action);
    } else {
      Swal.fire('Warning', 'Please select SAP type before saving', 'warning');
    }
  }

  resetForm(): void {
    this.InvoiceForm.reset();
    this.invoices.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
    this.orderType = '';
    this.sapType = '';
    this.invoicenumber = '';
    this.ponumber = '';
    this.showTable = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  onTruckTypeChange(i: number): void {
    // ✅ If NON-SAP, do not call API
    if (this.sapType === 'Non-SAP') {
      return;
    }

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

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

   onSearchTypeChange(): void {
    
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;
    console.log('🔄 Search type changed. Data reset.');
  }


   onSearchReference() {
        if (!this.searchReference?.trim()) {
          Swal.fire('Please enter a value', '', 'warning');
          return;
        }
    
        if (!this.selectedType) {
          Swal.fire('Please select a search type', '', 'info');
          return;
        }
        let payload1: any = {
         
        "global": "INVOICE LOAD DETAILS",
        "data": {
            "ref_no": "",
            "inv_no": "",
            "so_no": "",
            "transporter": "",
            "lr_no": "",
            "workorder_no": "",
            "sales_person": "",
            "location": "",
            "odn_no": "",
            "vehicle_no": "",
            "freight_billno": "",
            "nature_damage": "",
            "claim_status": ""   
        }
        };
        payload1.data[this.selectedType] = this.searchReference.trim();
    
        console.log('🔍 Payload1:', payload1);
        this.spinner.show();
        this.service.global_Fields_SearchOption(payload1).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          console.log('✅ Search Response:', res);
          if (res.NUMBER == "100" && res.STATUS == "FALSE") {
            this.searchOptionsList = [];
            Swal.fire('', res.MESSAGE, 'warning');
          } else {
            Swal.fire('No records found', '', 'info');
             this.searchOptionsList = res.HEADER;
            this.showForm = false;        
            Swal.fire('Data fetched successfully!', '', 'success');
          }
        },
        error: (err) => {
          this.spinner.hide();
          console.error('❌ Error:', err);
          Swal.fire('Error fetching data', '', 'error');
        }
      });
      }
}