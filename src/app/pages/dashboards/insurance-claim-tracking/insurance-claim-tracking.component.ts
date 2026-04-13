import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
   Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import Swal from 'sweetalert2';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  headerData: any = null;
  itemsList: any[] = [];
  InsurancetrackingHeader: any[] = [];  // ✅ Add this
  InsurancetrackingItems: any[] = [];   // ✅ Add this
  transitResponse: any = {};
  showForm = false;
  isEditMode = false;
  isAllSelected = false;

  // Track previous selections
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  PlantCodeList: any[] = [];
  VendorCodeList: any[] = [];
  fullReferenceData: any[] = [];
  mainMode: string = 'creation'; // Default to creation mode

  pendingCount: number = 0;
  completedCount: number = 0;
  casesCount: number = 0;

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

  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filterStatus: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;
  isUpdateMode: boolean = false;

  dispatchData: any[] = [];
  InsuranceClaimTrackingData: any[] = [];
  filterSapType: string = '';
  invoiceF4List: string[] = [];
  loggedInUser: string = '';
  plantList: any;
  divisionList: any;
  supportingDocError = false;
  approveDocError = false;


  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
    console.log("Logged in user:", this.loggedInUser);
    this.plantList = userData.PLANTS || [];

    // ✅ Divisions from login response
    this.divisionList = userData.DIV || [];

    console.log("Plants:", this.plantList);
    console.log("Divisions:", this.divisionList);
    this.buildHeaderForm();
    this.buildItemForm();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  // Form Builders
  buildHeaderForm(): void {
    this.HeaderForm = this.fb.group({
      VBELN: ['', Validators.required],
      ZMAPID: [''],
      LINE_NO: [''],
      INV_NO: [''],
      REFNO: [''],
      SALE_PERSON: [''],
      ODN_NO: [''],
      FI: ['',],
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
      SupportingDocument: [''],
      ApproveDocument: [''],
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
      transporter: [''],
      lineNumber: ['']
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
    this.SavedDataShow = false; // ✅ Added

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
    // ✅ Clear all input fields and data
    this.invoicenumber = '';
    this.ponumber = '';
    this.invoiceF4List = [];
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.SavedDataShow = false;
    this.headerData = null;
    this.itemsList = [];



    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
  }

  onMainModeChange(): void {
    // Reset everything when switching modes
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isUpdateMode = false;

    // Reset filter values
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filteredData = [];
    this.filterApplied = false;
    this.filterSapType = '';

    // Reset search values
    this.selectedType = '';
    this.searchReference = '';
    this.SavedDataShow = false;

    this.searchOptionsList = [];

    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;
  }

  // Order Type & SAP Type Selection
  onOrderTypeSelection(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = null;
      this.previousSapType = null;
      this.invoicenumber = '';
      this.ponumber = '';
      this.searchReference = '';
      this.selectedType = '';
      this.searchOptionsList = [];
      this.SavedDataShow = false;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    this.selectedType = '';
    this.searchReference = '';
    this.searchOptionsList = [];
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }
    // ✅ Complete reset when SAP mode changes
    this.invoicenumber = '';
    this.ponumber = '';
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.SavedDataShow = false;
    this.resetForms();

    // ✅ Auto-show forms for Non-SAP
    if (this.sapType === 'Non-SAP') {
      this.ShowHeaderForm = true;
      this.showTable = true;
      this.showForm = true;



      // Add one empty row to items table
      if (this.items.length === 0) {
        this.addItemRow();
      }

      console.log('✅ Non-SAP selected - Forms displayed automatically');
    } else {
      // For SAP, keep forms hidden until GET is clicked
      this.ShowHeaderForm = false;
      this.showTable = false;
      this.showForm = false;
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
      global_scr: 'INSURANCE CLAIM STATUS',
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : '',
      LINE_NO: values.lineNumber || '',
      ZUSER: this.loggedInUser
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

  // populateReferenceRows(data: any[]): void {
  //   this.referenceItems.clear();

  //   if (data && data.length > 0) {
  //     data.forEach(d => {
  //       this.referenceItems.push(
  //         this.fb.group({
  //           MAPID: [d.MAPID || ''],
  //           referenceNumber: [d.REF_NO || d.referenceNumber || ''],
  //           workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
  //           lrNumber: [d.LR_NO || d.lrNumber || ''],
  //           transporter: [d.TRANSPORTER || d.transporter || '']
  //         })
  //       );
  //     });
  //   } else {
  //     Swal.fire({
  //       icon: 'info',
  //       title: 'No Records Found',
  //       text: 'No matching reference details were found.',
  //       timer: 1500,
  //       showConfirmButton: false,
  //       width: '300px'
  //     });
  //     this.referenceItems.push(this.createReferenceRow());
  //   }
  // }
  populateReferenceRows(data: any[]): void {
    this.referenceItems.clear();
    this.invoiceF4List = [];   // 🔑 Reset F4 list
    this.fullReferenceData = [];

    if (data && data.length > 0) {
      this.fullReferenceData = data;
      data.forEach(d => {

        // ✅ EXTRACT INVOICE NUMBERS FOR F4
        if (d.INV_NO && Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !this.invoiceF4List.includes(inv.VBELN)) {
              this.invoiceF4List.push(inv.VBELN);
              this.HeaderForm.patchValue({ VBELN: '' }); 
            }
          });
        }

        // ✅ EXISTING LOGIC (UNCHANGED)
        this.referenceItems.push(
          this.fb.group({
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || ''],
            lineNumber: [d.LINE_NO || d.lineNumber || '']
          })
        );
      });

      console.log('🟢 Invoice F4 List:', this.invoiceF4List);

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
        ZMAPID: selectedObj.MAPID || '',
        ZLINE_NO: selectedObj.lineNumber ?? null
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
          item.transporter === rowValue.transporter &&
          item.lineNumber === rowValue.lineNumber
      );
      if (!exists) {
        this.selectedItems.push(rowValue);
      }
      this.updateInvoiceListForSelectedItems();
    } else {
      this.selectedItems = this.selectedItems.filter(
        item =>
          !(
            item.MAPID === rowValue.MAPID &&
            item.referenceNumber === rowValue.referenceNumber &&
            item.workOrderNumber === rowValue.workOrderNumber &&
            item.lrNumber === rowValue.lrNumber &&
            item.transporter === rowValue.transporter &&
            item.lineNumber === rowValue.lineNumber
          )
      );
      this.updateInvoiceListForSelectedItems();
    }

    console.log('✅ Selected Items:', this.selectedItems);
  }
  updateInvoiceListForSelectedItems(): void {
    this.invoiceF4List = [];

    if (this.selectedItems.length === 0) {
      this.HeaderForm.get('VBELN')?.setValue('');
      return;
    }

    // Get unique MAPIDs from selected items
    const selectedMapIds = [...new Set(this.selectedItems.map(item => item.MAPID))];

    console.log('🔍 Selected MAPIDs:', selectedMapIds);

    // Filter reference data for selected MAPIDs and extract invoices
    this.fullReferenceData.forEach(refItem => {
      if (selectedMapIds.includes(refItem.MAPID)) {
        if (refItem.INV_NO && Array.isArray(refItem.INV_NO)) {
          refItem.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !this.invoiceF4List.includes(inv.VBELN)) {
              this.invoiceF4List.push(inv.VBELN);
            }
          });
        }
      }
    });
    this.HeaderForm.get('VBELN')?.setValue('');

    console.log('📋 Filtered Invoice List:', this.invoiceF4List);
  }

  isItemSelected(index: number): boolean {
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;
    return this.selectedItems.some(
      item =>
        item.MAPID === rowValue.MAPID &&
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter &&
        item.lineNumber === rowValue.lineNumber
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
  // onSearchReference(): void {
  //   if (!this.searchReference?.trim()) {
  //     Swal.fire('Please enter a value', '', 'warning');
  //     return;
  //   }

  //   this.SavedDataShow = false;
  //   this.ShowHeaderForm = false;


  //   if (!this.selectedType) {
  //     Swal.fire('Please select a search type', '', 'info');
  //     return;
  //   }

  //   let payload1: any = {
  //     global: 'INSURANCE CLAIM STATUS',
  //     data: {
  //       REF_NO: '',
  //       INV_NO: '',
  //       SO_NO: '',
  //       TRANSPORTER: '',
  //       LR_NO: '',
  //       WORKORDER_NO: '',
  //       SALES_PERSON: '',
  //       LOCATION: '',
  //       ODN_NO: '',
  //       VEHICLE_NO: '',
  //       FREIGHT_BILLNO: '',
  //       PRODUCT: '',
  //       ROUTE: '',
  //       NATURE_DAMAGE: '',
  //       CLAIM_STATUS: ''
  //     }
  //   };

  //   payload1.data[this.selectedType] = this.searchReference.trim();

  //   console.log('🔍 Payload1:', payload1);
  //   this.spinner.show();
  //   let apiCall;

  //   if (this.sapType === 'SAP') {
  //     apiCall = this.service.global_Fields_SearchOption(payload1); 
  //   } else {
  //     apiCall = this.service.global_Fields_SearchOption_WithoutSap(payload1);
  //   }

  //   apiCall.subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();
  //       console.log('✅ Search Response:', res);

  //       if (res.NUMBER == '100' && res.STATUS == 'FALSE') {
  //         this.searchOptionsList = [];
  //         Swal.fire('', res.MESSAGE, 'warning');
  //       } else {
  //         this.searchOptionsList = (res.ITEMS || []).map((item: any) => ({
  //           ...item,
  //           isEdit: false,      
  //           _backup: null       
  //         }));
  //         this.showForm = false;
  //         this.SavedDataShow = true;
  //         this.ShowHeaderForm = true;
  //         this.showTable = false;

  //         const header = res.HEADER?.[0];
  //         console.log('HEADER PATCH', header);

  //         this.HeaderForm.patchValue({
  //           INV_NO: header.ZINV_NO,
  //           FI: header.ZFI,
  //           REP_DATE: header.ZREP_DATE,
  //           CLAIM_REF: header.ZCLAIM_REF,
  //           INV_DATE: header.ZINV_DATE,
  //           INV_BV: header.ZINV_BV,
  //           LOSS_DCL: header.ZLOSS_DCL,
  //           CLM_RF: header.ZCLM_RF,
  //           SOL_VAL: header.ZSOL_VAL,
  //           CUSTOMER: header.ZCUSTOMER,
  //           SO_NO: header.ZSO_NO,
  //           LOCATION: header.ZLOCATION,
  //           DAMAGE_RMK: header.ZDAMAGE_RMK,
  //           CLM_INF: header.ZCLM_INF,
  //           CLM_ST: header.ZCLM_ST,
  //           CLM_DOC_ST: header.ZCLM_DOC_ST,
  //           COURIER_DET: header.ZCOURIER_DET,
  //           PAY_ST: header.ZPAY_ST,
  //           PAY_INFO: header.ZPAY_INFO,
  //           UTR: header.ZUTR,
  //           CLM_SET_DT: header.ZCLM_SET_DT,
  //           SALE_PERSON: header.ZSALE_PERSON,
  //           REFNO: header.ZREFNO
  //         });

  //         Swal.fire('Data fetched successfully!', '', 'success');
  //       }
  //     },
  //     error: (err) => {
  //       this.spinner.hide();
  //       console.error('❌ Error:', err);
  //       Swal.fire('Error fetching data', '', 'error');
  //     }
  //   });
  // }
  onSearchReference() {


    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;

    if (!this.searchReference?.trim()) {
      Swal.fire('Please enter a value', '', 'warning');
      return;
    }

    if (!this.selectedType) {
      Swal.fire('Please select a search type', '', 'info');
      return;
    }

    let payload1: any = {
      "global": "INSURANCE CLAIM STATUS",
      ZUSER: this.loggedInUser,
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
        "PRODUCT": "",
        "ROUTE": "",
        "NATURE_DAMAGE": "",
        "CLAIM_STATUS": "",

      }
    };

    payload1.data[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload:', payload1);
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

        if (res.NUMBER === '100' && res.STATUS === 'FALSE') {
          this.searchOptionsList = [];
          Swal.fire('', res.MESSAGE, 'warning');
        } else if (!res.HEADER || res.HEADER.length === 0) {
          this.searchOptionsList = [];
          Swal.fire('No records found', '', 'info');
        } else {
          this.headerData = {
            ...res.HEADER[0],
            isEdit: false
          };

          this.itemsList = res.ITEMS.map((item: any) => ({
            ...item,
            isEdit: false
          }));

          this.showTable = true;
          this.showForm = false;
          this.ShowHeaderForm = false
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
      this.fetchInvoiceDetailsNonSap();
    }
  }

  // Fetch Invoice Details (SAP)
  fetchInvoiceDetails(): void {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }
    // ✅ Get selected reference row values
    const selectedRef = this.selectedItems[0] || {};

    const payload = {
      VBELN: referenceNumber,
      ZREFNO: selectedRef.referenceNumber || '',
      ZMAPID: selectedRef.MAPID || ''
    };
    console.log('With Sap Invoice Fetch Payload:', payload);


    this.spinner.show();
    this.service.InsuranceClaimTrackingfetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('With Sap Invoice Fetch Response:', res);

        if (res?.STATUS === 'False') {
          Swal.fire('Info', res.MESSAGE, 'info');
          return;
        }

        Swal.fire('Success', 'Invoice Details fetched successfully!', 'success');

        const header = res[0]?.HEADER;
        const items = res[0]?.ITEM || [];

        console.log("Header:", header);
        console.log("Items:", items);
        // ✅ Hide search results when showing invoice data
        this.SavedDataShow = false;
        this.searchOptionsList = [];

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
            ZMAPID: [x.ZMAPID || x.MAPID || ''],
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
            WORK_ORDER: [x.WORK_ORDER],
            BILLNO: [x.BILLNO]
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
        // WORK_ORDER: row.ZWORK_ORDER,
        // BILLNO: row.ZBILLNO,
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
    const selectedRef = this.selectedItems[0] || {};

    headerValue.INV_NO = referenceNumber;
    headerValue.LINE_NO = selectedRef.lineNumber
      || filtered[0]?.LINE_NO;

    //  IMPORTANT: Set REFNO explicitly
    headerValue.REFNO =
      this.referenceItems.at(0)?.value?.referenceNumber || 0;

    // 4️⃣ Ensure header fields exist
    headerValue.SO_NO = headerValue.SO_NO;
    headerValue.ODN_NO = headerValue.ODN_NO || '';
    headerValue.SALE_PERSON = headerValue.SALE_PERSON || '';

    // 5️⃣ Apply common values to ITEM
    filtered.forEach(row => {
      row.INV_NO = referenceNumber;
      row.LINE_NO = selectedRef.lineNumber || row.LINE_NO || null;
      row.REFNO = headerValue.REFNO;
      // Ensure backend receives z-prefixed bill/workorder keys as well
      // row.ZBILLNO = row.BILLNO || row.ZBILLNO || '';
      // row.ZWORK_ORDER = row.WORK_ORDER || row.ZWORK_ORDER || '';
      // row.WORK_ORDER = row.WORK_ORDER || '';
      // row.BILLNO = row.BILLNO || '';
      headerValue.ZUSER = this.loggedInUser;
      headerValue.ZUSER_CH = ''
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
            confirmButtonText: 'Ok',
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
  // fetchInvoiceDetailsNonSap(event?: any) {

  //   if (this.sapType !== 'Non-SAP') {
  //     return;
  //   }

  //   // 🔴 IMPORTANT FIX
  //   const dcRefNo = event?.target?.value || this.invoicenumber;

  //   if (!dcRefNo || !dcRefNo.toString().trim()) {
  //     Swal.fire('Warning', 'Please enter DC Reference Number', 'warning');
  //     return;
  //   }

  //   const payload = {
  //     VBELN: dcRefNo.toString().trim()
  //   };

  //   console.log('📤 Non-SAP Fetch Payload:', payload);

  //   this.spinner.show();

  //   this.service.fetchinvoicelistnonsap(payload).subscribe({
  //     next: (res: any[]) => {
  //       this.spinner.hide();

  //       if (!res || res.length === 0) {
  //         Swal.fire('No data found', '', 'info');
  //         return;
  //       }

  //       const header = res[0].HEADER;
  //       const items = res[0].ITEM;

  //       this.showTable = true;
  //       this.ShowHeaderForm = true;
  //       this.showForm = true;

  //       this.HeaderForm.patchValue({
  //         INV_NO: dcRefNo,
  //         FI: header.FI,
  //         REP_DATE: header.REP_DATE,
  //         CLAIM_REF: header.CLAIM_REF,
  //         INV_DATE: header.INV_DATE,
  //         INV_BV: header.INV_BV,
  //         LOSS_DCL: header.LOSS_DCL,
  //         CLM_RF: header.CLM_RF,
  //         SOL_VAL: header.SOL_VAL,
  //         CUSTOMER: header.CUSTOMER,
  //         SO_NO: header.SO_NO,
  //         LOCATION: header.LOCATION,
  //         DAMAGE_RMK: header.DAMAGE_RMK,
  //         CLM_INF: header.CLM_INF,
  //         CLM_ST: header.CLM_ST,
  //         CLM_DOC_ST: header.CLM_DOC_ST,
  //         COURIER_DET: header.COURIER_DET,
  //         PAY_ST: header.PAY_ST,
  //         PAY_INFO: header.PAY_INFO,
  //         UTR: header.UTR,
  //         CLM_SET_DT: header.CLM_SET_DT,
  //         SALE_PERSON: header.SALE_PERSON
  //       });

  //       this.items.clear();

  //       items.forEach((x: any) => {
  //         this.items.push(this.fb.group({
  //           selected: [false],
  //           ZMAPID: [x.ZMAPID],
  //           ZREFNO: [x.REFNO],
  //           ZLINE_NO: [x.LINE_NO],
  //           INV_NO: [dcRefNo],
  //           POSNR: [x.POSNR],
  //           VEH_LINE: [x.VEH_LINE],
  //           VEHICLE: [x.VEHICLE],
  //           TRUCK_NO: [x.TRUCK_NO],
  //           LR_NO: [x.LR_NO],
  //           AH: [x.AH],
  //           NO_SETS: [x.NO_SETS],
  //           TRANSPORTER: [x.TRANSPORTER],
  //           ZWORK_ORDER: [x.WORK_ORDER],
  //           ZBILLNO: [x.BILLNO]
  //         }));
  //       });

  //     },
  //     error: () => {
  //       this.spinner.hide();
  //       Swal.fire('Error fetching Non-SAP data', '', 'error');
  //     }
  //   });
  // }

  fetchInvoiceDetailsNonSap() {

    if (this.sapType !== 'Non-SAP') {
      return;
    }

    // ✅ Get from HeaderForm
    const dcRefNo = this.HeaderForm.get('VBELN')?.value;

    if (!dcRefNo || !dcRefNo.toString().trim()) {
      Swal.fire('Warning', 'Please select DC Reference Number', 'warning');
      return;
    }
    const selectedRef = this.selectedItems[0] || {};
    const payload = {
      VBELN: dcRefNo.toString().trim(),
      ZREFNO: selectedRef.referenceNumber || '',
      ZMAPID: selectedRef.MAPID || ''

    };

    console.log('📤 Non-SAP Fetch Payload:', payload);

    this.spinner.show();

    this.service.fetchinvoicelistnonsap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === 'False') {
          Swal.fire('Info', res.MESSAGE, 'info');
          return;
        }

        Swal.fire('Success', 'Invoice Details fetched successfully!', 'success');

        const header = res[0]?.HEADER;
        const items = res[0]?.ITEM || [];

        console.log("Header:", header);
        console.log("Items:", items);

        this.showTable = true;
        this.ShowHeaderForm = true;
        this.showForm = true;

        this.HeaderForm.patchValue({
          INV_NO: dcRefNo,
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
          CLM_SET_DT: header.CLM_SET_DT,
          SALE_PERSON: header.SALE_PERSON
        });

        this.items.clear();

        items.forEach((x: any) => {
          this.items.push(this.fb.group({
            selected: [false],
            ZMAPID: [x.ZMAPID || x.MAPID || ''],
            ZREFNO: [x.REFNO],
            ZLINE_NO: [x.LINE_NO],
            INV_NO: [dcRefNo],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            VEHICLE: [x.VEHICLE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            AH: [x.AH],
            NO_SETS: [x.NO_SETS],
            TRANSPORTER: [x.TRANSPORTER],
            WORK_ORDER: [x.WORK_ORDER],
            ZBILLNO: [x.BILLNO]

          }));
        });

      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching Non-SAP data', '', 'error');
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

    const invoiceNo =
      this.HeaderForm.get('INV_NO')?.value?.toString().trim() || null;

    const refNo =
      this.selectedItems.length > 0
        ? this.selectedItems[0].referenceNumber
        : null;

    const headerValue = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;
    const selectedRef = this.selectedItems[0] || {};

    headerValue.INV_NO = invoiceNo;
    headerValue.REFNO = refNo;
    headerValue.LINE_NO = selectedRef.lineNumber || null;
    headerValue.ZUSER = this.loggedInUser;
    headerValue.ZUSER_CH = ''
    const itemsPayload = this.items.controls
      .filter(ctrl => ctrl.value.selected === true)
      .map(ctrl => ({
        ...ctrl.value,
        INV_NO: invoiceNo,
        REFNO: refNo,
        LINE_NO: selectedRef.lineNumber || null
      }));

    const payload = {
      HEADER: headerValue,
      ITEM: itemsPayload
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
            confirmButtonText: 'Ok',
            timer: 2000,
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

  editSearchRow(row: any): void {
    // Backup original data
    row._backup = { ...row };
    row.isEdit = true;
  }

  cancelSearchEdit(row: any): void {
    if (row._backup) {
      Object.assign(row, row._backup); // Restore original values
      delete row._backup;
    }
    row.isEdit = false;
  }


  // Method to update the edited row
  updateSearchRow(row: any): void {
    // Determine if this is a header row or an item row
    const isHeaderRow = row === this.headerData;

    // For item rows, use just the item. For header rows, use header + items
    const headerRow = isHeaderRow ? row : this.headerData;
    const itemRows = isHeaderRow ? (this.itemsList || []) : [row];

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this transit record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 🔑 Validate mandatory HEADER fields
      if (!headerRow || !headerRow.ZREFNO) {
        Swal.fire('Error', 'Missing mandatory ZREFNO in header', 'error');
        return;
      }

      // Validate that we have items
      if (!itemRows || itemRows.length === 0) {
        Swal.fire('Error', 'No items found to update', 'error');
        return;
      }

      //  const invalidItems = itemRows.filter(item => !item.ZREFNO);
      //  if (invalidItems.length > 0) {
      //    Swal.fire('Error', 'Missing mandatory keys in items (ZREFNO/ZLINE_NO)', 'error');
      //    return;
      //  }

      const headerPayload: any = {
        ZINV_NO: headerRow.ZINV_NO,
        ZREFNO: headerRow.ZREFNO,
        ZLINE_NO: headerRow.ZLINE_NO,
        ZODN_NO: headerRow.ZODN_NO,
        ZFI: headerRow.ZFI,
        ZREP_DATE: headerRow.ZREP_DATE,
        ZCLAIM_REF: headerRow.ZCLAIM_REF,
        ZINV_DATE: headerRow.ZINV_DATE,
        ZINV_BV: headerRow.ZINV_BV,
        ZLOSS_DCL: headerRow.ZLOSS_DCL,
        ZCLM_RF: headerRow.ZCLM_RF,
        ZSOL_VAL: headerRow.ZSOL_VAL,
        ZCUSTOMER: headerRow.ZCUSTOMER,
        ZSO_NO: headerRow.ZSO_NO,
        ZLOCATION: headerRow.ZLOCATION,
        ZDAMAGE_RMK: headerRow.ZDAMAGE_RMK,
        ZCLM_INF: headerRow.ZCLM_INF,
        ZCLM_ST: headerRow.ZCLM_ST,
        ZCLM_DOC_ST: headerRow.ZCLM_DOC_ST,
        ZCOURIER_DET: headerRow.ZCOURIER_DET,
        ZPAY_ST: headerRow.ZPAY_ST,
        ZPLANT: headerRow.ZPLANT,
        ZDIVISION: headerRow.ZDIVISION,
        ZSALE_PERSON: headerRow.ZSALE_PERSON,
        ZVEH_TYPE: headerRow.ZVEH_TYPE,
        ZPAY_INFO: headerRow.ZPAY_INFO,
        ZUTR: headerRow.ZUTR,
        ZCLM_SET_DT: headerRow.ZCLM_SET_DT,
           ZCREATED_DT: headerRow.ZCREATED_DT || null,
        ZUSER: headerRow.ZUSER,
        ZUSER_CH: this.loggedInUser,

      };

      /* ---------------- ITEM PAYLOAD ---------------- */
      const itemPayload = itemRows.map(item => ({
        ZMAPID: item.ZMAPID || null,
        ZINV_NO: item.ZINV_NO || null,
        ZREFNO: String(item.ZREFNO),
        ZLINE_NO: String(item.ZLINE_NO),
        ZPOSNR: item.ZPOSNR || null,
        ZVEH_LINE: item.ZVEH_LINE || null,
        ZTRUCK_NO: item.ZTRUCK_NO || null,
        ZVEHICLE: item.ZVEHICLE || null,

        ZAH: item.ZAH || null,
        ZNO_SETS: item.ZNO_SETS || null,
        ZLRNO: item.ZLRNO || null,
        ZTRANSPORTER: item.ZTRANSPORTER || null,
        ZWORK_ORDER: item.ZWORK_ORDER || null,
        ZBILLNO: item.ZBILLNO || null,
        ZUSER: item.ZUSER,
        ZUSER_CH: this.loggedInUser,

      }));

      // 🎯 Final payload with HEADER + ITEM
      const payload = {
        HEAD: headerPayload,
        ITEM: itemPayload
      };

      console.log('🛠 TRANSIT INFO CHANGE PAYLOAD:', payload);

      this.spinner.show();

      // 🔄 Call correct API based on sapType
      const api$ =
        this.sapType === 'SAP'
          ? this.service.InsuranceClaimTrackingChangeWithSap(payload)
          : this.service.InsuranceClaimTrackingChangeWithoutSap(payload);

      api$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Transit data updated successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            }).then(() => {
              // ✅ Reset edit mode
              headerRow.isEdit = false;
              delete headerRow._backup;
              itemRows.forEach(item => {
                item.isEdit = false;
                delete item._backup;
              });

              // 🔄 Refresh data
              this.onSearchReference();
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Update failed',
              icon: 'error'
            });
          }
        },
        () => {
          this.spinner.hide();
          Swal.fire('Error', 'Internal Server Error', 'error');
        }
      );
    });
  }

  deleteRow(array: any[], index: number): void {
    const row = array[index];

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this record? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO || ''
          }
        ]
      };

      const apiCall = this.sapType === 'SAP'
        ? this.service.InsuranceClaimTrackingDeleteWithSap(payload)
        : this.service.InsuranceClaimTrackingDeleteWithoutSap(payload);

      apiCall.subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE' || res?.STATUS === true || res?.NUMBER === '200') {

            // ✅ CORRECT: Delete from the passed array parameter
            array.splice(index, 1);

            Swal.fire({
              title: 'Deleted',
              text: res.MSG || res.MESSAGE || 'Record deleted successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            });

          } else {
            Swal.fire({
              title: 'Failed',
              text: res?.MSG || res?.MESSAGE || 'Delete failed',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          console.error('Delete Error:', err);
          Swal.fire({
            title: 'Error',
            text: err?.error?.MESSAGE || 'Something went wrong while deleting',
            icon: 'error'
          });
        }
      });
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

  fetchPlantCodeList(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res && res[0]?.PLANT) {
          this.PlantCodeList = res[0].PLANT;
          this.spinner.hide();
        } else {
          Swal.fire("No Plant Found", "", "warning");
        }
      },
      error => {
        this.spinner.hide();
      }
    );
  }



  fetchTransporter(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res && res.length > 0 && res[0].VEND_CODE) {
          console.log("✅ Transporter Data Fetched:", res[0].VEND_CODE);

          // ONLY transporter list
          this.VendorCodeList = res[0].VEND_CODE;

          this.spinner.hide();
        } else {
          Swal.fire("No Transporter Found", "", "warning");
          this.spinner.hide();
        }
      },
      error => {
        console.error("❌ Transporter Fetch Error:", error);
        this.spinner.hide();
      }
    );
  }

  // onFilterPlantChange(): void {
  //   const plantObj = this.PlantCodeList.find(item => item.PLANT_TEXT === this.filterPlant);  // ✅ Changed

  //   if (plantObj) {
  //     this.filterDivision = plantObj.DIVISION;
  //   } else {
  //     this.filterDivision = '';
  //   }
  //   this.cd.detectChanges();
  // }

  // onFilterDivisionChange(): void {
  //   const plantObj = this.PlantCodeList.find(item => item.DIVISION === this.filterDivision);

  //   if (plantObj) {
  //     this.filterPlant = plantObj.PLANT_TEXT;  // ✅ Set full text
  //   } else {
  //     this.filterPlant = '';
  //   }
  //   this.cd.detectChanges();
  // }

  onFilterSapTypeChange(): void {
    // Reset all filter fields
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';

    // Clear filtered data and results
    this.filteredData = [];
    this.filterApplied = false;

    this.cd.detectChanges();
  }
  applyFilter() {
    if (!this.filterFromDate || !this.filterToDate) {
      Swal.fire('Warning', 'Please select From Date and To Date', 'warning');
      return;
    }

    this.filterApplied = false;

    const payload = {
      GLOBAL: 'INSURANCE CLAIM STATUS',
      ZUSER: this.loggedInUser,
      DATE_FROM: this.filterFromDate,
      DATE_TO: this.filterToDate,
      PLANT: this.filterPlant || '',
      DIVISION: this.filterDivision || '',
      TRANSPORTER: this.filterTransporter || '',
      VEHICLE_TYPE: this.filterVehicleType || '',
      STATUS: this.filterStatus || ''
    };

    this.spinner.show();

    let apiCall;

    if (this.filterSapType === 'SAP') {
      apiCall = this.service.fetchOrderInfoFiltered(payload);
    } else if (this.filterSapType === 'Non-SAP') {
      apiCall = this.service.fetchGlobalFilteredNonSap(payload);
    } else {
      this.spinner.hide();
      Swal.fire('Error', 'Invalid SAP Type selected', 'error');
      return;
    }

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        /** 🔴 NO DATA FOUND HANDLING */
        if (res?.STATUS === 'FALSE') {
          this.InsurancetrackingHeader = [];
          this.InsurancetrackingItems = [];
          this.dispatchData = [];

          Swal.fire({
            icon: 'info',
            title: 'No Data Found',
            text: res.MSG || 'No records available for selected filters'
          });
          return;
        }

        this.transitResponse = res;
        this.filterApplied = true;

        /** 🟢 DATA FOUND */
        if (this.filterStatus === 'Completed') {
          // ✅ Store header and items separately
          this.InsurancetrackingHeader = res?.HEADER || [];
          this.InsurancetrackingItems = res?.ITEMS || [];
          this.dispatchData = [];

          const headerCount = this.InsurancetrackingHeader.length;
          const itemsCount = this.InsurancetrackingItems.length;

          Swal.fire('Success', `Headers: ${headerCount}, Items: ${itemsCount}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          let records: any[] = [];
          if (Array.isArray(res)) records = res;
          else if (res?.HEADER) records = res.HEADER;
          else if (res?.DATA) records = res.DATA;

          this.dispatchData = records;
          this.InsurancetrackingHeader = [];
          this.InsurancetrackingItems = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.InsurancetrackingHeader = [];
          this.InsurancetrackingItems = [];
          this.dispatchData = [];
          Swal.fire('Info', 'Please select valid status', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Filter Error:', err);
        Swal.fire('Error', 'Failed to fetch data', 'error');
      }
    });
  }

  clearFilter() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filteredData = [];
    this.filterApplied = false;

  }
  downloadExcel() {
    // 1️⃣ Determine data source based on status
    let exportSource: any[] = [];
    let fileName = '';

    if (this.filterStatus === 'Completed') {
      const combinedData: any[] = [];

      this.InsurancetrackingItems.forEach(item => {
        const header = this.InsurancetrackingHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;

      fileName = this.filterSapType === 'SAP' ? 'InsuranceClaimTracking_Completed_SAP.xlsx' : 'InsuranceClaimTracking_Completed_NonSAP.xlsx';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.filterSapType === 'SAP' ? 'Dispatch_Pending_SAP.xlsx' : 'Dispatch_Pending_NonSAP.xlsx';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ Check if data is available
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    // 3️⃣ Map data for Excel
    let exportData: any[] = [];

    if (this.filterStatus === 'Completed') {
      exportData = exportSource.map(record => ({
        // 🔹 COMMON

        'Map ID': record.ZMAPID || '',
        'REFNO': record.ZREFNO || '',
        'Invoice No': record.ZINV_NO || '',
        'ODN Number': record.ZODN_NO || '',
        'SO Number': record.ZSO_NO || '',
        'Fiscal Year': record.ZFI || '',

        // 🔹 HEADER ITEMS (same as Header Items table)
        'Reported Date': record.ZREP_DATE || '',
        'Claim Reference': record.ZCLAIM_REF || '',
        'Invoice Date': record.ZINV_DATE || '',
        'Invoice Base Value': record.ZINV_BV || '',
        'Loss Declared': record.ZLOSS_DCL || '',
        'Claim Received': record.ZCLM_RF || '',
        'Salvage Value': record.ZSOL_VAL || '',
        'Customer': record.ZCUSTOMER || '',
        'Location': record.ZLOCATION || '',
        'Damage Remarks': record.ZDAMAGE_RMK || '',
        'Claim Info Sent': record.ZCLM_INF || '',
        'Claim Status': record.ZCLM_ST || '',
        'Claim Document Status': record.ZCLM_DOC_ST || '',
        'Courier Details': record.ZCOURIER_DET || '',
        'Payment Status': record.ZPAY_ST || '',
        'Payment Info': record.ZPAY_INFO || '',
        'UTR': record.ZUTR || '',
        'Claim Settlement Date': record.ZCLM_SET_DT
          ? new Date(record.ZCLM_SET_DT).toLocaleDateString('en-GB')
          : '',
        'Sale Person': record.ZSALE_PERSON || '',
        'Plant': record.ZPLANT || '',
        'Division': record.ZDIVISION || '',
        'Created Date': record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Vehicle Type': record.ZVEH_TYPE || '',

        // 🔹 LINE ITEMS (same as Line Items table)
        'Vehicle Line': record.ZVEH_LINE || '',
        'Vehicle Type (Line)': record.ZVEHICLE || '',
        'Vehicle Number': record.ZTRUCK_NO || '',
        'AH': record.ZAH || '',
        'No of Sets': record.ZNO_SETS || '',
        'LR No': record.ZLRNO || '',
        'Work Order Number': record.ZWORK_ORDER || '',
        'Transporter': record.ZTRANSPORTER || '',
        'Bill No': record.ZBILLNO || ''
      }));
    } else if (this.filterStatus === 'Pending') {
      exportData = exportSource.map(record => ({
        'Reference No': record.ZREFNO || '',
        // 'Line No': record.ZLINE_NO || '',
        'Date': record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        'Plant': record.ZWERKS || '',
        'Division': record.ZDIVISION || '',
        'Vehicle Type': record.ZVEH_TYPE || '',
        'No. of Trucks': record.ZNO_TRUCKS || '',
        'Work Order': record.ZWORK_ORDER || '',
        'Vendor Code': record.ZVENDOR_CD || '',
        'Transporter': record.ZTRANSPORTER || '',
        'No. of LRs': record.ZNO_LRS || '',
        'LR Number': record.ZLR_NO || '',
        'Loading Point': record.ZLOAD_PT || '',
        'Unloading Point': record.ZUNLOAD_PT || ''
      }));
    }

    // 4️⃣ Create Excel sheet and workbook
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');

    // 5️⃣ Set auto column width
    const colWidths = Object.keys(exportData[0]).map(key => ({ wch: Math.max(key.length + 5, 18) }));
    ws['!cols'] = colWidths;

    // 6️⃣ Write file
    XLSX.writeFile(wb, fileName);

    Swal.fire('Success', `Excel file downloaded: ${fileName}`, 'success');
  }

  downloadPDF() {
    // 1️⃣ Determine data source based on status
    let exportSource: any[] = [];
    let fileName = '';
    let reportTitle = '';

    if (this.filterStatus === 'Completed') {
      const combinedData: any[] = [];

      this.InsurancetrackingItems.forEach(item => {
        const header = this.InsurancetrackingHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;

      fileName = this.filterSapType === 'SAP' ? 'InsuranceClaimTracking_Completed_SAP.pdf' : 'InsuranceClaimTracking_Completed_NonSAP.pdf';
      reportTitle = 'Insurance Claim Tracking Records (Completed)';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP' ? 'Dispatch_Pending_SAP.pdf' : 'Dispatch_Pending_NonSAP.pdf';
      reportTitle = 'Dispatch Records (Pending)';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ Check if data is available
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    const doc = new (jsPDF as any).default({
      orientation: 'landscape',
      unit: 'mm',
      format: [420, 297] // ✅ A2 Landscape (WIDE)
    });


    /* ===== PDF HEADING ===== */
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, {
      align: 'center'
    });

    /* Optional subtitle */
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      18,
      { align: 'center' }
    );

    let headers: any[] = [];
    let data: any[] = [];

    // 3️⃣ Generate headers and data based on status
    if (this.filterStatus === 'Completed') {
      headers = [[
        'SI.No',
        'Map ID',
        'REFNO',
        'Invoice No',
        'ODN Number',
        'SO Number',
        'Fiscal Year',
        'Reported Date',
        'Claim Reference',
        'Invoice Date',
        'Invoice Base Value',
        'Loss Declared',
        'Claim Received',
        'Salvage Value',
        'Customer',
        'Location',
        'Damage Remarks',
        'Claim Info Sent',
        'Claim Status',
        'Claim Document Status',
        'Courier Details',
        'Payment Status',
        'Payment Info',
        'UTR',
        'Claim Settlement Date',
        'Sale Person',
        'Plant',
        'Division',
        'Created Date',
        'Vehicle Type',

        // LINE ITEMS

        'Vehicle Line',
        'Vehicle Type (Line)',
        'Vehicle Number',
        'AH',
        'No of Sets',
        'LR No',
        'Work Order',
        'Transporter',
        'Bill No'

      ]];


      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZMAPID || '',
        record.ZREFNO || '',
        record.ZINV_NO || '',
        record.ZODN_NO || '',
        record.ZSO_NO || '',
        record.ZFI || '',
        record.ZREP_DATE || '',
        record.ZCLAIM_REF || '',
        record.ZINV_DATE || '',
        record.ZINV_BV || '',
        record.ZLOSS_DCL || '',
        record.ZCLM_RF || '',
        record.ZSOL_VAL || '',
        record.ZCUSTOMER || '',
        record.ZLOCATION || '',
        record.ZDAMAGE_RMK || '',
        record.ZCLM_INF || '',
        record.ZCLM_ST || '',
        record.ZCLM_DOC_ST || '',
        record.ZCOURIER_DET || '',
        record.ZPAY_ST || '',
        record.ZPAY_INFO || '',
        record.ZUTR || '',
        record.ZCLM_SET_DT
          ? new Date(record.ZCLM_SET_DT).toLocaleDateString('en-GB')
          : '',
        record.ZSALE_PERSON || '',
        record.ZPLANT || '',
        record.ZDIVISION || '',
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        record.ZVEH_TYPE || '',

        // LINE ITEMS

        record.ZVEH_LINE || '',
        record.ZVEHICLE || '',
        record.ZTRUCK_NO || '',
        record.ZAH || '',
        record.ZNO_SETS || '',
        record.ZLRNO || '',
        record.ZWORK_ORDER || '',
        record.ZTRANSPORTER || '',
        record.ZBILLNO || ''
      ]));
    }
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: {
        fontSize: 6,
        cellPadding: 1.5
      },
      headStyles: {
        fillColor: [52, 152, 219],
        fontStyle: 'bold',
        fontSize: 6
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      // columnStyles: {
      //   0: { cellWidth: 8 },  
      //   1: { cellWidth: 12 }, 
      //   2: { cellWidth: 12 }, 
      //   3: { cellWidth: 10 }, 
      //   4: { cellWidth: 12 }, 
      // },
      theme: 'grid'
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  }
  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'INSURANCE CLAIM STATUS'
    };

    this.service.OutwardCountGlobalWithSap(payload).subscribe(
      (response: any) => {
        this.pendingCount = response.ZPEND_CNT || 0;
        this.completedCount = response.ZCONF_CNT || 0;
        this.casesCount = response.ZCASE_REP || 0;
      },
      (error) => {
        console.error('Error fetching counts:', error);
        this.pendingCount = 0;
        this.completedCount = 0;
        this.casesCount = 0;

      }
    );
  }

  refreshScreen() {


    // Reset order type and SAP type
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isUpdateMode = false;
    this.isEditMode = false;

    // Reset previous state trackers
    this.previousOrderType = null;
    this.previousSapType = null;

    // Reset invoice/PO numbers
    this.invoicenumber = '';
    this.ponumber = '';

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.dropdownOpen = false;

    // Reset table display flags
    this.showTable = false;
    this.ShowHeaderForm = false;
    this.SavedDataShow = false;
    this.headerData = null;
    this.itemsList = [];

    // Reset filter fields
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterSapType = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filteredData = [];
    this.filterApplied = false;

    // Reset data arrays
    this.InsurancetrackingHeader = [];
    this.InsurancetrackingItems = [];
    this.dispatchData = [];
    this.selectedItems = [];
    this.InsuranceClaimTrackingData = [];

    // Reset transit response
    this.transitResponse = {};

    // Reset counts
    this.pendingCount = 0;
    this.completedCount = 0;
    this.casesCount = 0;

    // Reset checkbox state
    this.isAllSelected = false;

    // Reset Header Form
    this.HeaderForm.reset();





    // Show success message
    Swal.fire({
      text: 'Screen refreshed successfully',
      icon: 'success',
      confirmButtonText: 'Ok',
      timer: 4000,

    });

    // Trigger change detection
    this.cd.detectChanges();
  }

  onPaymentStatusChange(): void {
    const paymentStatus = this.HeaderForm.get('PAY_ST')?.value;

    if (paymentStatus === 'Pending') {
      // Auto-fill Payment Info and UTR with 'Pending'
      this.HeaderForm.patchValue({
        PAY_INFO: 'Pending',
        UTR: 'Pending'
      });


    } else if (paymentStatus === 'Settled') {
      // Clear the fields and enable manual entry
      this.HeaderForm.patchValue({
        PAY_INFO: '',
        UTR: ''
      });

      // Enable these fields for manual entry
      this.HeaderForm.get('PAY_INFO')?.enable();
      this.HeaderForm.get('UTR')?.enable();
    }
  }


  onFileChange(event: any, fieldName: string) {

    const file = event.target.files[0];

    // reset errors
    this.supportingDocError = false;
    this.approveDocError = false;

    if (!file) {
      this.HeaderForm.get(fieldName)?.setValue(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {

      if (fieldName === 'SupportingDocument') {
        this.supportingDocError = true;
      }

      if (fieldName === 'ApproveDocument') {
        this.approveDocError = true;
      }

      this.HeaderForm.get(fieldName)?.setValue(null);
      event.target.value = '';
      return;
    }

    this.HeaderForm.get(fieldName)?.setValue(file);
  }
}
