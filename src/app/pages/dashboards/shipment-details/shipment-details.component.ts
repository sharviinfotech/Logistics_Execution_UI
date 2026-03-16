import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from 'src/app/spinner.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.css']
})
export class ShipmentDetailsComponent implements OnInit {

  // Dropdown options
  productOptions = ['Batteries', 'Electronics', 'Fuze', 'Cement Poles and Piles', 'Raw Materials', 'Job Work Material', 'Machinery', 'Others'];
  batteryConditionOptions = ['Dry and discharge with solid electrolyte', 'Dry and discharge with Liquid electrolyte', 'Filled and discharged', 'Filled and charged', 'Filled and formed no free Acid', 'Lead acid batteries (Dry)', 'Lead acid batteries (Filled)'];
  insuranceScopeOptions = ['Buyer', 'Supplier'];

  // Form and variables
  ProductInfo!: FormGroup;
  isEditMode = false;
  showForm = false;
  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  PlantCodeList: any[] = [];


  invoicenumber: string = '';
  TypeofmaterialList: any = [];
  IncotermsList: any[] = [];
  isUpdateMode: boolean = false;
  isAllSelected: boolean = false;
  // Main mode selection
  mainMode: string = 'creation'; // Default to creation mode
  pendingCount: number = 0;
  completedCount: number = 0;

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

  // Filter mode properties
  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filterStatus: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;

  searchValue: string;
  VendorCodeList: any[] = [];
  ShipmentData: any[] = [];
  dispatchData: any[] = [];
  filterSapType: string = '';
  showOrderInfoTable = false;
  showDispatchTable = false;
  invoiceF4List: string[] = [];
  fullReferenceData: any[] = [];
  loggedInUser: string = '';
   plantList: any;
  divisionList: any;


  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      ZINCO: ['', Validators.required],
      ZINS_SCPOE: ['', Validators.required],
      ZKM: [null, [Validators.required, Validators.min(0)]],
      VBELN: [''],
      items: this.fb.array([this.createItemRow()]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
 const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
this.loggedInUser = userData.USER || '';
console.log("Logged in user:", this.loggedInUser);
 this.plantList = userData.PLANTS || [];

  // ✅ Divisions from login response
  this.divisionList = userData.DIV || [];

  console.log("Plants:", this.plantList);
  console.log("Divisions:", this.divisionList);
    this.fetchIncoterms();
    this.fetchTransporter();
    this.fetchPlantCodeList();

  }

  // Getter for Product Items FormArray
  get items(): FormArray {
    return this.ProductInfo.get('items') as FormArray;
  }

  // Getter for Reference Items FormArray
  get referenceItems(): FormArray {
    return this.ProductInfo.get('referenceItems') as FormArray;
  }

  // Create one product item row
  createItemRow(): FormGroup {
    return this.fb.group({
      selected: [false],
      ZMAPID: [''],
      ZPRODUCT: ['', Validators.required],
      MTBEZ: ['', Validators.required],
      MAKTX: ['', Validators.required],
      ZSETS: [null, [Validators.required, Validators.min(1)]],
      ZAH: [null, [Validators.required, Validators.min(0)]],
      ZSHIP_WT: [null, [Validators.required, Validators.min(0)]],
      ZBATCOND: [''],
      MANDT: [''],
      ZREFNO: [''],
      ZLINE_NO: [''],
      VBELN: [''],
      POSNR: [''],
      ZSO_NO: [''],
      ZODN_NO: [''],
      MTART: [''],
      ZINCO: [''],
      ZINS_SCPOE: [''],
      ZPIN_PLT: [''],
      ZPIN_STP: [''],
      ZKM: [''],

      ZWORK_ORDER: [''],
      ZLRNO: [''],
      ZTRANSPORTER: [''],

    });
  }



  // Create one reference row
  createReferenceRow(): FormGroup {
    return this.fb.group({
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      soNumber: [''],        // Sales Order Number
      odnNumber: [''],       // ODN Number
      materialType: [''],    // Material Type (MTART)
      plantCode: [''],       // Plant Code (ZPIN_PLT)
      shippingPoint: [''],
      lineNumber: ['']    // Shipping Point (ZPIN_STP)
    });
  }

