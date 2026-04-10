import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-transit-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-info.component.html',
  styleUrls: ['./transit-info.component.css']
})
export class TransitInfoComponent implements OnInit {
  transitInfo!: FormGroup;
  PlantCodeList: any[] = [];
  TransitInfoHeader: any[] = [];  // ✅ Add this
  TransitInfoItems: any[] = [];   // ✅ Add this
  VendorCodeList: any[] = [];
  transitResponse: any = {};

  orderType: string = '';
  sapType: string = '';
  showForm = false;
  isUpdateMode: boolean = false;
  isEditMode: boolean = false;
  mainMode: string = 'creation'; // Default to creation mode



  ponumber: string = '';
  pendingCount: number = 0;
  completedCount: number = 0;
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // Search functionality
  selectedItems: any[] = [];
  showTable = false;
  headerData: any = null;
  itemsList: any[] = [];
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
  ]
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

  dispatchData: any[] = [];
  TransitInfoData: any[] = [];
  filterSapType: string = '';
  invoiceF4List: string[] = [];
  fullReferenceData: any[] = [];
  loggedInUser: string = '';
  plantList: any;
  divisionList: any;
  podScanError = false;
  podFileBase64: any = '';
  podFilePath: any = '';


  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
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

    this.initializeForm();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  initializeForm(): void {
    this.transitInfo = this.fb.group({
      ponumber: [''],
      // Updated: Removed Validators.required from invoicenumber since the main input field is gone
      invoicenumber: [''],
      physicalarrivedatdestinationdateandtime: [''],
      unloadingdateandtime: [''],
      podscanreceiveddateandtime: [''],
      sit: [''],
      PODSCAN: [''],
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
  }

  get referenceItems(): FormArray {
    return this.transitInfo.get('referenceItems') as FormArray;
  }


  trackByIndex(index: number): number {
    return index;
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      lineNumber: [''],
      vehicleNo: [''],
      vehicleLine: ['']
    });
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

    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;
  }

  updateSIT(): void {
    const physicalArrived = this.transitInfo.get('physicalarrivedatdestinationdateandtime')?.value;
    const field2 = this.transitInfo.get('unloadingdateandtime')?.value;
    const field3 = this.transitInfo.get('podscanreceiveddateandtime')?.value;

    if (field2 || field3) {
      this.transitInfo.get('sit')?.setValue('Sale');
    } else if (physicalArrived) {
      this.transitInfo.get('sit')?.setValue('SIT');
    } else {
      this.transitInfo.get('sit')?.setValue('');
    }
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
    // 🔥 CLEAR SEARCH TABLE DATA when order type changes
    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;
    this.searchReference = '';
    this.selectedType = '';
  }

  onSapTypeChange(): void {
    // ✅ Show spinner at start
    this.spinner.show();

    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }

    this.previousSapType = this.sapType;
    this.selectedType = '';
    this.searchReference = '';
    this.searchOptionsList = [];

    // ✅ Clear old data
    this.transitInfo.reset();
    this.referenceItems.clear();
    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;
    this.searchReference = '';
    this.selectedType = '';
    this.referenceItems.push(this.createReferenceRow());

    // ✅ CALL COUNT API for Outward mode
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts(); // This will hide spinner
    } else {
      // ✅ Hide spinner if not Outward
      this.spinner.hide();
    }

    // Show form only if both selections are made
    this.showForm = !!(this.orderType && this.sapType);

    // Set validators based on order type
    if (this.orderType === 'Inward') {
      this.transitInfo.get('ponumber')?.setValidators([Validators.required]);
      this.transitInfo.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.transitInfo.get('invoicenumber')?.clearValidators();
      this.transitInfo.get('ponumber')?.clearValidators();
    } else {
      this.transitInfo.get('ponumber')?.clearValidators();
      this.transitInfo.get('invoicenumber')?.clearValidators();
    }

    this.transitInfo.get('ponumber')?.updateValueAndValidity();
    this.transitInfo.get('invoicenumber')?.updateValueAndValidity();

    console.log('onSapTypeChange -> sapType:', this.sapType, ' showForm:', this.showForm);
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.transitInfo.reset();
    this.invoiceF4List = [];
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    // 🔥 CLEAR SEARCH TABLE DATA when order type changes
    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;
    this.searchReference = '';
    this.selectedType = '';
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
      global_scr: 'TRANSIT INFO',
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
  //           referenceNumber: [d.REF_NO || ''],
  //           workOrderNumber: [d.WORK_ORDER_NO || ''],
  //           lrNumber: [d.LR_NO || ''],
  //           transporter: [d.TRANSPORTER || ''],
  //           vehicleNo: [d.VEH_NUM || ''],
  //           vehicleLine: [d.VEH_LINE || '']
  //         })
  //       );
  //     });
  //   } else {
  //     Swal.fire({ icon: 'info', title: 'No Records Found', timer: 1500, showConfirmButton: false });
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

        // ✅ EXTRACT INVOICE NUMBERS FOR F4
        if (d.INV_NO && Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !this.invoiceF4List.includes(inv.VBELN)) {
              this.invoiceF4List.push(inv.VBELN);
            }
          });
        }

        // ✅ EXISTING ROW PUSH
        this.referenceItems.push(
          this.fb.group({
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || ''],
            workOrderNumber: [d.WORK_ORDER_NO || ''],
            lrNumber: [d.LR_NO || ''],
            transporter: [d.TRANSPORTER || ''],
            vehicleNo: [d.VEH_NUM || ''],
            vehicleLine: [d.VEH_LINE || ''],
            lineNumber: [d.LINE_NO || d.ZLINE_NO || d.lineNumber || '']
          })
        );
      });

      console.log('🟢 Invoice F4 List:', this.invoiceF4List);

    } else {
      Swal.fire({ icon: 'info', title: 'No Records Found', timer: 1500, showConfirmButton: false });
      this.referenceItems.push(this.createReferenceRow());
    }
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
      this.updateInvoiceListForSelectedItems();
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
      this.updateInvoiceListForSelectedItems();
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


  // onSearchTypeChange(): void {
  //   // Reset data when search type changes
  //   this.searchReference = '';
  //   this.searchOptionsList = [];
  //   this.showForm = false;
  //   console.log('🔄 Search type changed. Data reset.');
  // }
  onSearchTypeChange(): void {

    // CLEAR INPUT
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;

    // 🔥 CLEAR TABLE (VERY IMPORTANT)
    this.headerData = null;
    this.itemsList = [];
    this.showTable = false;

    console.log('🔄 Search type changed – table cleared');
  }

  // Search functionality
  onSearchReference() {

    // 🔥 RESET OLD TABLE BEFORE SEARCH
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
      global: 'TRANSIT INFO',
      ZUSER: this.loggedInUser,
      data: {
        ref_no: '',
        inv_no: '',
        so_no: '',
        transporter: '',
        lr_no: '',
        workorder_no: '',
        sales_person: '',
        location: '',
        odn_no: '',
        vehicle_no: '',
        freight_billno: '',
        nature_damage: '',
        claim_status: '',
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



  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  onInputChange(type: 'purchase'): void {
    // Updated: Removed 'invoice' type
    const value = this.ponumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
    }
  }

  getForm(type: 'purchase'): void {
    // Updated: Removed 'invoice' type and logic
    const value = this.ponumber;
    if (!value || value.trim() === '') return;

    // You can add API call here if needed to fetch transit info
    this.showForm = true;

    // Optional: Populate PO Number in the main form if fetched by the 'GET' button
    this.transitInfo.get('ponumber')?.setValue(value);
  }

  private formatDate(date: string): string {
    if (!date) return '';
    return date.split('T')[0];
  }

  private formatDateTime(datetime: string): string {
    if (!datetime) return '';
    return datetime;
  }

  saveTransitInfo(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    this.transitInfo.markAllAsTouched();

    if (this.transitInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        timer: 4000
      });
      return;
    }

    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({ icon: 'warning', text: 'Please select at least one reference row before saving' });
      return;
    }

    const f = this.transitInfo.value;


    const HEAD = {
      REFNO: this.orderType === 'Inward'
        ? this.transitInfo.get('ponumber')?.value || ''
        : (this.selectedItems[0]?.referenceNumber || ''),

      INV_NO: this.orderType === 'Inward'
        ? this.transitInfo.get('ponumber')?.value || ''
        : this.transitInfo.get('invoicenumber')?.value || '',

      PY_ARRIVED_DEST: this.formatDate(f.physicalarrivedatdestinationdateandtime),
      UNLOADING_DT: this.formatDateTime(f.unloadingdateandtime),
      POD_SCAN: this.formatDateTime(f.podscanreceiveddateandtime),
      SIT_SALE: f.sit || '',
      ZUSER: this.loggedInUser,
      ZUSER_CH: '',
      ZPOD_FNAME: this.podFileBase64,
      ZPATH: this.podFilePath
    };


    let ITEM: any[] = [];

    if (this.orderType === 'Inward') {

      ITEM.push({
        REFNO: HEAD.REFNO,
        INV_NO: HEAD.INV_NO,
        POSNR: 10,
        VEH_LINE: 1,
        VEH_NUM: "",
        LRNO: "",
        LINE_NO: "",
        WORK_ORDER: "",
        TRANSPORTER: ""
      });

    } else {

      ITEM = this.selectedItems.map((item, idx) => ({
        REFNO: item.referenceNumber,
        INV_NO: this.transitInfo.get('invoicenumber')?.value || '',
        POSNR: (idx + 1) * 10,   // 10, 20, 30...
        VEH_LINE: idx + 1,
        VEH_NUM: "",
        LRNO: item.lrNumber,
        WORK_ORDER: item.workOrderNumber,
        TRANSPORTER: item.transporter,
        LINE_NO: item.lineNumber || item.LINE_NO || item.ZLINE_NO || ''
      }));

    }


    const payload = {
      HEAD,
      ITEM
    };

    console.log("FINAL TRANSIT PAYLOAD:", payload);

    this.spinner.show();
    let request$;

    if (this.sapType === 'Non-SAP') {
      // NON-SAP → PUT
      request$ = this.service.TransitInfoNonSap(payload);
    } else {
      // SAP → POST
      request$ = this.service.TransitInfoSave(payload);
    }


    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.STATUS?.toUpperCase() === 'TRUE' || res.NUMBER === '200') {
          Swal.fire({ text: res.MESSAGE, icon: 'success', timer: 3000 })
            .then(() => {
              if (action === 'next') this.router.navigate(['/freight-billing']);
              else if (action === 'previous') this.router.navigate(['/vechile-info']);
              else this.resetAll();
            });
        } else {
          Swal.fire({ text: res.MESSAGE, icon: 'error', timer: 3000 });
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire({ title: 'Error', text: `Error: ${err.status} - ${err.statusText}`, icon: 'error', timer: 3000 });
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


      const invalidItems = itemRows.filter(item => !item.ZREFNO || !item.ZLINE_NO);
      if (invalidItems.length > 0) {
        Swal.fire('Error', 'Missing mandatory keys in items (ZREFNO/ZLINE_NO)', 'error');
        return;
      }


      const headerPayload = {
        ZREFNO: headerRow.ZREFNO,
        ZINV_NO: headerRow.ZINV_NO || '',
        ZODN_NO: headerRow.ZODN_NO || '',
        ZSONO: headerRow.ZSONO || '',
        ZSALE_PERSON: headerRow.ZSALE_PERSON || '',
        ZPY_ARRIVED_DEST: headerRow.ZPY_ARRIVED_DEST || '',
        ZUNLOADING_DT: headerRow.ZUNLOADING_DT || '',
        ZPOD_SCAN: headerRow.ZPOD_SCAN || '',
        ZSIT_SALE: headerRow.ZSIT_SALE || '',
        ZLOCATION: headerRow.ZLOCATION || '',
        ZCREATED_DT: headerRow.ZCREATED_DT || '',
        ZPLANT: headerRow.ZPLANT || '',
        ZDIVISION: headerRow.ZDIVISION || '',
        ZVEH_TYPE: headerRow.ZVEH_TYPE || '',
        ZUSER: headerRow.ZUSER || '',
        ZUSER_CH: this.loggedInUser,
      };


      const itemPayload = itemRows.map(item => ({
        ZREFNO: String(item.ZREFNO),
        ZLINE_NO: String(item.ZLINE_NO),
        ZINV_NO: item.ZINV_NO || '',
        POSNR: item.POSNR || '',
        ZVEH_LINE: item.ZVEH_LINE || '',
        ZVEH_NUM: item.ZVEH_NUM || '',
        ZLRNO: item.ZLRNO || '',
        ZWORK_ORDER: item.ZWORK_ORDER || '',
        ZTRANSPORTER: item.ZTRANSPORTER || '',
        ZUSER: item.ZUSER || '',
        ZUSER_CH: this.loggedInUser,

      }));

      // 🎯 Final payload with HEADER + ITEM
      const payload = {
        HEADER: headerPayload,
        ITEM: itemPayload
      };

      console.log('🛠 TRANSIT INFO CHANGE PAYLOAD:', payload);

      this.spinner.show();

      // 🔄 Call correct API based on sapType
      const api$ =
        this.sapType === 'SAP'
          ? this.service.TransitInfoChangeWithSap(payload)
          : this.service.TransitInfoChangeWithoutSap(payload);

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
        ? this.service.TransitInfoDeleteWithSap(payload)
        : this.service.TransitInfoDeleteWithOutSap(payload);

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



  resetAll(): void {
    this.transitInfo.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    this.showForm = false;
    this.orderType = '';
    this.sapType = '';
    this.ponumber = '';
    // Removed: this.invoicenumber = ''; 
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.resetAll();
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
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
      GLOBAL: 'TRANSIT INFO',
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
          this.TransitInfoHeader = [];
          this.TransitInfoItems = [];
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
          this.TransitInfoHeader = res?.HEADER || [];
          this.TransitInfoItems = res?.ITEMS || [];
          this.dispatchData = [];

          const headerCount = this.TransitInfoHeader.length;
          const itemsCount = this.TransitInfoItems.length;

          Swal.fire('Success', `Headers: ${headerCount}, Items: ${itemsCount}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          let records: any[] = [];
          if (Array.isArray(res)) records = res;
          else if (res?.HEADER) records = res.HEADER;
          else if (res?.DATA) records = res.DATA;

          this.dispatchData = records;
          this.TransitInfoHeader = [];
          this.TransitInfoItems = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.TransitInfoHeader = [];
          this.TransitInfoItems = [];
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

    let exportSource: any[] = [];
    let fileName = '';

    if (this.filterStatus === 'Completed') {

      const combinedData: any[] = [];

      this.TransitInfoItems.forEach(item => {
        const header = this.TransitInfoHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;
      fileName = this.filterSapType === 'SAP' ? 'TransitInfo_Completed_SAP.xlsx' : 'TransitInfo_Completed_NonSAP.xlsx';
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
        'REFNO': record.ZREFNO || '',
        'Invoice No': record.ZINV_NO || '',
        'ODN Number': record.ZODN_NO || '',
        'SO Number': record.ZSONO || '',
        'Sales Person': record.ZSALE_PERSON || '',
        'Physical Arrived': record.ZPY_ARRIVED_DEST || '',
        'Unloading DT': record.ZUNLOADING_DT || '',
        'POD Scan': record.ZPOD_SCAN || '',
        'SIT/SALE': record.ZSIT_SALE || '',
        'Location': record.ZLOCATION || '',
        'Plant': record.ZPLANT || '',
        'Division': record.ZDIVISION || '',
        'Created Date': record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Vehicle Type': record.ZVEH_TYPE || '',
        'Vehicle Line': record.ZVEH_LINE || '',
        'Vehicle Number': record.ZVEH_NUM || '',
        'LR No': record.ZLRNO || '',
        'Work Order': record.ZWORK_ORDER || '',
        'Transporter': record.ZTRANSPORTER || ''
      }));
    } else if (this.filterStatus === 'Pending') {
      exportData = exportSource.map(record => ({
        'Reference No': record.ZREFNO || '',
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
        'Unloading Point': record.ZUNLOAD_PT || '',
        'No Of Invoices': record.ZNO_INVOICES || ''
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
      // ✅ Combine Header and Items for export
      const combinedData: any[] = [];

      this.TransitInfoItems.forEach(item => {
        const header = this.TransitInfoHeader.find(h => h.ZREFNO === item.ZREFNO);
        combinedData.push({
          ...(header || {}),
          ...item
        });
      });

      exportSource = combinedData;
      fileName = this.filterSapType === 'SAP' ? 'Transit_Info_Completed_SAP.pdf' : 'Transit_Info_Completed_NonSAP.pdf';
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
        'REFNO',
        'Invoice No',
        'ODN No',
        'SO No',
        'Sales Person',
        'Physical Arrived',
        'Unloading DT',
        'POD Scan',
        'SIT/SALE',
        'Location',
        'Plant',
        'Division',
        'Vehicle Line',
        'Vehicle Number',
        'LR No',
        'Work Order',
        'Transporter',
        'Created Date',
        'Vehicle Type'
      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.ZINV_NO || '',
        record.ZODN_NO || '',
        record.ZSONO || '',
        record.ZSALE_PERSON || '',
        record.ZPY_ARRIVED_DEST || '',
        record.ZUNLOADING_DT || '',
        record.ZPOD_SCAN || '',
        record.ZSIT_SALE || '',
        record.ZLOCATION || '',
        record.ZPLANT || '',
        record.ZDIVISION || '',
        record.ZVEH_LINE || '',
        record.ZVEH_NUM || '',
        record.ZLRNO || '',
        record.ZWORK_ORDER || '',
        record.ZTRANSPORTER || '',
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        record.ZVEH_TYPE || ''
      ]));
    } else if (this.filterStatus === 'Pending') {
      headers = [[
        'SI.No',
        'Reference No',
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
      theme: 'grid'
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  }

  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'TRANSIT INFO'
    };

    // ✅ Spinner already shown in onSapTypeChange()

    this.service.OutwardCountGlobalWithSap(payload).subscribe(
      (response: any) => {
        // ✅ Stop spinner
        this.spinner.hide();

        this.pendingCount = response.ZPEND_CNT || 0;
        this.completedCount = response.ZCONF_CNT || 0;

        console.log('✅ Counts fetched:', this.pendingCount, this.completedCount);
      },
      (error) => {
        // ✅ Stop spinner on error
        this.spinner.hide();

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

    // Reset previous state trackers
    this.previousOrderType = null;
    this.previousSapType = null;

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.dropdownOpen = false;

    // Reset table display
    this.showTable = false;
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
    this.filteredData = [];
    this.filterApplied = false;

    // Reset data arrays
    this.TransitInfoHeader = [];
    this.TransitInfoItems = [];
    this.dispatchData = [];
    this.selectedItems = [];

    // Reset transit response
    this.transitResponse = {};

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

  onVehicleNumberEditInput(item: any): void {
    if (!item) return;
    let val = String(item.ZVEH_NUM || '').toUpperCase();
    val = val.replace(/[^A-Z0-9\/]/g, '');
    item.ZVEH_NUM = val;
  }



  onFileSelected(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.podScanError = true;
      this.podFileBase64 = '';
      this.podFilePath = '';
      return;
    }

    this.podScanError = false;

    const reader = new FileReader();

    reader.onload = (e: any) => {

      const base64String = e.target.result;

      // remove data:image/jpeg;base64,
      this.podFileBase64 = base64String.split(',')[1];

      const fixedPath = "C:/Users/ADMIN/OneDrive/Desktop/";

      this.podFilePath = fixedPath + file.name;

      console.log("POD Base64:", this.podFileBase64);
      console.log("POD Path:", this.podFilePath);
    };

    reader.readAsDataURL(file);
  }



}