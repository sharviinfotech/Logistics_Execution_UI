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
  // Form variables
  orderType: any;
  sapType: any;
  invoicenumber: any;
  ponumber: any;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;

  // UI state
  showTable = false;
  ShowHeaderForm = false;
  SavedDataShow = false;
  showForm = false;
  isEditMode = false;
  isAllSelected = false;

  // Track previous selections
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // Search functionality
  selectedItems: any[] = [];
  searchReference = '';
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  searchOptions = [
    { key: 'REF_NO', label: 'Reference No' },
    { key: 'INV_NO', label: 'Invoice No' },
    { key: 'ODN_NO', label: 'ODN No' },
    { key: 'SO_NO', label: 'SO No' },
    { key: 'TRANSPORTER', label: 'Transporter' },
    { key: 'LR_NO', label: 'LR NO' },
    { key: 'WORKORDER_NO', label: 'Workorder No' },
    { key: 'SALES_PERSON', label: 'Sales Person' },
    { key: 'LOCATION', label: 'Location' },
    { key: 'VEHICLE_NO', label: 'Vehicle No' },
    { key: 'FREIGHT_BILLNO', label: 'Freight Bill No' },
    { key: 'NATURE_DAMAGE', label: 'Nature of Damage' },
    { key: 'CLAIM_STATUS', label: 'Claim Status' }
  ];

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

  // Form Builders
  buildHeaderForm(): void {
    this.HeaderForm = this.fb.group({
      ZMAPID: [''],
      INV_NO: [''],
      REFNO: [''],
      SALE_PERSON: [''],
      ODN_NO: [''],
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
      CLM_SET_DT: [''],
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
  }

  buildItemForm(): void {
    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  // Form Array Getters
  get items(): FormArray {
    return this.ItemForm.get('ITEMS') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.HeaderForm.get('referenceItems') as FormArray;
  }

  // Row Creation
  createReferenceRow(): FormGroup {
    return this.fb.group({
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addItemRow(): void {
    const row = this.fb.group({
      selected: [false],
      ZREFNO: [''],
      ZLINE_NO: [''],
      INV_NO: [''],
      POSNR: [''],
      VEH_LINE: [''],
      VEHICLE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      AH: [''],
      NO_SETS: [''],
      TRANSPORTER: [''],
      WORK_ORDER: [''],   // ✅ FIX
      BILLNO: [''],
      ZMAPID: ['']
    });

    this.items.push(row);
  }

  removeItemRow(i: number): void {
    this.items.removeAt(i);
  }

  // Reset Functions
  resetForms(): void {
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    this.invoicenumber = '';
    this.ponumber = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';

    if (this.sapType !== 'Non-SAP') {
      this.ShowHeaderForm = false;
      this.showTable = false;
      this.showForm = false;
    }
  }

  resetConditionalFields(): void {
    // Don't reset these flags if switching to Non-SAP
    if (this.sapType !== 'Non-SAP') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      this.showForm = false;
    }

    this.searchOptionsList = [];
    this.selectedItems = [];
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
  }

  // Order Type & SAP Type Selection
  onOrderTypeSelection(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = null;
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeSelection(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    this.resetForms();
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
      global_scr: 'INSURANCE CLAIM STATUS',
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : ''
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();
    let apiCall;
    if (this.sapType === 'SAP') {
      apiCall = this.service.GlobalReferenceNoFetch(obj); // POST
    } else {
      apiCall = this.service.GlobalReferenceNoFetchwithoutsap(obj); // PUT
    }

    apiCall.subscribe({
      next: (res: any) => {
        console.log('✅ Response:', res);
        this.spinner.hide();
        this.populateReferenceRows(res);
      },
      error: err => {
        console.error('❌ Error:', err);
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
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || '']
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

  // Map ID Change Handler
  onchangeMAPID(index: number): void {
    const rowForm = this.items.at(index) as FormGroup;
    const selectedMapId = rowForm.get('ZMAPID')?.value;
    console.log('Selected MAPID:', selectedMapId);

    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);
    console.log('Selected MAPID object:', selectedObj);

    if (selectedObj) {
      rowForm.patchValue({
        ZREFNO: selectedObj.referenceNumber || '',
        ZWORK_ORDER: selectedObj.workOrderNumber || '',
        LR_NO: selectedObj.lrNumber || '',
        TRANSPORTER: selectedObj.transporter || '',
        ZMAPID: selectedObj.MAPID || ''
      });
    }
    console.log('Updated items form:', this.items.value);
  }

  // Checkbox Selection Logic
  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;

    if (checkbox.checked) {
      const exists = this.selectedItems.some(
        item =>
          item.MAPID === rowValue.MAPID &&
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
        item =>
          !(
            item.MAPID === rowValue.MAPID &&
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
      item =>
        item.MAPID === rowValue.MAPID &&
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter
    );
  }

  allSelected(): boolean {
    return this.items.controls.length > 0 &&
      this.items.controls.every(ctrl => ctrl.get('selected')?.value === true);
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.items.controls.forEach(ctrl => ctrl.get('selected')?.setValue(isChecked));
  }

  onRowCheckboxChange(): void {
    this.isAllSelected = this.allSelected();
    console.log('All Selected:', this.items.value);
  }

  getSelectedRows() {
    return this.items.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }

  // Search Type Change
  onSearchTypeChange(): void {
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;
    console.log('🔄 Search type changed. Data reset.');
  }

  // Search Functionality
  onSearchReference(): void {
    if (!this.searchReference?.trim()) {
      Swal.fire('Please enter a value', '', 'warning');
      return;
    }

    this.SavedDataShow = false;
    this.ShowHeaderForm = false;
    

    if (!this.selectedType) {
      Swal.fire('Please select a search type', '', 'info');
      return;
    }

    let payload1: any = {
      global: 'INSURANCE CLAIM STATUS',
      data: {
        REF_NO: '',
        INV_NO: '',
        SO_NO: '',
        TRANSPORTER: '',
        LR_NO: '',
        WORKORDER_NO: '',
        SALES_PERSON: '',
        LOCATION: '',
        ODN_NO: '',
        VEHICLE_NO: '',
        FREIGHT_BILLNO: '',
        PRODUCT: '',
        ROUTE: '',
        NATURE_DAMAGE: '',
        CLAIM_STATUS: ''
      }
    };

    payload1.data[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload1:', payload1);
    this.spinner.show();
    let apiCall;

    if (this.sapType === 'SAP') {
      apiCall = this.service.global_Fields_SearchOption(payload1); // POST
    } else {
      apiCall = this.service.global_Fields_SearchOption_WithoutSap(payload1); // PUT
    }

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ Search Response:', res);

        if (res.NUMBER == '100' && res.STATUS == 'FALSE') {
          this.searchOptionsList = [];
          Swal.fire('', res.MESSAGE, 'warning');
        } else {
          this.searchOptionsList = res.ITEMS;
          this.showForm = false;
          this.SavedDataShow = true;
          this.ShowHeaderForm = true;
          this.showTable = false;
          
          const header = res.HEADER?.[0];
          console.log('HEADER PATCH', header);
          
          this.HeaderForm.patchValue({
            INV_NO: header.ZINV_NO,
            FI: header.ZFI,
            REP_DATE: header.ZREP_DATE,
            CLAIM_REF: header.ZCLAIM_REF,
            INV_DATE: header.ZINV_DATE,
            INV_BV: header.ZINV_BV,
            LOSS_DCL: header.ZLOSS_DCL,
            CLM_RF: header.ZCLM_RF,
            SOL_VAL: header.ZSOL_VAL,
            CUSTOMER: header.ZCUSTOMER,
            SO_NO: header.ZSO_NO,
            LOCATION: header.ZLOCATION,
            DAMAGE_RMK: header.ZDAMAGE_RMK,
            CLM_INF: header.ZCLM_INF,
            CLM_ST: header.ZCLM_ST,
            CLM_DOC_ST: header.ZCLM_DOC_ST,
            COURIER_DET: header.ZCOURIER_DET,
            PAY_ST: header.ZPAY_ST,
            PAY_INFO: header.ZPAY_INFO,
            UTR: header.ZUTR,
            CLM_SET_DT: header.ZCLM_SET_DT,
            SALE_PERSON: header.ZSALE_PERSON,
            REFNO: header.ZREFNO
          });

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

  // Input Change
  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      this.showForm = false;
    }
  }

  // Get Form
  getForm(type: 'purchase' | 'invoice'): void {
    if (this.sapType === 'SAP') {
      this.fetchInvoiceDetails();
    } else if (this.sapType === 'Non-SAP') {
      this.fetchInvoiceDetailsnonsap();
    }
  }

  // Fetch Invoice Details (SAP)
  fetchInvoiceDetails(): void {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = { VBELN: referenceNumber };

    this.spinner.show();
    this.service.InsuranceClaimTrackingfetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire('No data found', '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.ShowHeaderForm = true;
        this.showForm = true;

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
          ODN_NO: header.ODN_NO,
          SO_NO: header.SO_NO,
          SALE_PERSON: header.SALE_PERSON,
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

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            selected: [false],
            ZMAPID: [x.MAPID || ''],
            ZREFNO: [x.ZREFNO],
            ZLINE_NO: [x.ZLINE_NO],
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            VEHICLE: [x.VEHICLE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            AH: [x.AH],
            NO_SETS: [x.NO_SETS],
            TRANSPORTER: [x.TRANSPORTER],
            ZWORK_ORDER: [x.ZWORK_ORDER],
            ZBILLNO: [x.ZBILLNO]
          });

          this.items.push(row);
        });
      },
      error: err => {
        this.spinner.hide();
        console.error(err);
        Swal.fire('Error fetching data', '', 'error');
      }
    });
  }

  // Save SAP
  onSaveActionSap(action: 'stay' | 'next' | 'previous' = 'stay'): void {

    // 1️⃣ Get selected rows
    const filtered = this.items.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...row }) => ({
        ...row,
        WORK_ORDER: row.ZWORK_ORDER,
        BILLNO: row.BILLNO,
      }));

    if (filtered.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one product row to save.',
        icon: 'warning',
        timer: 3000,
        confirmButtonText: 'Ok'
      });
      return;
    }

    // 2️⃣ Reference / Invoice number
    const referenceNumber =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    // 3️⃣ HEADER value
    const headerValue = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = referenceNumber;

    // 🔥 IMPORTANT: Set REFNO explicitly
    headerValue.REFNO =
      this.referenceItems.at(0)?.value?.referenceNumber || 0;

    // 4️⃣ Ensure header fields exist
    headerValue.SO_NO = headerValue.SO_NO;
    headerValue.ODN_NO = headerValue.ODN_NO || '';
    headerValue.SALE_PERSON = headerValue.SALE_PERSON || '';

    // 5️⃣ Apply common values to ITEM
    filtered.forEach(row => {
      row.INV_NO = referenceNumber;
      row.REFNO = headerValue.REFNO; // ✅ same REFNO
      // Ensure backend receives z-prefixed bill/workorder keys as well
      row.ZBILLNO = row.BILLNO || row.ZBILLNO || '';
      row.ZWORK_ORDER = row.WORK_ORDER || row.ZWORK_ORDER || '';
    });

    // 6️⃣ Final payload
    const payload = {
      HEADER: headerValue,
      ITEM: filtered
    };

    console.log('📤 Final Payload:', payload);

    // 7️⃣ Save API call
    this.spinner.show();
    this.service.InsuranceClaimTrackingSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === 'TRUE') {
          Swal.fire({
            text: '✅ Data Saved Successfully!',
            icon: 'success',
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/next-screen']);
              } else if (action === 'previous') {
                this.router.navigate(['/transit-damage-info']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire({
            text: '⚠️ Save Failed: ' + (res.MESSAGE || ''),
            icon: 'warning'
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          text: '❌ Error while saving',
          icon: 'error'
        });
      }
    });
  }

  // Fetch Invoice Details Non-SAP
  fetchInvoiceDetailsnonsap(): void {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = { VBELN: referenceNumber };

    this.spinner.show();
    this.service.fetchinvoicelistnonsap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire('No data found', '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.ShowHeaderForm = true;
        this.showForm = true;

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

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            selected: [false],
            ZMAPID: [''],
            ZREFNO: [''],
            ZLINE_NO: [x.ZLINE_NO],
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            VEHICLE: [x.VEHICLE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            AH: [x.AH],
            NO_SETS: [x.NO_SETS],
            TRANSPORTER: [x.TRANSPORTER],
            ZWORK_ORDER: [''],
            ZBILLNO: ['']
          });

          this.items.push(row);
        });
      },
      error: err => {
        this.spinner.hide();
        console.error(err);
        Swal.fire('Error fetching NON-SAP data', '', 'error');
      }
    });
  }

  // Save Non-SAP
  onSaveNonSap(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    const headerValue = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = referenceNumber;

    this.items.controls.forEach(row => {
      row.patchValue({ INV_NO: referenceNumber });
    });

    const payload = {
      HEADER: headerValue,
      ITEM: this.ItemForm.value.ITEMS
    };

    console.log('📤 Non-SAP Final Payload:', payload);

    this.spinner.show();
    this.service.Nonsapsave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === 'TRUE' || res?.STATUS === true) {
          Swal.fire({
            text: '✅ Data Saved Successfully!',
            icon: 'success',
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/next-screen']);
              } else if (action === 'previous') {
                this.router.navigate(['/transit-damage-info']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire({
            text: '⚠️ Save Failed: ' + (res.MESSAGE || ''),
            icon: 'warning'
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          text: '❌ Error while saving data',
          icon: 'error'
        });
      }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any): void {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  removeReferenceRow(index: number): void {
  const rowValue = (this.referenceItems.at(index) as FormGroup).value;

  this.referenceItems.removeAt(index);

  this.selectedItems = this.selectedItems.filter(
    item =>
      !(
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter
      )
  );
}
}