  // Add / Remove product rows
  addRow() {
    this.items.push(this.createItemRow());
  }

  removeRow(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      alert('Cannot delete the last row.');
    }
  }

  resetForm() {
    this.ProductInfo.reset();
    this.items.clear();
    this.referenceItems.clear();
    this.items.push(this.createItemRow());
    this.referenceItems.push(this.createReferenceRow());
    this.showForm = false;
    this.ponumber = '';
    this.invoicenumber = '';
    this.sapType = '';
    this.orderType = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
    this.invoiceF4List = [];
  }

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }
    this.selectedType = '';
  this.searchReference = '';
  this.searchOptionsList = [];

    if (this.sapType === 'SAP') {
      this.showForm = false;
      this.ponumber = '';
      this.invoicenumber = '';
    } else {
      this.showForm = true;
      this.ponumber = '';
      this.invoicenumber = '';
    }
  }



  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  // Main mode change handler
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

    this.searchOptionsList = [];
    this.invoiceF4List = [];
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.invoiceF4List = [];
    this.ProductInfo.reset();
    this.items.clear();
    this.referenceItems.clear();
    this.items.push(this.createItemRow());
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
      global_scr: 'SHIPMENT DETAILS',
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

    // 🎯 CONDITION BASED API CALL
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
  //           MAPID: [d.MAPID],
  //           referenceNumber: [d.REF_NO || d.referenceNumber || ''],
  //           workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
  //           lrNumber: [d.LR_NO || d.lrNumber || ''],
  //           transporter: [d.TRANSPORTER || d.transporter || ''],
  //           soNumber: [d.SO_NO || d.soNumber || ''],        // Sales Order Number
  //           odnNumber: [d.ODN_NO || d.odnNumber || ''],     // ODN Number
  //           materialType: [d.MTART || d.materialType || ''], // Material Type
  //           plantCode: [d.PLANT_CODE || d.ZPIN_PLT || d.plantCode || ''],  // Plant Code
  //           shippingPoint: [d.SHIPPING_POINT || d.ZPIN_STP || d.shippingPoint || '']  // Shipping Point
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
     this.selectedItems = [];
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
            MAPID: [d.MAPID],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || ''],
            soNumber: [d.SO_NO || d.soNumber || ''],
            odnNumber: [d.ODN_NO || d.odnNumber || ''],
            materialType: [d.MTART || d.materialType || ''],
            plantCode: [d.PLANT_CODE || d.ZPIN_PLT || d.plantCode || ''],
            shippingPoint: [d.SHIPPING_POINT || d.ZPIN_STP || d.shippingPoint || ''],
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
    console.log("onchangeMAPID this.selectedItems",this.selectedItems,"selectedMapId",selectedMapId)
    const selectedObj = this.selectedItems.find(
      item => item.MAPID == selectedMapId
    );

    if (!selectedObj) return;

    rowForm.patchValue({
      // Reference linkage
      ZMAPID: selectedObj.MAPID ?? null,
      ZREFNO: selectedObj.referenceNumber ?? null,
      ZWORK_ORDER: selectedObj.workOrderNumber ?? null,
      ZLRNO: selectedObj.lrNumber ?? null,
      ZTRANSPORTER: selectedObj.transporter ?? null,
      ZLINE_NO: selectedObj.lineNumber ?? null

      // sunil commment due to facing issue these below on 04-02-2026
      // ✅ REQUIRED FOR NON-SAP SAVE
      // VBELN: selectedObj.invNumber ?? this.ProductInfo.get('VBELN')?.value ?? null,
      // POSNR: selectedObj.POSNR ?? null,
      // MTART: selectedObj.materialType ?? null,
      // ZSO_NO: selectedObj.soNumber ?? null,
      // ZODN_NO: selectedObj.odnNumber ?? null,
      // ZPIN_PLT: selectedObj.plantCode ?? null,
      // ZPIN_STP: selectedObj.shippingPoint ?? null
    });
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
          item.soNumber === rowValue.soNumber &&
          item.odnNumber === rowValue.odnNumber &&
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
            item.soNumber === rowValue.soNumber &&
            item.odnNumber === rowValue.odnNumber &&
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
    // No items selected, clear invoice list
    console.log('⚠️ No items selected, invoice list cleared');
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
        item.soNumber === rowValue.soNumber &&
        item.odnNumber === rowValue.odnNumber &&
         item.lineNumber === rowValue.lineNumber 
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

      "global": "SHIPMENT DETAILS",
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
          this.searchOptionsList = res.HEADER.map((item: any) => ({
            ...item,
            isEdit: false
          }));

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




  // Product checkbox methods
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
  onClickRow(){
    console.log("this.items.value",this.items.value)
  }

  getSelectedRows() {
    return this.items.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }

  // Fetch invoice details
  fetchInvoiceDetails() {
    if (this.sapType !== 'SAP') {
      alert('Please select "With SAP" first.');
      return;
    }

    const referenceNumber =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber?.trim()) {
      alert(
        `Please enter a valid ${this.orderType === 'Inward' ? 'PO' : 'Invoice'
        } Number`
      );
      return;
    }

    const payload = { INV_GET: referenceNumber.trim() };
    this.spinner.show();

    this.service.shipmentdetailsfetch(payload).subscribe({
      next: (res: any) => {
        // YOUR SAP RESPONSE IS ALWAYS ARRAY
        const result = Array.isArray(res) ? res : [];

        if (result.length === 0) {
          alert('No data found for this reference.');
          this.spinner.hide();
          return;
        }

        const firstItem = result[0];

        // Clear existing rows
        this.items.clear();

        // Patch top form (Product Info)
        this.ProductInfo.patchValue({
          ZINCO: firstItem.ZINCO || '',
          ZINS_SCPOE: firstItem.ZINS_SCPOE || '',
          ZKM: firstItem.ZKM ?? null,
          VBELN: firstItem.VBELN || ''
        });

        // Fill FormArray rows
        result.forEach((item: any) => {
          this.items.push(
            this.fb.group({
              selected: [false],
              ZPRODUCT: [item.ZPRODUCT || ''],
              MTBEZ: [item.MTBEZ || ''],
              MAKTX: [item.MAKTX || ''],
              ZSETS: [item.ZSETS || 0, [Validators.min(1)]],
              ZAH: [item.ZAH || 0],
              ZSHIP_WT: [item.ZSHIP_WT || 0],
              ZBATCOND: [item.ZBATCOND || ''],
              MANDT: [item.MANDT || ''],
              ZREFNO: [item.ZREFNO || ''],
              ZLINE_NO: [item.ZLINE_NO || ''],
              VBELN: [item.VBELN || ''],
              POSNR: [item.POSNR || ''],
              ZSO_NO: [item.ZSO_NO || ''],
              ZODN_NO: [item.ZODN_NO || ''],
              MTART: [item.MTART || ''],
              ZINCO: [item.ZINCO || ''],
              ZINS_SCPOE: [item.ZINS_SCPOE || ''],
              ZPIN_PLT: [item.ZPIN_PLT || ''],
              ZPIN_STP: [item.ZPIN_STP || ''],
              ZKM: [item.ZKM || ''],

              ZWORK_ORDER: [item.ZWORK_ORDER || ''],
              ZLRNO: [item.ZLRNO || ''],
              ZTRANSPORTER: [item.ZTRANSPORTER || ''],
              ZMAPID: [item.ZMAPID || 0]
            })
          );
        });

        this.showForm = true;
        Swal.fire('Success', 'Invoice details loaded successfully', 'success');
        this.searchOptionsList = [];
        this.spinner.hide();
      },

      error: (err) => {
        console.error('Error fetching data:', err);
        alert('Error fetching data from SAP.');
        this.spinner.hide();
      }
    });
  }


  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.searchOptionsList = [];
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.fetchInvoiceDetails();
  }



  // Save functionality
  saveShipmentOutward(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    const selectedRows = this.items.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }) => rest);

    console.log('🟦 selectedRows (raw):', selectedRows);

    if (selectedRows.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one product row to save.',
        icon: 'warning',
        timer: 3000,
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    // parent (common) fields
    const commonFields = {
      ZINCO: this.ProductInfo.get('ZINCO')?.value || '',
      ZINS_SCPOE: this.ProductInfo.get('ZINS_SCPOE')?.value || '',
      ZKM: this.ProductInfo.get('ZKM')?.value ?? 0,
      VBELN: this.ProductInfo.get('VBELN')?.value || ''
    };

    const finalPayload = selectedRows.map((row: any) => {
      const itemZins = (row.ZINS_SCPOE && String(row.ZINS_SCPOE).trim() !== '')
        ? row.ZINS_SCPOE
        : commonFields.ZINS_SCPOE;

      const itemZkm = (row.ZKM !== null && row.ZKM !== undefined && row.ZKM !== '')
        ? row.ZKM
        : commonFields.ZKM;

      const itemZinco = (row.ZINCO && String(row.ZINCO).trim() !== '')
        ? row.ZINCO
        : commonFields.ZINCO;

      const itemVBELN = (row.VBELN && String(row.VBELN).trim() !== '')
        ? row.VBELN
        : commonFields.VBELN;

      return {
        ...row,
        ZINS_SCPOE: itemZins,
        ZKM: itemZkm,
        ZINCO: itemZinco,
        VBELN: itemVBELN,
        ZSETS: row.ZSETS,
        ZAH: row.ZAH,
        ZSHIP_WT: row.ZSHIP_WT,
        ZUSER: this.loggedInUser,
        ZUSER_CH:'',
      };
    });

    console.log('📤 finalPayload (to send):', finalPayload);
    

    // ✅ SEND PAYLOAD DIRECTLY AS ARRAY (not wrapped in object)
    if (this.sapType === "SAP") {
      this.spinner.show();
      this.service.ShipmentOutwardSave(finalPayload).subscribe(  // ← Changed here
        (res: any) => {
          console.log("✅ SAP Save Response:", res);

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || res.MSG || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              if (action === 'next') {
                this.router.navigate(['/invoice-load-details']);
              } else if (action === 'previous') {
                this.router.navigate(['/order-info']);
              } else {
                this.resetForm();
              }
            });
            this.spinner.hide();
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || res.MSG || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
            this.spinner.hide();
          }
        },
        error => {
          console.error('❌ SAP Save Error:', error);
          this.spinner.hide();
          Swal.fire({
            title: 'Error',
            text: 'Internal Server Error. Please try again later.',
            icon: 'error',
          });
        }
      );
    } else {
      this.spinner.show();
      this.service.shipmentdetailsNonSapSave(finalPayload).subscribe(
        (res: any) => {
          console.log("✅ Non-SAP Save Response:", res);
          this.spinner.hide();

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || res.MSG || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              if (action === 'next') {
                this.router.navigate(['/invoice-load-details']);
              } else if (action === 'previous') {
                this.router.navigate(['/order-info']);
              } else {
                this.resetForm();
              }
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || res.MSG || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
            this.spinner.hide();
          }
        },
        error => {
          console.error('❌ Non-SAP Save Error:', error);
          this.spinner.hide();
          Swal.fire({
            title: 'Error',
            text: 'Internal Server Error. Please try again later.',
            icon: 'error',
          });
        }
      );
    }
  }

  editSearchRow(row: any): void {
    // Backup original data
    row._backup = { ...row };
    row.isEdit = true;
  }


  cancelSearchEdit(row: any): void {
    if (row._backup) {
      Object.assign(row, row._backup);
      delete row._backup;
    }
    row.isEdit = false;
  }



  // Method to update the edited row
  updateShipmentSap(row: any) {
    // 🔑 Mandatory PK check
    if (!row.ZREFNO || !row.VBELN || !row.POSNR || !row.ZLINE_NO) {
      Swal.fire('Error', 'Primary key missing', 'error');
      return null;
    }

    const payload = {
      CHANGE: [
        {
          ZREFNO: row.ZREFNO,
          ZLINE_NO: row.ZLINE_NO,
          VBELN: row.VBELN,
          POSNR: row.POSNR,
          ZMAPID: row.ZMAPID,
          ZSO_NO: row.ZSO_NO,
          ZODN_NO: row.ZODN_NO,
          ZPRODUCT: row.ZPRODUCT,
          MTART: row.MTART,
          MAKTX: row.MAKTX,
          ZSETS: row.ZSETS,
          ZAH: row.ZAH,
          ZSHIP_WT: row.ZSHIP_WT,
          ZBATCOND: row.ZBATCOND,
          ZINCO: row.ZINCO,
          ZINS_SCPOE: row.ZINS_SCPOE,
          ZPIN_PLT: row.ZPIN_PLT,
          ZPIN_STP: row.ZPIN_STP,
          ZKM: row.ZKM,
          ZWORK_ORDER: row.ZWORK_ORDER,
          ZLRNO: row.ZLRNO,
          ZTRANSPORTER: row.ZTRANSPORTER,
          ZPLANT: row.ZPLANT,
          ZDIVISION: row.ZDIVISION,
          ZCREATED_DT: row.ZCREATED_DT,
          ZVEH_TYPE: row.ZVEH_TYPE,
          ZUSER:row.ZUSER,
            ZUSER_CH: this.loggedInUser
        }
      ]
    };

    console.log('🟢 SAP CHANGE payload:', payload);

    return this.service.Shipmentchangewithsap(payload);
  }

  updateShipmentNonSap(row: any) {
    // 🔑 STRICT PK CHECK
    if (
      row.ZREFNO == null ||
      row.ZLINE_NO == null ||
      row.VBELN == null ||
      row.POSNR == null
    ) {
      Swal.fire('Error', 'Primary key missing', 'error');
      return null;
    }

    const payload = {
      CHANGE: [{
        ZREFNO: row.ZREFNO,
        ZLINE_NO: row.ZLINE_NO,   
        VBELN: row.VBELN,
        POSNR: row.POSNR,
        ZMAPID: row.ZMAPID,
        ZSO_NO: row.ZSO_NO,
        ZODN_NO: row.ZODN_NO,
        ZPRODUCT: row.ZPRODUCT,
        MTART: row.MTART,
        MAKTX: row.MAKTX,
        ZSETS: row.ZSETS,
        ZAH: row.ZAH,
        ZSHIP_WT: row.ZSHIP_WT,
        ZBATCOND: row.ZBATCOND,
        ZINCO: row.ZINCO,
        ZINS_SCPOE: row.ZINS_SCPOE,
        ZKM: row.ZKM,
        ZWORK_ORDER: row.ZWORK_ORDER,
        ZLRNO: row.ZLRNO,
        ZTRANSPORTER: row.ZTRANSPORTER,
        ZPLANT: row.ZPLANT || '',
        ZDIVISION: row.ZDIVISION || '',
        ZCREATED_DT: row.ZCREATED_DT || '',
        ZVEH_TYPE: row.ZVEH_TYPE || '',
          ZUSER: row.ZUSER,
            ZUSER_CH: this.loggedInUser
      }
      ]
    };



    console.log('🟡 Non-SAP UPDATE payload:', payload);

    return this.service.Shipmentchangewithoutsap(payload);
  }



  updateSearchRow(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this shipment record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.spinner.show();

      const api$ =
        this.sapType === 'SAP'
          ? this.updateShipmentSap(row)
          : this.updateShipmentNonSap(row);

      if (!api$) {
        this.spinner.hide();
        return;
      }

      api$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            console.log('✅ Update Response:', res);
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Record updated successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
              this.onSearchReference();
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: res?.MSG || res?.MESSAGE || 'Update failed',
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





  deleteRow(row: any, index: number): void {
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
      // 🔹 Prepare request payload
      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.VBELN,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      const apiCall = this.sapType === 'SAP'
        ? this.service.ShipmentDeleteWithSap(payload)
        : this.service.ShipmentDeleteWithoutSap(payload);

      apiCall.subscribe({
        next: (res: any) => {
          if (res?.NUMBER === '200') {

            this.searchOptionsList.splice(index, 1);
            Swal.fire({
              title: 'Deleted',
              text: res.MSG || 'Record deleted successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
          } else {
            Swal.fire({
              title: 'Failed',
              text: res?.MSG || 'Delete failed',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          console.error('Delete Error:', err);
          Swal.fire({
            title: 'Error',
            text: err?.error?.MSG || 'Something went wrong while deleting',
            icon: 'error'
          });
        }
      });
    });
  }



  fetchIncoterms() {
    this.spinner.show();
    const payload = { INCO1: "", BEZEI: "" };
    this.service.Incoterms(payload).subscribe({
      next: (res: any) => {
        this.IncotermsList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Incoterms:", err);
        this.spinner.hide();
      }
    });
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onTypeOfMaterialChange() {
    console.log('Type of Material changed');
  }

  fetchNonSapReports(): void {
    const payload = { REPORT: "X" };
    this.spinner.show();

    this.service.shipmentdetailsNonSapReports(payload).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.items.clear();
          const firstItem = res[0];
          this.ProductInfo.patchValue({
            ZINCO: firstItem.ZINCO || '',
            ZINS_SCPOE: firstItem.ZINS_SCPOE || '',
            ZKM: firstItem.ZKM || 0,
            VBELN: firstItem.VBELN || ''
          });
          res.forEach((item: any) => {
            this.items.push(this.fb.group({
              selected: [false],
              ZPRODUCT: [item.ZPRODUCT || ''],
              MTART: [item.MTART || ''],
              MAKTX: [item.MAKTX || ''],
              ZSETS: [item.ZSETS || 0, [Validators.min(1)]],
              ZAH: [item.ZAH || 0],
              ZSHIP_WT: [item.ZSHIP_WT || 0],
              ZBATCOND: [item.ZBATCOND || '']
            }));
          });
          this.showForm = true;
        } else {
          Swal.fire({
            title: 'Warning',
            text: 'No report data found',
            icon: 'warning',
            confirmButtonText: 'Ok',
            timer: 4000
          });
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Non-SAP Reports:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch Non-SAP reports',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        this.spinner.hide();
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

  // onFilterDivisionChange(): void {
  //   const plantObj = this.PlantCodeList.find(item => item.DIVISION === this.filterDivision);

  //   if (plantObj) {
  //     this.filterPlant = plantObj.PLANT + '_' + plantObj.PLANT_DESC;
  //   } else {
  //     this.filterPlant = '';
  //   }
  //   this.cd.detectChanges();
  // }

  // onFilterPlantChange(): void {
  //   // Extract the plant code from the combined value
  //   const plantCode = this.filterPlant.split('_')[0];

  //   const plantObj = this.PlantCodeList.find(item => item.PLANT === plantCode);

  //   if (plantObj) {
  //     this.filterDivision = plantObj.DIVISION;
  //   } else {
  //     this.filterDivision = '';
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
      GLOBAL: 'SHIPMENT DETAILS',
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
    // if (this.sapType === 'SAP') {
    //   apiCall = this.service.fetchOrderInfoFiltered(payload);
    // } else {
    //   apiCall = this.service.fetchGlobalFilteredNonSap( payload );
    // }

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
          this.ShipmentData = [];
          this.dispatchData = [];

          Swal.fire({
            icon: 'info',
            title: 'No Data Found',
            text: res.MSG || 'No records available for selected filters'
          });
          return;
        }

        /** 🟢 DATA FOUND */
        let records: any[] = [];
        if (Array.isArray(res)) records = res;
        else if (res?.HEADER) records = res.HEADER;
        else if (res?.DATA) records = res.DATA;

        this.filterApplied = true;

        if (this.filterStatus === 'Completed') {
          this.ShipmentData = records;
          this.dispatchData = [];
          Swal.fire('Success', `Shipment records: ${records.length}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.ShipmentData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.ShipmentData = [];
          this.dispatchData = [];
          Swal.fire('Info', 'Please select valid status', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to fetch filtered data', 'error');
        console.error(err);
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
      exportSource = this.ShipmentData;
      fileName = this.sapType === 'SAP' ? 'ShipmentData_Completed_SAP.xlsx' : 'ShipmentData_Completed_NonSAP.xlsx';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP' ? 'Dispatch_Pending_SAP.xlsx' : 'Dispatch_Pending_NonSAP.xlsx';
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
        'Reference No': record.ZREFNO || '',
        'Invoice No': record.VBELN || '',
        // 'Line No': record.ZLINE_NO || '',
        'Map ID': record.ZMAPID || '',
        'ODN No': record.ZODN_NO || '',
        'SO No': record.ZSO_NO || '',
        'Incoterms': record.ZINCO || '',
        'Insurance Scope': record.ZINS_SCPOE || '',
        'KM': record.ZKM || '',
        'Product Code': record.ZPRODUCT || '',
        'Type of Material': record.MTART || '',
        'Material Description': record.MAKTX || '',
        'No. of Sets': record.ZSETS || '',
        'AH Truck Load': record.ZAH || '',
        'Weight (in Kg)': record.ZSHIP_WT || '',
        'Battery Condition': record.ZBATCOND || '',
        'Plant': record.ZWERKS || '',
        'Division': record.ZDIVISION || '',
        'Work Order': record.ZWORK_ORDER || '',
        'LR No': record.ZLRNO || '',
        'Transporter': record.ZTRANSPORTER || '',
        'Vehicle Type': record.ZVEH_TYPE || '',
        'Created Date': record.ZCREATED_DT || ''
      }));
    } else if (this.filterStatus === 'Pending') {
      exportData = exportSource.map(record => ({
        'Reference No': record.ZREFNO || '',
        'Line No': record.ZLINE_NO || '',
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
      exportSource = this.ShipmentData;
      fileName = this.sapType === 'SAP' ? 'Shipmentdata_Completed_SAP.pdf' : 'Shipmentdata_Completed_NonSAP.pdf';
      reportTitle = 'Shipment Data Records (Completed)';
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
        'REFNO',
        'Invoice No',
        // 'Line No',
        'Map ID',
        'ODN No',
        'SO No',
        'Incoterms',

        'Insurance Scope',
        'KM',
        'Product',
        'Type of Material',
        'Material Description',
        'No. of Sets',
        'AH Truck Load',
        'Weight (in Kg)',
        'Battery Condition',
        'Plant',
        'Division',

        'Work Order',
        'LR No',
        'Transporter',
        'Created date',
        'Vehicle Type'
      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.VBELN || '',
        // record.ZLINE_NO || '',
        record.ZMAPID || '',
        record.ZODN_NO || '',
        record.ZSO_NO || '',
        record.ZINCO || '',
        record.ZINS_SCPOE || '',
        record.ZKM || '',
        record.ZPRODUCT || '',
        record.MTART || '',
        record.MAKTX || '',
        record.ZSETS || '',
        record.ZAH || '',
        record.ZSHIP_WT || '',
        record.ZBATCOND || '',
        record.ZWERKS || '',
        record.ZDIVISION || '',

        record.ZWORK_ORDER || '',
        record.ZLRNO || '',
        record.ZTRANSPORTER || '',
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        record.ZVEH_TYPE || ''
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
        'Unloading Point'
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
        record.ZUNLOAD_PT || ''
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
      SCREEN: 'SHIPMENT DETAILS'
    };

    this.service.OutwardCountGlobalWithSap(payload).subscribe(
      (response: any) => {
        this.pendingCount = response.ZPEND_CNT || 0;
        this.completedCount = response.ZCONF_CNT || 0;
      },
      (error) => {
        console.error('Error fetching counts:', error);
        this.pendingCount = 0;
        this.completedCount = 0;

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
    this.isAllSelected = false;

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';
    this.searchValue = '';
    this.searchOptionsList = [];
    this.dropdownOpen = false;

    // Reset previous state trackers
    this.previousOrderType = null;
    this.previousSapType = null;

    // Reset invoice/PO numbers
    this.ponumber = '';
    this.invoicenumber = '';


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
    this.ShipmentData = [];
    this.dispatchData = [];
    this.selectedItems = [];

    // Reset table display flags
    this.showOrderInfoTable = false;
    this.showDispatchTable = false;

    // Reset counts
    this.pendingCount = 0;
    this.completedCount = 0;

    // Reset form
    this.ProductInfo.reset();

    // Clear and reset the FormArrays to have one empty row each
    this.items.clear();
    this.items.push(this.createItemRow());

    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());



    // Show success message
    Swal.fire({
      text: 'Screen refreshed successfully',
      icon: 'success',

      confirmButtonText: 'Ok',
      timer: 4000
    });

    this.cd.detectChanges();
  }




}