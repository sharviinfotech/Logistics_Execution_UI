import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-transit-damage-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-damage-info.component.html',
  styleUrl: './transit-damage-info.component.css'
})
export class TransitDamageInfoComponent implements OnInit {

  orderType: any;
  sapType: any;
  invoicenumber: any;
  ponumber: any;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;

  showTable = false;
  showForm = false;
  isEditMode = false;

  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // Search functionality
  selectedItems: any[] = [];
  searchReference: string = '';
   searchOptions = [
    { key: 'ref_no', label: 'Reference No' },
    { key: 'inv_no', label: 'Invoice No' },
    { key: 'odn_no', label: 'ODN No' },
    { key: 'so_no', label: 'SO No' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'lr_no', label: 'LR NO' },
    { key: 'workorder_no', label: 'Workorder No' },
    {key :"sales_person",label: 'Sales Person'},
    {key :"location",label: 'Location'},
    {key :"vehicle_no",label: 'Vehicle No'},
    {key :"freight_billno",label: 'Freight Bill No'},
    {key :"product",label: 'Product'},
    {key :"route",label: 'Route'},

  ]
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.buildHeaderForm();
    this.buildItemForm();
  }

  buildHeaderForm() {
    this.HeaderForm = this.fb.group({
      INV_NO: [''],
      INV_DATE: [''],
      FSR_RPT_DT: [''],
      BASIC_VALUE: [''],
      INC_DATE: [''],
      CUSTOMER: [''],
      CONSIGN_NAME: [''],
      DAMAGE_RMK: [''],
      SETTLEMENT: [''],
      CLOSING_DT: [''],
      IMAGES: [''],
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
  }

  buildItemForm() {
    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  get items() {
    return this.ItemForm.get('ITEMS') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.HeaderForm.get('referenceItems') as FormArray;
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addItemRow() {
    const row = this.fb.group({
      INV_NO: [''],
      POSNR: [''],
      VEH_LINE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      TRANSPORTER: ['']
    });

    this.items.push(row);
  }

  removeItemRow(i: number) {
    this.items.removeAt(i);
  }

  resetForms() {
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    this.invoicenumber = "";
    this.ponumber = "";
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  onOrderTypeSelection() {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = null;
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    this.resetForms();
  }

  resetConditionalFields(): void {
    this.showTable = false;
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
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
      global_scr: 'TRANSIT DAMAGE INFO',
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

   onSearchTypeChange(): void {
    // Reset data when search type changes
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;
    console.log('🔄 Search type changed. Data reset.');
  }

  // Search functionality
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
        
       "global": "TRANSIT DAMAGE INFO",
       "data": {
           "REF_NO": "",
          "INV_NO": "",
          "SO_NO": "",
          "TRANSPORTER": "",
          "LR_NO": "",
          "WORKORDER_NO": "",
          "SALES_PERSON": "",
          "LOCATION": "",
          "ODN_NO": "",
          "VEHICLE_NO": "",
          "FREIGHT_BILLNO": "",
          "PRODUCT":"",
          "ROUTE":"",
          "NATURE_DAMAGE": "",
          "CLAIM_STATUS": ""
      }
       };
       payload1.data[this.selectedType] = this.searchReference.trim();
   
       console.log('🔍 Payload:', payload1);
   
       this.spinner.show();
       this.service.global_Fields_SearchOption(payload1).subscribe({
         next: (res: any) => {
           this.spinner.hide();
           if (res.length > 0) {
             this.searchOptionsList = res;
             this.showForm = false;
             Swal.fire('Data fetched successfully!', '', 'success');
           } else {
             Swal.fire('No records found', '', 'info');
           }
         },
         error: (err) => {
           this.spinner.hide();
           console.error('❌ Error:', err);
           Swal.fire('Error fetching data', '', 'error');
         }
       });
     }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
      this.showForm = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    if (this.sapType === 'SAP') {
      this.fetchInvoiceDetails();
    } else if (this.sapType === 'Non-SAP') {
      this.fetchInvoiceDetailsnonsap();
    }
  }

  fetchInvoiceDetails() {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = {
      VBELN: referenceNumber
    };

    this.spinner.show();
    this.service.TransitDamageInfofetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire("No data found", '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.showForm = true;

        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES
        });

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER]
          });

          this.items.push(row);
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire("Error fetching data", '', 'error');
      }
    });
  }

  onSaveActionSap(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    this.HeaderForm.patchValue({
      INV_NO: referenceNumber
    });

    this.items.controls.forEach(row => {
      row.patchValue({ INV_NO: referenceNumber });
    });

    const payload = {
      HEADER: {
        ...this.HeaderForm.value,
        ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
      },
      ITEM: this.ItemForm.value.ITEMS
    };

    this.spinner.show();
    this.service.TransitDamageInfoSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === "TRUE" || res?.STATUS === true) {
          Swal.fire({
            text: "✅ Data Saved Successfully!",
            icon: "success",
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/insurance-claim-tracking']);
              } else if (action === 'previous') {
                this.router.navigate(['/freight-billing']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire({
            text: "⚠️ Save Failed: " + (res.MESSAGE || ''),
            icon: "warning"
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire({
          text: "❌ Error while saving",
          icon: "error"
        });
      }
    });
  }

  fetchInvoiceDetailsnonsap() {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = {
      VBELN: referenceNumber
    };

    this.spinner.show();
    this.service.fetchinvoicelistnonsapwosp(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire("No data found", '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.showForm = true;

        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES
        });

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER]
          });

          this.items.push(row);
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire("Error fetching NON-SAP data", '', 'error');
      }
    });
  }

  onSaveNonSap(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    this.HeaderForm.patchValue({
      INV_NO: referenceNumber
    });

    this.items.controls.forEach(row => {
      row.patchValue({ INV_NO: referenceNumber });
    });

    const payload = {
      HEADER: {
        ...this.HeaderForm.value,
        ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
      },
      ITEM: this.ItemForm.value.ITEMS
    };

    this.spinner.show();
    this.service.withoutsapSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === "TRUE" || res?.STATUS === true) {
          Swal.fire({
            text: "✅ Data Saved Successfully!",
            icon: "success",
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/insurance-claim-tracking']);
              } else if (action === 'previous') {
                this.router.navigate(['/freight-billing']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire({
            text: "⚠️ Save Failed: " + (res.MESSAGE || ''),
            icon: "warning"
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          text: "❌ Error while saving data",
          icon: "error"
        });
      }
    });
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }
}