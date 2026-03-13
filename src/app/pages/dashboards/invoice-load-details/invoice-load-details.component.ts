import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  isAllSelected: boolean = false;
  vehicleTypes: any[] = [];
  isUpdateMode: boolean = false;
  PlantCodeList: any[] = [];
  VendorCodeList: any[] = [];
  InvoiceLoadDetailsData: any[] = [];
  dispatchData: any[] = [];

  mainMode: string = 'creation'; // Default to creation mode
  pendingCount: number = 0;
  completedCount: number = 0;

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
  filterSapType: string = '';

  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  showForm: boolean = false;
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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.InvoiceForm = this.fb.group({
      INV_VBELN: [''],
      invoices: this.fb.array([]),
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

    this.addRow();
    this.getVehicleTypes();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  get invoices(): FormArray {
    return this.InvoiceForm.get('invoices') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.InvoiceForm.get('referenceItems') as FormArray;
  }

  createInvoiceRow(data?: any): FormGroup {
    return this.fb.group({
      selected: [false],
      ZMAPID: [data?.ZMAPID || ''],
      MANDT: [data?.MANDT || '234'],
      VBELN: [data?.VBELN || this.invoicenumber],
      POSNR: [data?.POSNR || ''],
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZTRUC_WT: [data?.ZTRUC_WT || '', Validators.required],
      ZACT_LOAD: [data?.ZACT_LOAD || '', Validators.required],
      // ZTRUCK_LINE: [data?.ZTRUCK_LINE || ''],
      ZACT_VOL: [data?.ZACT_VOL || '', Validators.required],
      ZLF_VOL: [data?.ZLF_VOL || '', Validators.required],
      ZLF_WT: [data?.ZLF_WT || '', Validators.required],
      ZWEEK_SF: [data?.ZWEEK_SF || ''],
      ZEWAYBILL_NO: [data?.ZEWAYBILL_NO || '', Validators.required],
      ZEWAYBILL_DT: [data?.ZEWAYBILL_DT || '', Validators.required],
      // ✅ Add these reference fields like shipment-details
      ZREFNO: [data?.ZREFNO || ''],
      ZWORK_ORDER: [data?.ZWORK_ORDER || ''],
      ZLRNO: [data?.ZLRNO || ''],
      ZTRANSPORTER: [data?.ZTRANSPORTER || ''],
      ZSO_NO: [data?.ZSO_NO || ''],
      ZODN_NO: [data?.ZODN_NO || ''],
      ZLINE_NO: [data?.ZLINE_NO || ''],
    });
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      soNumber: [''],
      odnNumber: [''],
      lineNumber: ['']
    });
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.invoices.controls.forEach(ctrl => ctrl.get('selected')?.setValue(isChecked));
  }

  onRowCheckboxChange(): void {
    this.isAllSelected = this.allSelected();
    console.log('All Selected:', this.invoices.value);
  }
  onClickRow(){
    console.log("this.invoices.value",this.invoices.value)
  }

  allSelected(): boolean {
    return this.invoices.controls.length > 0 &&
      this.invoices.controls.every(ctrl => ctrl.get('selected')?.value === true);
  }

  getSelectedRows() {
    return this.invoices.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
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
    this.showForm = false;
    this.invoices.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
    this.sapType = '';
    this.invoicenumber = '';
    this.ponumber = '';
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

    this.searchOptionsList = [];
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
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }
    this.selectedType = '';
  this.searchReference = '';
  this.searchOptionsList = [];

    this.invoices.clear();
    this.addRow();
    this.ponumber = '';
    this.invoicenumber = '';
    this.showForm = this.sapType !== 'SAP';
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.InvoiceForm.reset();
    this.invoices.clear();
    this.referenceItems.clear();
    this.invoiceF4List = [];
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
  }

  onchangeMAPID(index: number) {
    const rowForm = this.invoices.at(index) as FormGroup;
    const selectedMapId = rowForm.get('ZMAPID')?.value;
    console.log("Selected MAPID:", selectedMapId);

    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);
    console.log("Selected MAPID object:", selectedObj);

    if (selectedObj) {
      rowForm.patchValue({
        ZREFNO: selectedObj.referenceNumber || "",
        ZWORK_ORDER: selectedObj.workOrderNumber || "",
        ZLRNO: selectedObj.lrNumber || "",
        ZTRANSPORTER: selectedObj.transporter || "",
        ZMAPID: selectedObj.MAPID || "",
      ZLINE_NO: selectedObj.lineNumber ?? null
      });
    }
    console.log("Updated invoices form:", this.invoices.value);
  }

  // Reference Table: Field Blur Handler
  onFieldBlur(index: number, fieldKey: string): void {
    if (index !== 0) return;

    // Safety: ensure referenceItems exists and has at least one row
    if (!this.referenceItems || this.referenceItems.length === 0) return;

    const firstRow = this.referenceItems.at(0) as FormGroup | undefined;
    if (!firstRow) return;
    const values = firstRow.value || {};

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
      global_scr: 'INVOICE LOAD DETAILS',
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
  //           MAPID: [d.MAPID || ''],
  //           referenceNumber: [d.REF_NO || d.referenceNumber || ''],
  //           workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
  //           lrNumber: [d.LR_NO || d.lrNumber || ''],
  //           transporter: [d.TRANSPORTER || d.transporter || ''],
  //           soNumber: [d.SO_NO || d.soNumber || ''],
  //           odnNumber: [d.ODN_NO || d.odnNumber || ''],
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
    this.invoiceF4List = [];   
       this.fullReferenceData = []; 

    if (data && data.length > 0) {
        this.fullReferenceData = data;
      data.forEach(d => {

        // ✅ PUSH FORM ROW
        this.referenceItems.push(
          this.fb.group({
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || ''],
            workOrderNumber: [d.WORK_ORDER_NO || ''],
            lrNumber: [d.LR_NO || ''],
            transporter: [d.TRANSPORTER || ''],
            soNumber: [''],
            odnNumber: [''],
            ZNO_TRUCKS: [d.ZNO_TRUCKS],
            INV_NO_LIST: [d.INV_NO || []],
            lineNumber: [d.LINE_NO || d.lineNumber || '']
          })
        );

        // ✅ EXTRACT INVOICE NUMBERS FOR F4
        if (Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !this.invoiceF4List.includes(inv.VBELN)) {
              this.invoiceF4List.push(inv.VBELN);
            }
          });
        }
      });

      console.log('🟢 Full Reference Data stored:', this.fullReferenceData);

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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  // ✅ FETCH INVOICE API
  // fetchInvoiceDetails(): void {
  //   const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

  //   if (!referenceNumber?.trim()) {
  //     Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number`, 'warning');
  //     return;
  //   }

  //   const payload = { INV_GET: referenceNumber.trim() };

  //   this.spinner.show();

  //   this.service.Invoiceloaddetailsfetch(payload).subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();

  //       if (Array.isArray(res) && res.length > 0) {
  //         this.invoices.clear();
  //         res.forEach((item: any) => this.addRow(item));
  //         this.showForm = true;
  //         this.searchOptionsList = [];

  //         Swal.fire('Success', 'Invoice details loaded', 'success');
  //       } else {
  //         Swal.fire('Info', 'No records found', 'info');
  //       }
  //     },
  //     error: (err) => {
  //       this.spinner.hide();
  //       Swal.fire('Error', 'Fetch failed', 'error');
  //     }
  //   });
  // }
  fetchInvoiceDetails(): void {
    const referenceNumber =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber?.trim()) {
      Swal.fire(
        'Warning',
        `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number`,
        'warning'
      );
      return;
    }

    // ✅ MUST select reference rows first
    if (!this.selectedItems || this.selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one reference row', 'warning');
      return;
    }

    const payload = {
    INV_GET: referenceNumber.trim(),
    SCREEN: 'WITHSAP'
  };

    this.spinner.show();

    this.service.Invoiceloaddetailsfetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (Array.isArray(res) && res.length > 0) {
          this.invoices.clear();

          console.log('✅ Selected Reference Items:', this.selectedItems);

          // 🔥 LOOP ONLY SELECTED REFERENCES
          this.selectedItems.forEach((ref: any) => {
            const truckCount = Number(ref.ZNO_TRUCKS) || 1;

            for (let i = 0; i < truckCount; i++) {
              this.addRow({
                VBELN: referenceNumber,

                // Map from selected reference
                ZMAPID: ref.MAPID || '',
                ZREFNO: ref.referenceNumber || '',
                ZWORK_ORDER: ref.workOrderNumber || '',
                ZLRNO: ref.lrNumber || '',
                ZTRANSPORTER: ref.transporter || '',
                ZLINE_NO: ref.lineNumber || '', 

                ZTRUCK_LINE: i + 1,

                ZWEEK_SF: this.sapType === 'SAP' ? (res[0]?.ZWEEK_SF || '') : '',

                // sunil added due to so and odn not storing in obj 

                ZODN_NO: res[0]?.ZODN_NO || '',
                ZSO_NO: res[0]?.ZSO_NO || ''
              });
            }
          });

          this.showForm = true;
          this.searchOptionsList = [];

          console.log('✅ Total Invoice Rows Created:', this.invoices.length);

          Swal.fire(
            'Success',
            `Invoice rows created based on No of Trucks`,
            'success'
          );
        } else {
          Swal.fire('Info', 'No records found for this invoice', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Fetch failed', 'error');
        console.error(err);
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

  // ✅ SAVE FOR SAP
 saveInvoiceDetails(action: 'stay' | 'next' | 'previous' = 'stay'): void {
  const filtered = this.invoices.value
    .filter((row: any) => row.selected === true)
    .map(({ selected, ...rest }) => rest);

  if (filtered.length === 0) {
    Swal.fire({
      title: 'Warning',
      text: 'Please select at least one row to save.',
      icon: 'warning',
      timer: 3000,
      confirmButtonText: 'Ok',
    });
    return;
  }

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

  // ✅ ADD ZUSER TO EACH ITEM
  const loggedInUser = this.getCurrentUser();
  const payloadWithUser = filtered.map((item: any) => ({
    ...item,
    ZUSER: loggedInUser,
    ZUSER_CH:''
  }));

  this.spinner.show();
  this.service.InvoiceloaddetailsSave(payloadWithUser).subscribe({
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

  // 8. ✅ Update saveInvoiceNonsapDetails similarly
  saveInvoiceNonsapDetails(action: 'stay' | 'next' | 'previous' = 'stay'): void {

    const filtered = this.invoices.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }) => rest);

    if (filtered.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one row to save.',
        icon: 'warning',
        timer: 3000,
        confirmButtonText: 'Ok',
      });
      return;
    }

    const dcRefNo = this.InvoiceForm.get('INV_VBELN')?.value;
    if (!dcRefNo || dcRefNo.trim() === '') {
      Swal.fire('Warning', 'Please enter DC Reference Number', 'warning');
      return;
    }

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
      NSAP_LOAD: filtered.map((inv: any, index: number) => ({
        MANDT: '',
        ZREFNO: inv.ZREFNO || "",
        ZWORK_ORDER: inv.ZWORK_ORDER || "",
        ZLRNO: inv.ZLRNO || "",
        ZTRANSPORTER: inv.ZTRANSPORTER || "",
        VBELN: dcRefNo,
        POSNR: index + 10,
        ZLINE_NO: inv.ZLINE_NO,
        ZTRUC_TYPE: inv.ZTRUC_TYPE,
        ZTRUC_WT: inv.ZTRUC_WT,
        ZACT_LOAD: inv.ZACT_LOAD,
        ZACT_VOL: inv.ZACT_VOL,
        ZLF_VOL: inv.ZLF_VOL,
        ZLF_WT: inv.ZLF_WT,
        ZODN_NO:inv.ZODN_NO,
        ZSO_NO: inv.ZSO_NO,
        ZWEEK_SF: inv.ZWEEK_SF,
        ZEWAYBILL_NO: inv.ZEWAYBILL_NO,
        ZEWAYBILL_DT: inv.ZEWAYBILL_DT,
        ZMAPID: inv.ZMAPID || "",
        ZUSER: this.getCurrentUser(),
        ZUSER_CH:''
      })),
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

  updateInvoiceSap(row: any) {
    if (!row.ZREFNO || !row.VBELN ||  !row.ZMAPID || !row.ZLINE_NO) {
      Swal.fire('Error', 'Primary key missing', 'error');
      return null;
    }

    const payload = [{
      ZMAPID: row.ZMAPID,
      VBELN: row.VBELN,
      POSNR: row.POSNR,
      ZLINE_NO: row.ZLINE_NO,
      ZREFNO: row.ZREFNO,
      ZWORK_ORDER: row.ZWORK_ORDER,
      ZLRNO: row.ZLRNO,
      ZTRANSPORTER: row.ZTRANSPORTER,
      ZSO_NO: row.ZSO_NO,
      ZODN_NO: row.ZODN_NO,
      ZTRUC_TYPE: row.ZTRUC_TYPE,
      ZTRUC_WT: row.ZTRUC_WT,
      ZACT_LOAD: row.ZACT_LOAD,
      ZACT_VOL: row.ZACT_VOL,
      ZLF_VOL: row.ZLF_VOL,
      ZLF_WT: row.ZLF_WT,
      ZWEEK_SF: row.ZWEEK_SF,
      ZEWAYBILL_NO: row.ZEWAYBILL_NO,
      ZEWAYBILL_DT: row.ZEWAYBILL_DT,
      ZUSER:'',
      ZUSER_CH: this.getCurrentUser()
    }];

    return this.service.InvoiceloaddetailsSave(payload);
  }
  updateInvoiceNonSap(row: any) {
    if (!row.ZMAPID || !row.VBELN ||  !row.ZREFNO || !row.ZLINE_NO) {
      Swal.fire('Error', 'Primary key missing', 'error');
      return null;
    }

    const payload = {
      NSAP_LOAD: [{
        MANDT: '',
        ZMAPID: row.ZMAPID,
        VBELN: row.VBELN,        // 🔑 same
        POSNR: row.POSNR,        // 🔑 same
        ZLINE_NO: row.ZLINE_NO,  // 🔑 same

        ZREFNO: row.ZREFNO,
        ZWORK_ORDER: row.ZWORK_ORDER,
        ZLRNO: row.ZLRNO,
        ZTRANSPORTER: row.ZTRANSPORTER,
        ZTRUC_TYPE: row.ZTRUC_TYPE,
        ZTRUC_WT: row.ZTRUC_WT,
        ZACT_LOAD: row.ZACT_LOAD,
        ZACT_VOL: row.ZACT_VOL,
        ZLF_VOL: row.ZLF_VOL,
        ZLF_WT: row.ZLF_WT,
        ZWEEK_SF: row.ZWEEK_SF,
        ZEWAYBILL_NO: row.ZEWAYBILL_NO,
        ZEWAYBILL_DT: row.ZEWAYBILL_DT,
            ZUSER:'',
      ZUSER_CH: this.getCurrentUser()
      }]
    };

    return this.service.InvoiceloaddetailsNonSap(payload);
  }
  updateInvoiceRow(row: any): void {
    console.log("Updating Row:", row);
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this invoice record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.spinner.show();

      const api$ =
        this.sapType === 'SAP'
          ? this.updateInvoiceSap(row)
          : this.updateInvoiceNonSap(row);

      if (!api$) {
        this.spinner.hide();
        return;
      }

      api$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res?.NUMBER === '200' || res?.STATUS === 'true') {
            Swal.fire({
              title: 'Success',
              text: 'Invoice updated successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
              this.onSearchReference?.();
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
          Swal.fire('Error', 'Server error', 'error');
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
        ? this.service.InvoiceloaddetailsDeleteWithsap(payload)
        : this.service.InvoiceloaddetailsDeleteWithoutsap(payload);

      apiCall.subscribe({
        next: (res: any) => {

          // ✅ FIXED SUCCESS CHECK
          if (
            res?.STATUS === 'TRUE' ||
            res?.STATUS === true ||
            res?.NUMBER === '200'
          ) {

            this.searchOptionsList.splice(index, 1);

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
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  onTruckTypeChange(i: number): void {


    const row = this.invoices.at(i);
    const selectedTruck = row.get('ZTRUC_TYPE')?.value;
    const selectedActualLoad = row.get('ZACT_LOAD')?.value;
    const selectedActualVolume = row.get('ZACT_VOL')?.value;

    if (!selectedTruck) return;

    const payload = {
      TRUCK: selectedTruck,
      ZACT_LOAD: Number(selectedActualLoad),
      ZACT_VOL: Number(selectedActualVolume)
    };

    this.spinner.show();
    this.service.sapget(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        const data = Array.isArray(res) ? res[0] : res;
        if (!data) return;

        // convert numeric response to string if your form expects string
        row.patchValue({
          ZTRUC_TYPE: data.ZTRUC_TYPE ?? '',
          ZACT_LOAD: data.ZACT_LOAD !== undefined ? data.ZACT_LOAD : '',
          ZACT_VOL: data.ZACT_VOL !== undefined ? String(data.ZACT_VOL) : '',
          ZLF_VOL: data.ZLF_VOL !== undefined ? String(data.ZLF_VOL) : '',
          ZLF_WT: data.ZLF_WT ?? '',
          ZTRUC_WT: data.ZTRUC_WT ?? ''
        }, { emitEvent: false }); // optional: avoid triggering valueChanges
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

  onVehicleTypeChange(i: number): void {
  const row = this.invoices.at(i);
  const selectedTruck = row.get('ZTRUC_TYPE')?.value;

  if (!selectedTruck) {
    // Clear ZTRUC_WT if no truck type selected
    row.patchValue({
      ZTRUC_WT: ''
    });
    return;
  }

  // Find the matching vehicle type from the loaded list
  const matchedVehicle = this.vehicleTypes.find(
    v => v.ZTRUC_TYPE === selectedTruck
  );

  if (matchedVehicle) {
    // Patch the passing weight directly from local data
    row.patchValue({
      ZTRUC_WT: matchedVehicle.ZTRUC_WT || ''
    }, { emitEvent: false });
    
    console.log(`✅ Patched ZTRUC_WT: ${matchedVehicle.ZTRUC_WT} for ${selectedTruck}`);
  } else {
    // If not found in local list, clear the weight
    row.patchValue({
      ZTRUC_WT: ''
    });
    console.warn(`⚠️ No matching weight found for: ${selectedTruck}`);
  }
}

  

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onSearchTypeChange(): void {
    // Reset data when search type changes
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
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Error:', err);
        Swal.fire('Error fetching data', '', 'error');
      }
    });
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
      GLOBAL: 'INVOICE LOAD DETAILS',
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
    // if (this.filterSapType === 'SAP') {
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
          this.InvoiceLoadDetailsData = [];
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
          this.InvoiceLoadDetailsData = records;
          this.dispatchData = [];
          Swal.fire('Success', `Invoice Load Details records: ${records.length}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.InvoiceLoadDetailsData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.InvoiceLoadDetailsData = [];
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

    let exportSource: any[] = [];
    let fileName = '';

    // 1️⃣ Status based data
    if (this.filterStatus === 'Completed') {
      exportSource = this.InvoiceLoadDetailsData;
      fileName = this.sapType === 'SAP'
        ? 'InvoiceLoadDetails_Completed_SAP.xlsx'
        : 'InvoiceLoadDetails_Completed_NonSAP.xlsx';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP'
        ? 'Dispatch_Pending_SAP.xlsx'
        : 'Dispatch_Pending_NonSAP.xlsx';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ No data check
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    let exportData: any[] = [];

    // 3️⃣ COMPLETED – HTML table keys mapping
    if (this.filterStatus === 'Completed') {
      exportData = exportSource.map((item, index) => ({

        'Map ID': item.ZMAPID || '',
        'Line No': item.ZLINE_NO || '',
        'REFNO': item.ZREFNO || '',
        'Invoice No': item.VBELN || '',
        'ODN Number': item.ZODN_NO || '',
        'SO Number': item.ZSO_NO || '',
        'Truck Type': item.ZTRUC_TYPE || '',
        'Passing Weight (Tons)': item.ZTRUC_WT || '',
        'Actual Load (Tons)': item.ZACT_LOAD || '',
        'Loading factor % (w.r.t weight)': item.ZLF_WT || '',
        'Actual Volume Occupied': item.ZACT_VOL || '',
        'Loading Factor w.r.t Volume': item.ZLF_VOL || '',
        'Week Wise Shipment Flow': item.ZWEEK_SF || '',
        'Eway Bill Number': item.ZEWAYBILL_NO || '',
        'Eway Bill Expiry Date': item.ZEWAYBILL_DT || '',
        'Plant': item.ZPLANT || '',
        'Division': item.ZDIVISION || '',
        'Work Order': item.ZWORK_ORDER || '',
        'LR No': item.ZLRNO || '',
        'Transporter': item.ZTRANSPORTER || '',
        'Created Date': item.ZCREATED_DT
          ? new Date(item.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Vehicle Type': item.ZVEH_TYPE || ''
      }));
    }

    // 4️⃣ PENDING (unchanged – already correct)
    if (this.filterStatus === 'Pending') {
      exportData = exportSource.map((item, index) => ({
        'SI.No': index + 1,
        'Reference No': item.ZREFNO || '',
        'Line No': item.ZLINE_NO || '',
        'Date': item.ZCREATED_DT
          ? new Date(item.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Plant': item.ZWERKS || '',
        'Division': item.ZDIVISION || '',
        'Vehicle Type': item.ZVEH_TYPE || '',
        'No. of Trucks': item.ZNO_TRUCKS || '',
        'Work Order': item.ZWORK_ORDER || '',
        'Vendor Code': item.ZVENDOR_CD || '',
        'Transporter': item.ZTRANSPORTER || '',
        'No. of LRs': item.ZNO_LRS || '',
        'LR Number': item.ZLR_NO || '',
        'Loading Point': item.ZLOAD_PT || '',
        'Unloading Point': item.ZUNLOAD_PT || ''
      }));
    }


    // 5️⃣ Create Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');

    // 6️⃣ Auto column width
    ws['!cols'] = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(key.length + 5, 18)
    }));

    // 7️⃣ Download
    XLSX.writeFile(wb, fileName);

    Swal.fire('Success', `Excel file downloaded: ${fileName}`, 'success');
  }

  downloadPDF() {

    let exportSource: any[] = [];
    let fileName = '';
    let reportTitle = '';

    // 1️⃣ Status based data
    if (this.filterStatus === 'Completed') {
      exportSource = this.InvoiceLoadDetailsData;
      fileName = this.sapType === 'SAP'
        ? 'Invoice-load-details_Completed_SAP.pdf'
        : 'Invoice-load-details_Completed_NonSAP.pdf';
      reportTitle = 'Invoice Load Details Records (Completed)';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP'
        ? 'Dispatch_Pending_SAP.pdf'
        : 'Dispatch_Pending_NonSAP.pdf';
      reportTitle = 'Dispatch Records (Pending)';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ No data check
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    // 3️⃣ PDF config (A2 Landscape – Wide)
    const doc = new (jsPDF as any).default({
      orientation: 'landscape',
      unit: 'mm',
      format: [420, 297]
    });

    /* ===== TITLE ===== */
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      18,
      { align: 'center' }
    );

    let headers: any[] = [];
    let data: any[] = [];

    // ================= COMPLETED =================
    if (this.filterStatus === 'Completed') {

      headers = [[
        'SI.No',
        'Map ID',
        'Line No',
        'REFNO',
        'Invoice No',
        'ODN Number',
        'SO Number',
        'Truck Type',
        'Passing Weight (Tons)',
        'Actual Load (Tons)',
        'Loading factor % (Wt)',
        'Actual Volume',
        'Loading Factor (Vol)',
        'Week Wise Shipment Flow',
        'Eway Bill No',
        'Eway Bill Expiry',
        'Plant',
        'Division',
        'Work Order',
        'LR No',
        'Transporter',
        'Created Date',
        'Vehicle Type'
      ]];

      data = exportSource.map((item, index) => ([
        index + 1,
        item.ZMAPID || '',
        item.ZLINE_NO || '',
        item.ZREFNO || '',
        item.VBELN || '',
        item.ZODN_NO || '',
        item.ZSO_NO || '',
        item.ZTRUC_TYPE || '',
        item.ZTRUC_WT || '',
        item.ZACT_LOAD || '',
        item.ZLF_WT || '',
        item.ZACT_VOL || '',
        item.ZLF_VOL || '',
        item.ZWEEK_SF || '',
        item.ZEWAYBILL_NO || '',
        item.ZEWAYBILL_DT || '',
        item.ZPLANT || '',
        item.ZDIVISION || '',
        item.ZWORK_ORDER || '',
        item.ZLRNO || '',
        item.ZTRANSPORTER || '',
        item.ZCREATED_DT
          ? new Date(item.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        item.ZVEH_TYPE || ''
      ]));
    }

    // ================= PENDING =================
    if (this.filterStatus === 'Pending') {

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

      data = exportSource.map((item, index) => ([
        index + 1,
        item.ZREFNO || '',
        item.ZLINE_NO || '',
        item.ZCREATED_DT
          ? new Date(item.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        item.ZWERKS || '',
        item.ZDIVISION || '',
        item.ZVEH_TYPE || '',
        item.ZNO_TRUCKS || '',
        item.ZWORK_ORDER || '',
        item.ZVENDOR_CD || '',
        item.ZTRANSPORTER || '',
        item.ZNO_LRS || '',
        item.ZLR_NO || '',
        item.ZLOAD_PT || '',
        item.ZUNLOAD_PT || ''
      ]));
    }

    // 4️⃣ AutoTable
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
      theme: 'grid'
    });

    // 5️⃣ Save
    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  }

  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'INVOICE LOAD DETAILS'
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

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';

    this.searchOptionsList = [];
    this.dropdownOpen = false;


    // Reset filter fields
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterSapType = '';
    this.filterVehicleType = '';
    this.filteredData = [];
    this.filterApplied = false;

    // Reset form


    // Show success message
    Swal.fire({
      text: 'Screen refreshed successfully',
      icon: 'success',

      confirmButtonText: 'Ok',
      timer: 4000
    });

    this.cd.detectChanges();
  }

  fetchDcRef(): void {
    const referenceNumber =
      this.InvoiceForm.get('INV_VBELN')?.value; // ✅ correct value

    if (!referenceNumber || !referenceNumber.trim()) {
    Swal.fire(
      'Warning',
      `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number`,
      'warning'
    );
    return;
  }

  if (!this.selectedItems || this.selectedItems.length === 0) {
    Swal.fire(
      'Warning',
      'Please select at least one reference row',
      'warning'
    );
    return;
  }

  const payload = {
    INV_GET: referenceNumber.trim(),
    SCREEN: 'WITHOUTSAP'
  };

  this.spinner.show();

  this.service.Invoiceloaddetailsfetch(payload).subscribe({
    next: (res: any) => {
      this.spinner.hide();

      if (Array.isArray(res) && res.length > 0) {
        this.invoices.clear();

        this.selectedItems.forEach((ref: any) => {
          const truckCount = Number(ref.ZNO_TRUCKS) || 1;

          for (let i = 0; i < truckCount; i++) {
            this.addRow({
              VBELN: referenceNumber,
              ZMAPID: ref.MAPID || '',
              ZREFNO: ref.referenceNumber || '',
              ZWORK_ORDER: ref.workOrderNumber || '',
              ZLRNO: ref.lrNumber || '',
              ZTRANSPORTER: ref.transporter || '',
              ZTRUCK_LINE: i + 1,

               ZWEEK_SF: res[0]?.ZWEEK_SF || ''
            });
          }
        });

        this.showForm = true;
        this.searchOptionsList = [];

        Swal.fire(
          'Success',
          'Invoice rows created based on No of Trucks',
          'success'
        );
      } else {
        Swal.fire('Info', 'No records found for this invoice', 'info');
      }
    },
    error: (err) => {
      this.spinner.hide();
      Swal.fire('Error', 'Fetch failed', 'error');
      console.error(err);
      }
    });
  }

  getCurrentUser(): string {
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const user = JSON.parse(currentUser);
    return user.USER || '';
  }
  return '';
}



}