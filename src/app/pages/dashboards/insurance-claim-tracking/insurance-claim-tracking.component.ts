import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import Swal from 'sweetalert2';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-insurance-claim-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './insurance-claim-tracking.component.html',
  styleUrls: ['./insurance-claim-tracking.component.css']
})
export class InsuranceClaimTrackingComponent implements OnInit {

  orderType: any;
  sapType: any;
  invoicenumber: any;
  ponumber: any;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;
  OrderInfo!: FormGroup;

  showForm = false;
  isEditMode = false;
  showTable = false;

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
    {key :"nature_damage",label: 'Nature of Damage'},
    {key :"claim_status",label: 'Claim Status'},
  ];
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
    this.buildOrderInfoForm();
  }

  buildHeaderForm() {
    this.HeaderForm = this.fb.group({
      INV_NO: [''],
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
  }

  buildItemForm() {
    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  buildOrderInfoForm() {
    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createReferenceRow()])
    });
  }

  get items(): FormArray {
    return this.OrderInfo.get('items') as FormArray;
  }

  get itemsTable(): FormArray {
    return this.ItemForm.get('ITEMS') as FormArray;
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
      VEHICLE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      AH: [''],
      NO_SETS: [''],
      TRANSPORTER: ['']
    });

    this.itemsTable.push(row);
  }

  removeItemRow(i: number) {
    this.itemsTable.removeAt(i);
  }

  resetForms() {
    this.HeaderForm.reset();
    this.items.clear();
    this.items.push(this.createReferenceRow());

    while (this.itemsTable.length !== 0) {
      this.itemsTable.removeAt(0);
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
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.HeaderForm.reset();
    this.items.clear();
    this.items.push(this.createReferenceRow());
    while (this.itemsTable.length !== 0) {
      this.itemsTable.removeAt(0);
    }
  }

  // Reference Table: Field Blur Handler
  onFieldBlur(index: number, fieldKey: string): void {
    if (index !== 0) return;

    const firstRow = this.items.at(0) as FormGroup;
    const values = firstRow.value;

    if (
      !values.referenceNumber &&
      !values.workOrderNumber &&
      !values.lrNumber &&
      !values.transporter
    ) {
      this.items.clear();
      this.items.push(this.createReferenceRow());
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
    this.items.clear();

    if (data && data.length > 0) {
      data.forEach(d => {
        this.items.push(
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
      this.items.push(this.createReferenceRow());
    }
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.items.at(index) as FormGroup).value;

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
    const rowValue = (this.items.at(index) as FormGroup).value;

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
          
         "global": "FREIGHT BILLING",
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
      this.showForm = false;
    }
  }

  fetchInvoiceDetails() {
    const referenceNumber = this.orderType === 'Inward' ? this.invoicenumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', 'Please enter invoice/PO number', 'warning');
      return;
    }

    const payload = {
      VBELN: referenceNumber
    };

    this.spinner.show();
    
    const apiCall = this.sapType === 'SAP' 
      ? this.service.InsuranceClaimTrackingfetch(payload)
      : this.service.fetchinvoicelistnonsap(payload);

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire("No data found", '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showForm = false;

        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          FI: header.FI,
          REP_DATE: header.REP_DATE,
          CLAIM_REF: header.CLAIM_REF,
          INV_DATE: header.INV_DATE,
          INV_BV: header.INV_BV,
          LOSS_DCL: header.LOSS_DCL,
          CLM_RF: header.CLM_RF,
          SOL_VAL: header.SOL_VAL,
          CUSTOMER: header.CUSTOMER,
          SO_NO: header.SO_NO,
          LOCATION: header.LOCATION,
          DAMAGE_RMK: header.DAMAGE_RMK,
          CLM_INF: header.CLM_INF,
          CLM_ST: header.CLM_ST,
          CLM_DOC_ST: header.CLM_DOC_ST,
          COURIER_DET: header.COURIER_DET,
          PAY_ST: header.PAY_ST,
          PAY_INFO: header.PAY_INFO,
          UTR: header.UTR,
          CLM_SET_DT: header.CLM_SET_DT
        });

        while (this.itemsTable.length !== 0) {
          this.itemsTable.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            VEHICLE: [x.VEHICLE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            AH: [x.AH],
            NO_SETS: [x.NO_SETS],
            TRANSPORTER: [x.TRANSPORTER]
          });

          this.itemsTable.push(row);
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire("Error fetching data", '', 'error');
      }
    });
  }

  saveSAP(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.invoicenumber : this.invoicenumber;

    this.HeaderForm.patchValue({
      INV_NO: referenceNumber
    });

    this.itemsTable.controls.forEach(row => {
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
    this.service.InsuranceClaimTrackingSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === "TRUE" || res?.STATUS === true || res?.NUMBER === '200') {
          Swal.fire({
            text: "✅ Data Saved Successfully!",
            icon: "success",
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/next-screen']); // Change to your next route
              } else if (action === 'previous') {
                this.router.navigate(['/transit-damage-info']);
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

  saveNonSAP(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.invoicenumber : this.invoicenumber;

    this.HeaderForm.patchValue({
      INV_NO: referenceNumber
    });

    this.itemsTable.controls.forEach(row => {
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
    this.service.Nonsapsave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === "TRUE" || res?.STATUS === true || res?.NUMBER === '200') {
          Swal.fire({
            text: "✅ Data Saved Successfully!",
            icon: "success",
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/next-screen']); // Change to your next route
              } else if (action === 'previous') {
                this.router.navigate(['/transit-damage-info']);
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