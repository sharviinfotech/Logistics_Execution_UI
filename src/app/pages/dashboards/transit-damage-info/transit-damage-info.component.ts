import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
  ShowHeaderForm = false;
  SavedDataShow = false;
  headerData: any = null;
  itemsList: any[] = [];
  showForm = false;
  isEditMode = false;
  isAllSelected: boolean = false;


  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  PlantCodeList: any[] = [];
  TransitDamageInfoHeader: any[] = [];  // ✅ Add this
  TransitDamageInfoItems: any[] = [];   // ✅ Add this
  transitResponse: any = {};
  VendorCodeList: any[] = [];
  mainMode: string = 'creation'; // Default to creation mode
  fullReferenceData: any[] = [];

  pendingCount: number = 0;
  completedCount: number = 0;
  casesCount: number = 0;



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
    { key: "sales_person", label: 'Sales Person' },
    { key: "location", label: 'Location' },
    { key: "vehicle_no", label: 'Vehicle No' },
    { key: "freight_billno", label: 'Freight Bill No' },
    { key: "product", label: 'Product' },
    { key: "route", label: 'Route' },
  ];
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

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
  TransitdamageInfoData: any[] = [];
  filterSapType: string = '';
  invoiceF4List: string[] = [];
  

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.buildHeaderForm();
    this.buildItemForm();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  buildHeaderForm() {
    this.HeaderForm = this.fb.group({
      VBELN: ['', Validators.required],
      INV_NO: [''],
      INV_DATE: ['', Validators.required],
      FSR_RPT_DT: [''],
      BASIC_VALUE: [''],
      INC_DATE: [''],
      CUSTOMER: ['', Validators.required],
      CONSIGN_NAME: ['', Validators.required],
      DAMAGE_RMK: [''],
      SETTLEMENT: ['', Validators.required],
      CLOSING_DT: [''],
      IMAGES: [''],
      FSRREPORT: [''],
      FIRREPORT: [''],
      COF: [''],
      ODN_NO: [''],
      SONO: [''],
      LINE_NO: [''],
      SALE_PERSON: [''],
      LOCATION: [''],
      ROUTE: [''],
      REFNO: [''],
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
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      lineNumber: ['']
    });
  }

  addItemRow() {
    const row = this.fb.group({
      selected: [false],
      ZMAPID: [''],
      ZLINE_NO: [''],
      INV_NO: [''],
      POSNR: [''],
      VEH_LINE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      TRANSPORTER: [''],
      REFNO: [''],
      WORK_ORDER: [''],
      PRODUCT: [''],
      BILLNO: [''],
    });

    this.items.push(row);
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
    this.SavedDataShow = false; // ✅ Added

    // ✅ Don't hide forms if Non-SAP is selected
    if (this.sapType !== 'Non-SAP') {
      this.ShowHeaderForm = false;
      this.showTable = false;
      this.showForm = false;
    }
  }

  onOrderTypeSelection() {

    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = null;
      this.previousSapType = null;
      // ✅ Clear invoice/PO numbers when order type changes
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

  resetConditionalFields(): void {
    // Don't reset these flags if switching to Non-SAP
    if (this.sapType !== 'Non-SAP') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      
      this.showForm = false;
      this.searchOptionsList = [];
    }

    // ✅ Clear all input fields and data
    this.invoicenumber = '';
    this.ponumber = '';
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
     this.invoiceF4List = [];
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
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : '',
      LINE_NO: values.lineNumber || ''

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

  onchangeMAPID(index: number) {
    const rowForm = this.items.at(index) as FormGroup;
    const selectedMapId = rowForm.get('ZMAPID')?.value;
    console.log("Selected MAPID:", selectedMapId);

    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);
    console.log("Selected MAPID object:", selectedObj);

    if (selectedObj) {
      rowForm.patchValue({
        REFNO: selectedObj.referenceNumber || "",
        WORK_ORDER: selectedObj.workOrderNumber || "",
        LR_NO: selectedObj.lrNumber || "",
        TRANSPORTER: selectedObj.transporter || "",
        ZMAPID: selectedObj.MAPID || "",
        ZLINE_NO: selectedObj.lineNumber ?? null
      });
    }
    console.log("Updated items form:", this.items.value);
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;

    if (checkbox.checked) {
      const exists = this.selectedItems.some(
        (item) =>
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
        (item) =>
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

  const selectedMapIds = [...new Set(this.selectedItems.map(item => item.MAPID))];

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
      (item) =>
        item.MAPID === rowValue.MAPID &&
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter &&
         item.lineNumber === rowValue.lineNumber 
    );
  }

  onSearchTypeChange(): void {
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;
    console.log('🔄 Search type changed. Data reset.');
  }

  // Search functionality
  // onSearchReference() {
  //   if (!this.searchReference?.trim()) {
  //     Swal.fire('Please enter a value', '', 'warning');
  //     return;
  //   }
  //   this.SavedDataShow = false;
  //   this.ShowHeaderForm = false;


  //   this.showTable = false;
  //   this.showForm = false;


  //   if (!this.selectedType) {
  //     Swal.fire('Please select a search type', '', 'info');
  //     return;
  //   }

  //   let payload1: any = {
  //     "global": "TRANSIT DAMAGE INFO",
  //     "data": {
  //       "REF_NO": "",
  //       "INV_NO": "",
  //       "SO_NO": "",
  //       "TRANSPORTER": "",
  //       "LR_NO": "",
  //       "WORKORDER_NO": "",
  //       "SALES_PERSON": "",
  //       "LOCATION": "",
  //       "ODN_NO": "",
  //       "VEHICLE_NO": "",
  //       "FREIGHT_BILLNO": "",
  //       "PRODUCT": "",
  //       "ROUTE": "",
  //       "NATURE_DAMAGE": "",
  //       "CLAIM_STATUS": ""
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

  //       if (res.NUMBER == "100" && res.STATUS == "FALSE") {
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
  //         console.log("HEADER PATCH", header)
  //         this.HeaderForm.patchValue({
  //           INV_NO: header.ZINV_NO,
  //           INV_DATE: header.ZINV_DATE,
  //           FSR_RPT_DT: header.ZFSR_RPT_DT,
  //           BASIC_VALUE: header.ZBASIC_VALUE,
  //           INC_DATE: header.ZINC_DATE,
  //           CUSTOMER: header.ZCUSTOMER,
  //           CONSIGN_NAME: header.ZCONSIGN_NAME,
  //           DAMAGE_RMK: header.ZDAMAGE_RMK,
  //           SETTLEMENT: header.ZSETTLEMENT,
  //           CLOSING_DT: header.ZCLOSING_DT,
  //           IMAGES: header.ZIMAGES,
  //           ODN_NO: header.ODN_NO,
  //           SONO: header.SONO,
  //           SALE_PERSON: header.ZSALE_PERSON,
  //           LOCATION: header.ZLOCATION,
  //           ROUTE: header.ZROUTE,
  //           REFNO: header.ZREFNO,
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
        "PRODUCT": "",
        "ROUTE": "",
        "NATURE_DAMAGE": "",
        "CLAIM_STATUS": ""
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

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      this.showForm = false;
      this.SavedDataShow = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    if (this.sapType === 'SAP') {
      this.fetchInvoiceDetails();
    } else if (this.sapType === 'Non-SAP') {
      this.fetchInvoiceDetailsNonSap();
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

         Swal.fire('Success', 'Invoice Details fetched successfully!', 'success');

        const header = res[0].HEADER;
        const items = res[0].ITEM;
        // ✅ Hide search results when showing invoice data
        this.SavedDataShow = false;
        this.searchOptionsList = [];
        this.showTable = false;


        this.ShowHeaderForm = true;
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
          IMAGES: header.IMAGES,
          ODN_NO: header.ODN_NO,
          SONO: header.SONO,
          SALE_PERSON: header.SALE_PERSON,
          LOCATION: header.LOCATION,
          ROUTE: header.ROUTE,
          REFNO: header.REFNO,
        });

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            selected: [false],
            ZMAPID: [x.ZMAPID || x.MAPID || ''],
            ZLINE_NO: [x.LINE_NO || x.ZLINE_NO || ''],
            INV_NO: [x.INV_NO],
            REFNO: [x.REFNO],
            BILLNO: [x.BILLNO],
            PRODUCT: [x.PRODUCT],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER],
            WORK_ORDER: [x.WORK_ORDER]
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


    const selectedItems = this.items.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }) => rest);

    if (selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one row', 'warning');
      return;
    }


    const invoiceNo =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!invoiceNo) {
      Swal.fire('Warning', 'Invoice / PO missing', 'warning');
      return;
    }

    /* 3️⃣ HEADER preparation */
    const headerValue: any = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = invoiceNo;

    headerValue.REFNO = selectedItems[0]?.REFNO || null;
    headerValue.LINE_NO = selectedItems[0]?.ZLINE_NO || null;
    headerValue.INC_DATE = headerValue.INC_DATE || null;
    headerValue.CLOSING_DT = headerValue.CLOSING_DT || null;
    headerValue.ROUTE = headerValue.ROUTE ||
      selectedItems.forEach((row: any) => {
        row.INV_NO = invoiceNo;
        row.REFNO = headerValue.REFNO;
      });


    const payload = {
      HEADER: headerValue,
      ITEM: selectedItems
    };

    console.log('✅ FINAL SAVE PAYLOAD', payload);

    /* 6️⃣ API Call */
    this.spinner.show();
    this.service.TransitDamageInfoSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === 'TRUE') {
          Swal.fire({
            icon: 'success',
            text: 'Data Saved Successfully',
            timer: 1200,
            showConfirmButton: false,
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
          Swal.fire('Save Failed', res?.MESSAGE || '', 'warning');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      }
    });
  }

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

  //   this.service.fetchinvoicelistnonsapwosp(payload).subscribe({
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
  //         INV_DATE: header.INV_DATE,
  //         FSR_RPT_DT: header.FSR_RPT_DT,
  //         BASIC_VALUE: header.BASIC_VALUE,
  //         INC_DATE: header.INC_DATE,
  //         CUSTOMER: header.CUSTOMER,
  //         CONSIGN_NAME: header.CONSIGN_NAME,
  //         DAMAGE_RMK: header.DAMAGE_RMK,
  //         SETTLEMENT: header.SETTLEMENT,
  //         CLOSING_DT: header.CLOSING_DT,
  //         IMAGES: header.IMAGES
  //       });

  //       this.items.clear();

  //       items.forEach((x: any) => {
  //         this.items.push(this.fb.group({
  //           selected: [false],
  //           ZMAPID: [x.ZMAPID],
  //           REFNO: [x.REFNO],
  //           INV_NO: [dcRefNo],
  //           POSNR: [x.POSNR],
  //           VEH_LINE: [x.VEH_LINE],
  //           TRUCK_NO: [x.TRUCK_NO],
  //           LR_NO: [x.LR_NO],
  //           TRANSPORTER: [x.TRANSPORTER],
  //           BILLNO: [x.BILLNO],
  //           PRODUCT: [x.PRODUCT],
  //           WORK_ORDER: [x.WORK_ORDER]
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

   
    const dcRefNo = this.HeaderForm.get('VBELN')?.value;

    if (!dcRefNo || !dcRefNo.toString().trim()) {
      Swal.fire('Warning', 'Please select DC Reference Number', 'warning');
      return;
    }

    const payload = {
      VBELN: dcRefNo.toString().trim()
    };

    console.log('📤 Non-SAP Fetch Payload:', payload);

    this.spinner.show();

    this.service.TransitDamageinfofetchNonsap(payload).subscribe({
      next: (res: any[]) => {
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
          INV_NO: dcRefNo,
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

        this.items.clear();

        items.forEach((x: any) => {
          this.items.push(this.fb.group({
            selected: [false],
            ZMAPID: [x.ZMAPID || x.MAPID || ''],
            REFNO: [x.REFNO],
            ZLINE_NO: [x.LINE_NO || x.ZLINE_NO || ''],
            INV_NO: [dcRefNo],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER],
            BILLNO: [x.BILLNO],
            PRODUCT: [x.PRODUCT],
            WORK_ORDER: [x.WORK_ORDER]

          }));
        });

      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching Non-SAP data', '', 'error');
      }
    });
  }



  onSaveNonSap(action: 'stay' | 'next' | 'previous' = 'stay') {

    if (this.selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one reference row', 'warning');
      return;
    }

    const invoiceNo =
      this.HeaderForm.get('INV_NO')?.value?.toString().trim() || null;

    const refNo =
      this.selectedItems.length > 0
        ? this.selectedItems[0].referenceNumber
        : null;

    /* HEADER */
    const headerValue: any = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = invoiceNo;
    headerValue.REFNO = refNo;
    headerValue.LINE_NO = this.selectedItems[0]?.lineNumber || null;

    /* ITEMS */
    const itemsPayload = this.items.controls
      .filter(ctrl => ctrl.value.selected === true)
      .map(ctrl => ({
        ...ctrl.value,
        INV_NO: invoiceNo,
        REFNO: refNo
      }));

    const payload = {
      HEADER: headerValue,
      ITEM: itemsPayload
    };

    console.log('✅ FIXED Non-SAP SAVE PAYLOAD', payload);

    this.spinner.show();
    this.service.withoutsapSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.STATUS === true || res?.STATUS === 'TRUE') {
          Swal.fire('Success', 'Data Saved Successfully', 'success');
          this.resetForms();
        } else {
          Swal.fire('Save Failed', res?.MESSAGE || '', 'warning');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
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
  updateSearchRow(headerRow: any, itemRows: any[]): void {
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
      if (!headerRow.ZREFNO) {
        Swal.fire('Error', 'Missing mandatory ZREFNO in header', 'error');
        return;
      }


      //  const invalidItems = itemRows.filter(item => !item.ZREFNO);
      //  if (invalidItems.length > 0) {
      //    Swal.fire('Error', 'Missing mandatory keys in items (ZREFNO/ZLINE_NO)', 'error');
      //    return;
      //  }

      const headerPayload: any = {
        ZREFNO: headerRow.ZREFNO || null,
        ZLINE_NO: headerRow.ZLINE_NO || null,
        ZINV_NO: headerRow.ZINV_NO || null,
        ZODN_NO: headerRow.ZODN_NO || null,
        ZSONO: headerRow.ZSONO || null,
        ZINV_DATE: headerRow.ZINV_DATE || null,
        ZFSR_RPT_DT: headerRow.ZFSR_RPT_DT || null,
        ZBASIC_VALUE: headerRow.ZBASIC_VALUE || null,
        ZINC_DATE: headerRow.ZINC_DATE || null,
        ZCUSTOMER: headerRow.ZCUSTOMER || null,
        ZCONSIGN_NAME: headerRow.ZCONSIGN_NAME || null,
        ZDAMAGE_RMK: headerRow.ZDAMAGE_RMK || null,
        ZSETTLEMENT: headerRow.ZSETTLEMENT || null,
        ZCLOSING_DT: headerRow.ZCLOSING_DT || null,
        ZIMAGES: headerRow.ZIMAGES || null,
        ZSALE_PERSON: headerRow.ZSALE_PERSON || null,
        ZLOCATION: headerRow.ZLOCATION || null,
        ZROUTE: headerRow.ZROUTE || null,
        ZPLANT: headerRow.ZPLANT || null,
        ZDIVISION: headerRow.ZDIVISION || null,
        ZVEH_TYPE: headerRow.ZVEH_TYPE || null,
        ZCREATED_DT: headerRow.ZCREATED_DT || null
      };

      /* ---------------- ITEM PAYLOAD ---------------- */
      const itemPayload = itemRows.map(item => ({
        ZMAPID: item.ZMAPID || null,
        ZINV_NO: item.ZINV_NO || null,
        ZREFNO: String(item.ZREFNO),
        ZLINE_NO: String(item.ZLINE_NO),
        ZPOSNR: item.ZPOSNR || item.POSNR || null,
        ZVEH_LINE: item.ZVEH_LINE || null,
        ZTRUCK_NO: item.ZTRUCK_NO || null,
        ZLR_NO: item.ZLRNO || null,
        ZTRANSPORTER: item.ZTRANSPORTER || null,
        ZWORK_ORDER: item.ZWORK_ORDER || null,
        ZBILLNO: item.ZBILLNO || null,
        ZPRODUCT: item.ZPRODUCT || null
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
          ? this.service.TransitDamageInfoChangeWithSap(payload)
          : this.service.TransitDamageInfoChangeWithoutSap(payload);

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

  // ✅ Simple delete method - works for both header and line items
  deleteRow(row: any): void {

    // Check if row exists
    if (!row) {
      console.error('Row not found');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (!result.isConfirmed) return;

      // Prepare payload
      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO || ''
          }
        ]
      };

      // Call API based on SAP type
      const apiCall = this.sapType === 'SAP'
        ? this.service.TransitDamageInfoDeleteWithSap(payload)
        : this.service.TransitDamageInfoDeleteWithoutSap(payload);

      apiCall.subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE' || res?.STATUS === true || res?.NUMBER === '200') {

            // ✅ Remove from itemsList if it exists there
            const index = this.itemsList.findIndex(item =>
              item.ZREFNO === row.ZREFNO &&
              item.ZINV_NO === row.ZINV_NO &&
              item.ZLINE_NO === row.ZLINE_NO
            );

            if (index !== -1) {
              this.itemsList.splice(index, 1);
            }

            // ✅ Clear headerData if deleting header
            if (this.headerData?.ZREFNO === row.ZREFNO &&
              this.headerData?.ZINV_NO === row.ZINV_NO) {
              this.headerData = null;
              this.showTable = false;
            }

            Swal.fire({
              title: 'Deleted',
              text: 'Record deleted successfully',
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
            text: 'Something went wrong while deleting',
            icon: 'error'
          });
        }
      });
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
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

  onFilterPlantChange(): void {
    const plantObj = this.PlantCodeList.find(item => item.PLANT_TEXT === this.filterPlant);  // ✅ Changed

    if (plantObj) {
      this.filterDivision = plantObj.DIVISION;
    } else {
      this.filterDivision = '';
    }
    this.cd.detectChanges();
  }

  onFilterDivisionChange(): void {
    const plantObj = this.PlantCodeList.find(item => item.DIVISION === this.filterDivision);

    if (plantObj) {
      this.filterPlant = plantObj.PLANT_TEXT;  // ✅ Set full text
    } else {
      this.filterPlant = '';
    }
    this.cd.detectChanges();
  }

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
      GLOBAL: 'TRANSIT DAMAGE INFO',
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
          this.TransitDamageInfoHeader = [];
          this.TransitDamageInfoItems = [];
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
          this.TransitDamageInfoHeader = res?.HEADER || [];
          this.TransitDamageInfoItems = res?.ITEMS || [];
          this.dispatchData = [];

          const headerCount = this.TransitDamageInfoHeader.length;
          const itemsCount = this.TransitDamageInfoItems.length;

          Swal.fire('Success', `Headers: ${headerCount}, Items: ${itemsCount}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          let records: any[] = [];
          if (Array.isArray(res)) records = res;
          else if (res?.HEADER) records = res.HEADER;
          else if (res?.DATA) records = res.DATA;

          this.dispatchData = records;
          this.TransitDamageInfoHeader = [];
          this.TransitDamageInfoItems = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.TransitDamageInfoHeader = [];
          this.TransitDamageInfoItems = [];
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

      this.TransitDamageInfoItems.forEach(item => {
        const header = this.TransitDamageInfoHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;

      fileName = this.filterSapType === 'SAP' ? 'TransitdamageInfo_Completed_SAP.xlsx' : 'TransitdamageInfo_Completed_NonSAP.xlsx';
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
        'Map ID': record.ZMAPID || '',
        'REFNO': record.ZREFNO || '',
        'Invoice No': record.ZINV_NO || '',
        'ODN Number': record.ZODN_NO || '',
        'SO Number': record.ZSONO || '',

        // 🔹 HEADER ITEMS
        'Invoice Date': record.ZINV_DATE || '',
        'FSR Report Date': record.ZFSR_RPT_DT || '',
        'Invoice Base Value': record.ZBASIC_VALUE || '',
        'Incident Date': record.ZINC_DATE || '',
        'Customer': record.ZCUSTOMER || '',
        'Consign Name': record.ZCONSIGN_NAME || '',
        'Damage Remarks': record.ZDAMAGE_RMK || '',
        'Settlement': record.ZSETTLEMENT || '',
        'Closing Date': record.ZCLOSING_DT || '',
        'Images': record.ZIMAGES || '',
        'Sale Person': record.ZSALE_PERSON || '',
        'Location': record.ZLOCATION || '',
        'Route': record.ZROUTE || '',
        'Plant': record.ZPLANT || '',
        'Division': record.ZDIVISION || '',
        'Created Date': record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Vehicle Type': record.ZVEH_TYPE || '',

        // 🔹 LINE ITEMS

        'Vehicle Line': record.ZVEH_LINE || '',
        'Vehicle Number': record.ZTRUCK_NO || '',
        'LR No': record.ZLRNO || '',
        'Work Order Number': record.ZWORK_ORDER || '',
        'Transporter': record.ZTRANSPORTER || '',
        'Bill No': record.ZBILLNO || '',
        'Product': record.ZPRODUCT || ''
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

      exportSource = this.TransitdamageInfoData;
      // ✅ Combine Header and Items for export
      const combinedData: any[] = [];

      this.TransitDamageInfoItems.forEach(item => {
        const header = this.TransitDamageInfoHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;
      fileName = this.filterSapType === 'SAP' ? 'TransitdamageInfo_Completed_SAP.pdf' : 'TransitdamageInfo_Completed_NonSAP.pdf';
      reportTitle = 'Transit Info Records (Completed)';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.filterSapType === 'SAP' ? 'Dispatch_Pending_SAP.pdf' : 'Dispatch_Pending_NonSAP.pdf';
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
        'Invoice Date',
        'FSR Report Date',
        'Invoice Base Value',
        'Incident Date',
        'Customer',
        'Consign Name',
        'Damage Remarks',
        'Settlement',
        'Closing Date',
        'Images',
        'Sale Person',
        'Location',
        'Route',
        'Plant',
        'Division',
        'Created Date',
        'Vehicle Type',

        'Vehicle Line',
        'Vehicle Number',
        'LR No',
        'Work Order',
        'Transporter',
        'Bill No',
        'Product'
      ]];


      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZMAPID || '',
        record.ZREFNO || '',
        record.ZINV_NO || '',
        record.ZODN_NO || '',
        record.ZSONO || '',

        // 🔹 HEADER ITEMS
        record.ZINV_DATE || '',
        record.ZFSR_RPT_DT || '',
        record.ZBASIC_VALUE || '',
        record.ZINC_DATE || '',
        record.ZCUSTOMER || '',
        record.ZCONSIGN_NAME || '',
        record.ZDAMAGE_RMK || '',
        record.ZSETTLEMENT || '',
        record.ZCLOSING_DT || '',
        record.ZIMAGES || '',
        record.ZSALE_PERSON || '',
        record.ZLOCATION || '',
        record.ZROUTE || '',
        record.ZPLANT || '',
        record.ZDIVISION || '',
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        record.ZVEH_TYPE || '',

        // 🔹 LINE ITEMS

        record.ZVEH_LINE || '',
        record.ZTRUCK_NO || '',
        record.ZLRNO || '',
        record.ZWORK_ORDER || '',
        record.ZTRANSPORTER || '',
        record.ZBILLNO || '',
        record.ZPRODUCT || ''
      ]));

    } else if (this.filterStatus === 'Pending') {
      headers = [[
        'SI.No',
        'Reference No',
        'Line No',
        'Date',
        'Plant',
        'Division',
        'Vehicle Type',
        'No. of Trucks',
        'Work Order',
        'Vendor Code',
        'Transporter',
        'No. of LRs',
        'LR Number',
        'Loading Point',
        'Unloading Point',
        'No Of Invoices'
      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.ZLINE_NO || '',
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        record.ZWERKS || '',
        record.ZDIVISION || '',
        record.ZVEH_TYPE || '',
        record.ZNO_TRUCKS || '',
        record.ZWORK_ORDER || '',
        record.ZVENDOR_CD || '',
        record.ZTRANSPORTER || '',
        record.ZNO_LRS || '',
        record.ZLR_NO || '',
        record.ZLOAD_PT || '',
        record.ZUNLOAD_PT || '',
        record.ZNO_INVOICES || ''
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

  // Fetch counts from API
  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'TRANSIT DAMAGE INFO'
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
    // Reset main mode


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
    this.TransitDamageInfoHeader = [];
    this.TransitDamageInfoItems = [];
    this.dispatchData = [];
    this.selectedItems = [];
    this.TransitdamageInfoData = [];

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


}
