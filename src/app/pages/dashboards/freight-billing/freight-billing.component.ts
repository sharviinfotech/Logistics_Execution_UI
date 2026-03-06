import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FreightDetails {
  basicFreight: number;
  detentionLoading: number;
  detentionUnloading: number;
  loadingCharges: number;
  unloadingCharges: number;
  routeChangeCharges: number;
  transhipmentCharges: number;
  otherCharges: number;
  deduction: number;
}

@Component({
  selector: 'app-freight-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './freight-billing.component.html',
  styleUrls: ['./freight-billing.component.css']
})
export class FreightBillingComponent implements OnInit {
  popupType: 'freight' | 'provision' = 'freight';

  FreightBilling!: FormGroup;
  isEditMode = false;
  PlantCodeList: any[] = [];
  VendorCodeList: any[] = [];
  orderType: string = '';
  mainMode: string = 'creation'; // Default to creation mode
  sapType: string = '';
  showForm = false;
  freightDetails: FreightDetails;
  totalFreight: number = 0;
  pendingCount: number = 0;
  completedCount: number = 0;

  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  isUpdateMode: boolean = false;
  selectedPAData: any = null;
  selectedPAItem: any = null;
  selectedPAIndex: number = -1;
  currentCalculateModalRef: any = null;
  // Store breakdown details for P/A modal
  paFreightBreakdown: FreightDetails = this.resetDetails();
  paProvisionBreakdown: FreightDetails = this.resetDetails();

  // Search functionality
  selectedItems: any[] = [];
  fullReferenceData: any[] = [];
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
  ]
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;
  provision: [false];
  account: [false];
  showProvisionFields: boolean = false;
  showAccountFields: boolean = false;
  isPAModalContext: boolean = false;


  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filterStatus: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;

  Vehicle_Form!: FormGroup;
  FreightBillingData: any[] = [];
  dispatchData: any[] = [];
  filterSapType: string = '';
  invoiceF4List: string[] = [];
  minPhysicalDate: string = '';

  paFormData: any = {
    provisionChecked: false,
    provisionAmount: '',
    provisionDate: '',
    accountChecked: false,
    freightBillNumber: '',
    freightBillDate: '',
    physicalSubmissionDate: '',
    freightCharges: '',
    billSubmission: ''
  };


  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.freightDetails = this.resetDetails();
  }

  ngOnInit(): void {
    this.initializeForm();
    // this.setupWorkOrderListener();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  initializeForm(): void {
    this.FreightBilling = this.fb.group({
      ponumber: [''],
      REFNO: [''],
      invoicenumber: [''],
      FreightBillNumber: [''],
      FreightBillDate: [''],
      FreightBillPhysicalSubmissionDate: [''],
      FreightCharges: ['', [Validators.min(0)]],
      WorkOrderNumber: [''],
      BillSubmission: [''],
      LRNO: [''],
      TRANSPORTER: [''],
      provision: [false],
      account: [false],
      ProvisionAmount: [''],
      ProvisionDate: [''],
      FreightBillupload: [''],
      UnloadingChargesApproval: [''],
      DetentionChargesUploading: [''],
      WorkOrderUploading: [''],
      referenceItems: this.fb.array([this.createReferenceRow()])

    });
    this.loadInitialData();
  }

  get referenceItems(): FormArray {
    return this.FreightBilling.get('referenceItems') as FormArray;
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      lineNumber: [''],

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
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeChange(): void {

    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    this.selectedType = '';
    this.searchReference = '';
    this.searchOptionsList = [];


    this.FreightBilling.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }

    this.showForm = !!(this.orderType && this.sapType);

    if (this.orderType === 'Inward') {
      this.FreightBilling.get('ponumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.FreightBilling.get('invoicenumber')?.setValidators([Validators.required]);
      this.FreightBilling.get('ponumber')?.clearValidators();
    } else {
      this.FreightBilling.get('ponumber')?.clearValidators();
      this.FreightBilling.get('invoicenumber')?.clearValidators();
    }

    this.FreightBilling.get('ponumber')?.updateValueAndValidity();
    this.FreightBilling.get('invoicenumber')?.updateValueAndValidity();
    console.log('SAP Type changed to:', this.sapType, '| Form reset done.');
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.FreightBilling.reset();
    this.invoiceF4List = [];
    this.minPhysicalDate = '';
    this.referenceItems.clear();
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
      global_scr: 'FREIGHT BILLING',
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

  onCheckboxChange(event: Event, index: number): void {
    this.selectedItems = [];
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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.FreightBilling.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    this.isEditMode = false;
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  saveFreightBilling(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    const formValue = this.FreightBilling.getRawValue();

    Object.keys(this.FreightBilling.controls).forEach(key => {
      const control = this.FreightBilling.get(key);
      if (control?.enabled) {
        control.markAsTouched();
      }
    });

    if (this.FreightBilling.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        timer: 4000
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
    const ref =
      this.orderType === 'Outward'
        ? this.selectedItems[0]
        : this.referenceItems.at(0)?.value || {};
    console.log("ref", ref);

    console.log("formValue", formValue);

    const record = {
      INV_NO: formValue.invoicenumber || formValue.ponumber || '',
      REFNO: ref.referenceNumber || '',
      LINE_NO: ref.lineNumber || ref.LINE_NO || ref.ZLINE_NO || '',
      BILLNO: formValue.FreightBillNumber || '',
      BILLDATE: formValue.FreightBillDate || '',
      PRO_CHK: formValue.provision ? 'X' : '',
      ACC_CHK: formValue.account ? 'X' : '',
      PROVDT: formValue.ProvisionDate || '',
      PROVAMT: formValue.ProvisionAmount || 0,
      PHY_DATE: formValue.FreightBillPhysicalSubmissionDate || '',
      FRT_CHARGES: formValue.FreightCharges || 0,
      ORDER_NO: formValue.WorkOrderNumber || '',
      WORKORDER: ref.workOrderNumber || '',
      LRNO: ref.lrNumber || formValue.LRNO || '',
      TRANSPORTER: ref.transporter || '',
      BILL_SUBMISSION: formValue.BillSubmission,
      FRBILLUP: formValue.FreightBillupload || '',
      UNLOADAPP: formValue.UnloadingChargesApproval || '',
      DETENTUP: formValue.DetentionChargesUploading || '',
      WORDUP: formValue.WorkOrderUploading || '',

      // ✅ Freight Charges Breakdown (when Account checkbox is checked)
      ZFC_BASIC: formValue.account ? (this.paFreightBreakdown.basicFreight || 0) : 0,
      ZFC_DELOAD: formValue.account ? (this.paFreightBreakdown.detentionLoading || 0) : 0,
      ZFC_DEUNLOAD: formValue.account ? (this.paFreightBreakdown.detentionUnloading || 0) : 0,
      ZFC_LOAD: formValue.account ? (this.paFreightBreakdown.loadingCharges || 0) : 0,
      ZFC_UNLOAD: formValue.account ? (this.paFreightBreakdown.unloadingCharges || 0) : 0,
      ZFC_ROUTE: formValue.account ? (this.paFreightBreakdown.routeChangeCharges || 0) : 0,
      ZFC_TSHIP: formValue.account ? (this.paFreightBreakdown.transhipmentCharges || 0) : 0,
      ZFC_OTHER: formValue.account ? (this.paFreightBreakdown.otherCharges || 0) : 0,
      ZFC_DEDUCT: formValue.account ? (this.paFreightBreakdown.deduction || 0) : 0,

      // ✅ Provision Amount Breakdown (when Provision checkbox is checked)
      ZPR_BASIC: formValue.provision ? (this.paProvisionBreakdown.basicFreight || 0) : 0,
      ZPR_DELOAD: formValue.provision ? (this.paProvisionBreakdown.detentionLoading || 0) : 0,
      ZPR_DEUNLOAD: formValue.provision ? (this.paProvisionBreakdown.detentionUnloading || 0) : 0,
      ZPR_LOAD: formValue.provision ? (this.paProvisionBreakdown.loadingCharges || 0) : 0,
      ZPR_UNLOAD: formValue.provision ? (this.paProvisionBreakdown.unloadingCharges || 0) : 0,
      ZPR_ROUTE: formValue.provision ? (this.paProvisionBreakdown.routeChangeCharges || 0) : 0,
      ZPR_TSHIP: formValue.provision ? (this.paProvisionBreakdown.transhipmentCharges || 0) : 0,
      ZPR_OTHER: formValue.provision ? (this.paProvisionBreakdown.otherCharges || 0) : 0,
      ZPR_DEDUCT: formValue.provision ? (this.paProvisionBreakdown.deduction || 0) : 0
    };

    console.log("record", record);

    this.spinner.show();

    let request$ =
      this.sapType === 'SAP'
        ? this.service.FreightBillingSave({ SAVE: [record] })
        : this.service.FreightBillingNonSap({ CREATE: [record] });

    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            text: res.MESSAGE || 'Freight Billing saved successfully!',
            icon: 'success',
            timer: 3000
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/transit-damage-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/transit-info']);
            } else {
              this.resetForm();
            }
          });
        } else {
          Swal.fire({
            text: res.MESSAGE || 'Failed to save!',
            icon: 'error',
            timer: 3000
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong while saving!',
          icon: 'error',
          timer: 3000
        });
      }
    });
  }

  onFileChange(event: any, controlName: string) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      this.FreightBilling.patchValue({
        [controlName]: base64String
      });

      console.log(controlName, base64String);
    };

    reader.readAsDataURL(file);
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
  updateSearchRow(row: any, index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this Freight Billing record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;


      if (!row.ZREFNO || !row.ZINV_NO || !row.ZLINE_NO) {
        Swal.fire('Error', 'Primary key missing', 'error');
        return;
      }

      const payload = {
        CHANGE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZBILLNO: row.ZBILLNO,
            ZLINE_NO: row.ZLINE_NO,

            ZODN_NO: row.ZODN_NO,
            ZSONO: row.ZSONO,
            ZSALE_PERSON: row.ZSALE_PERSON,
            ZBILLDATE: row.ZBILLDATE,
            ZPHY_DATE: row.ZPHY_DATE,
            ZFRT_CHARGES: row.ZFRT_CHARGES,
            ZWORKORDER: row.ZWORKORDER,
            ZBILL_SUBMISSION: row.ZBILL_SUBMISSION,
            ZWORK_ORDER: row.ZWORK_ORDER,
            ZLRNO: row.ZLRNO,
            ZTRANSPORTER: row.ZTRANSPORTER,
            ZLOCATION: row.ZLOCATION,
            ZVEH_LINE: row.ZVEH_LINE,
            ZVEH_NUM: row.ZVEH_NUM,
            ZCREATED_DT: row.ZCREATED_DT,
            ZPLANT: row.ZPLANT,
            ZDIVISION: row.ZDIVISION,
            ZVEH_TYPE: row.ZVEH_TYPE,
            ZPRO_CHK: row.ZPRO_CHK,
            ZACC_CHK: row.ZACC_CHK,
            ZPROVDT: row.ZPROVDT,
            ZPROVAMT: row.ZPROVAMT,
            ZFRBILLUP: row.ZFRBILLUP,
            ZUNLOADAPP: row.ZUNLOADAPP,
            ZDETENTUP: row.ZDETENTUP,
            ZWORDUP: row.ZWORDUP,

            // ✅ Freight Charges Breakdown
            ZFC_BASIC: row.ZFC_BASIC || 0,
            ZFC_DELOAD: row.ZFC_DELOAD || 0,
            ZFC_DEUNLOAD: row.ZFC_DEUNLOAD || 0,
            ZFC_LOAD: row.ZFC_LOAD || 0,
            ZFC_UNLOAD: row.ZFC_UNLOAD || 0,
            ZFC_ROUTE: row.ZFC_ROUTE || 0,
            ZFC_TSHIP: row.ZFC_TSHIP || 0,
            ZFC_OTHER: row.ZFC_OTHER || 0,
            ZFC_DEDUCT: row.ZFC_DEDUCT || 0,

            // ✅ Provision Amount Breakdown
            ZPR_BASIC: row.ZPR_BASIC || 0,
            ZPR_DELOAD: row.ZPR_DELOAD || 0,
            ZPR_DEUNLOAD: row.ZPR_DEUNLOAD || 0,
            ZPR_LOAD: row.ZPR_LOAD || 0,
            ZPR_UNLOAD: row.ZPR_UNLOAD || 0,
            ZPR_ROUTE: row.ZPR_ROUTE || 0,
            ZPR_TSHIP: row.ZPR_TSHIP || 0,
            ZPR_OTHER: row.ZPR_OTHER || 0,
            ZPR_DEDUCT: row.ZPR_DEDUCT || 0
          }
        ]
      };

      console.log('🛠 FREIGHT BILLING CHANGE PAYLOAD:', payload);

      this.spinner.show();


      const request$ =
        this.sapType === 'SAP'
          ? this.service.FreightBillingChangeWithSap(payload)
          : this.service.FreightBillingChangeWithoutSap(payload);

      request$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res?.NUMBER === '200' || res?.STATUS === 'TRUE') {
            Swal.fire({
              icon: 'success',
              text: res.MESSAGE || 'Freight Billing updated successfully',
              confirmButtonText: 'Ok'
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
              this.onSearchReference();
            });
          } else {
            Swal.fire({
              icon: 'error',
              text: res.MESSAGE || 'Failed to update Freight Billing'
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
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      const apiCall = this.sapType === 'SAP'
        ? this.service.FreightBillingChangeWithSap(payload)
        : this.service.FreightBillingChangeWithoutSap(payload);

      apiCall.subscribe({
        next: (res: any) => {


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

  resetDetails(): FreightDetails {
    return {
      basicFreight: 0,
      detentionLoading: 0,
      detentionUnloading: 0,
      loadingCharges: 0,
      unloadingCharges: 0,
      routeChangeCharges: 0,
      transhipmentCharges: 0,
      otherCharges: 0,
      deduction: 0,
    };
  }

  loadInitialData() {
    const initialSavedData = {};
    Object.assign(this.freightDetails, initialSavedData);
    this.calculateTotal();
  }

  calculateTotal(): number {
    const d = this.freightDetails;

    const toNum = (val: any) => Number(val) || 0;

    const sumCharges =
      toNum(d.basicFreight) +
      toNum(d.detentionLoading) +
      toNum(d.detentionUnloading) +
      toNum(d.loadingCharges) +
      toNum(d.unloadingCharges) +
      toNum(d.routeChangeCharges) +
      toNum(d.transhipmentCharges) +
      toNum(d.otherCharges);

    this.totalFreight = sumCharges - toNum(d.deduction);

    return this.totalFreight;
  }

  openModal(calculateTotalpopup: any, type: 'freight' | 'provision') {

    // ✅ If user is opening Freight popup after Provision popup → reset all popup fields
    if (this.popupType === 'provision' && type === 'freight') {
      this.freightDetails = this.resetDetails();
      this.totalFreight = 0;
    }

    this.popupType = type;

    // ✅ Only block Freight popup when FreightCharges disabled
    if (type === 'freight' && this.FreightBilling.get('FreightCharges')?.disabled) {
      Swal.fire({
        title: 'Field Disabled',
        text: 'Freight Charges cannot be edited when Work Order Number is selected.',
        icon: 'info',
        confirmButtonText: 'Ok',
        timer: 3000
      });
      return;
    }

    this.calculateTotal();

    this.currentCalculateModalRef = this.modalService.open(calculateTotalpopup, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });

    this.currentCalculateModalRef.result.finally(() => {
      // ✅ If provision popup closed → reset popup values
      if (type === 'provision') {
        this.freightDetails = this.resetDetails();
        this.totalFreight = 0;
      }
      this.currentCalculateModalRef = null;
    });
  }

  saveAndCloseModal() {
    const finalTotal = this.calculateTotal();

    if (this.isPAModalContext) {
      // For P/A Check Modal - store BOTH the total AND the breakdown
      if (this.popupType === 'freight') {
        this.paFormData.freightCharges = finalTotal;
        // ✅ Store the breakdown details
        this.paFreightBreakdown = { ...this.freightDetails };
      } else if (this.popupType === 'provision') {
        this.paFormData.provisionAmount = finalTotal;
        // ✅ Store the breakdown details
        this.paProvisionBreakdown = { ...this.freightDetails };
      }
      this.isPAModalContext = false;
    } else {
      // For Creation Form (existing logic)
      if (this.popupType === 'freight') {
        this.FreightBilling.get('FreightCharges')?.setValue(finalTotal);
        // ✅ Store the breakdown for Account checkbox
        this.paFreightBreakdown = { ...this.freightDetails };
      } else if (this.popupType === 'provision') {
        this.FreightBilling.get('ProvisionAmount')?.setValue(finalTotal);
        // ✅ Store the breakdown for Provision checkbox
        this.paProvisionBreakdown = { ...this.freightDetails };
      }
    }

    // Close only the calculate total popup, not all modals
    if (this.currentCalculateModalRef) {
      this.currentCalculateModalRef.close();
      this.currentCalculateModalRef = null;
    }
  }

  cancelModal() {
    if (this.isPAModalContext) {
      // Reset popup data but don't clear the saved breakdown or paFormData
      this.freightDetails = this.resetDetails();
      this.totalFreight = 0;
      this.isPAModalContext = false;
    } else if (this.popupType === 'provision') {
      this.resetPopupData();
    }

    // Close only the calculate total popup, not all modals
    if (this.currentCalculateModalRef) {
      this.currentCalculateModalRef.dismiss();
      this.currentCalculateModalRef = null;
    }
  }

  resetPopupData() {
    this.freightDetails = this.resetDetails();
    this.totalFreight = 0;
  }

  openPAModal(calculateTotalpopup: any, type: 'freight' | 'provision') {
    this.isPAModalContext = true;
    this.popupType = type;

    // ✅ Load the BREAKDOWN details, not just the total
    if (type === 'freight') {
      // Check if we have saved breakdown details
      const hasBreakdown = Object.values(this.paFreightBreakdown).some(val => val !== 0);

      if (hasBreakdown) {
        // Restore the breakdown
        this.freightDetails = { ...this.paFreightBreakdown };
      } else if (this.paFormData.freightCharges) {
        // If no breakdown but have a total, put it in basicFreight
        this.freightDetails = this.resetDetails();
        this.freightDetails.basicFreight = Number(this.paFormData.freightCharges) || 0;
      } else {
        // Fresh start
        this.freightDetails = this.resetDetails();
      }
      this.totalFreight = this.calculateTotal();

    } else if (type === 'provision') {
      // Check if we have saved breakdown details
      const hasBreakdown = Object.values(this.paProvisionBreakdown).some(val => val !== 0);

      if (hasBreakdown) {
        // Restore the breakdown
        this.freightDetails = { ...this.paProvisionBreakdown };
      } else if (this.paFormData.provisionAmount) {
        // If no breakdown but have a total, put it in basicFreight
        this.freightDetails = this.resetDetails();
        this.freightDetails.basicFreight = Number(this.paFormData.provisionAmount) || 0;
      } else {
        // Fresh start
        this.freightDetails = this.resetDetails();
      }
      this.totalFreight = this.calculateTotal();

    } else {
      this.freightDetails = this.resetDetails();
      this.totalFreight = 0;
    }

    this.currentCalculateModalRef = this.modalService.open(calculateTotalpopup, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
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
      GLOBAL: 'FREIGHT BILLING',
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
          this.FreightBillingData = [];
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
          this.FreightBillingData = records;
          this.dispatchData = [];
          Swal.fire('Success', `Freight Billing records: ${records.length}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.FreightBillingData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.FreightBillingData = [];
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
      exportSource = this.FreightBillingData;
      fileName = this.sapType === 'SAP' ? 'FreightBilling_Completed_SAP.xlsx' : 'FreightBilling_Completed_NonSAP.xlsx';
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
        'REFNO': record.ZREFNO || '',
        'Invoice No': record.ZINV_NO || '',
        'Odn Number': record.ZODN_NO || '',
        'SO Number': record.ZSONO || '',
        'Sale Person': record.ZSALE_PERSON || '',
        'Freight Bill No': record.ZBILLNO || '',
        'Freight Bill Date': record.ZBILLDATE || '',
        'Physical Submission Date': record.ZPHY_DATE || '',
        'Freight Charges': record.ZFRT_CHARGES || '',
        'Work Order Type': record.ZWORKORDER || '',
        'Bill Submission': record.ZBILL_SUBMISSION || '',
        'Location': record.ZLOCATION || '',
        'Vehicle Line': record.ZVEH_LINE || '',
        'Vehicle Number': record.ZVEH_NUM || '',
        'Plant': record.ZPLANT || '',
        'Division': record.ZDIVISION || '',
        'Work Order': record.ZWORK_ORDER || '',
        'LR No': record.ZLRNO || '',
        'Transporter': record.ZTRANSPORTER || '',
        'Created Date': record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        'Vehicle Type': record.ZVEH_TYPE || '',
       'Provision': record.ZPRO_CHK === 'X' ? 'Yes' : 'No',
    'Provision Amount': record.ZPROVAMT || '',
    'Provision Date': record.ZPROVDT || '',
    'Account': record.ZACC_CHK === 'X' ? 'Yes' : 'No',

   
    'Basic Amount': record.ZPR_BASIC || '',
    'Deload Charges': record.ZPR_DELOAD || '',
    'DeUnload Charges': record.ZPR_DEUNLOAD || '',
    'Load Charges': record.ZPR_LOAD || '',
    'Unload Charges': record.ZPR_UNLOAD || '',
    'Route Charges': record.ZPR_ROUTE || '',
    'Transshipment Charges': record.ZPR_TSHIP || '',
    'Other Charges': record.ZPR_OTHER || '',
    'Deduction': record.ZPR_DEDUCT ||''

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
      exportSource = this.FreightBillingData;
      fileName = this.sapType === 'SAP' ? 'Freight_Billing_Completed_SAP.pdf' : 'Freight_Billing_Completed_NonSAP.pdf';
      reportTitle = 'Freight Billing Records (Completed)';
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
        'Odn Number',
        'SO Number',
        'Sale Person',
        'Freight Bill No',
        'Freight Bill Date',
        'Physical Submission Date',
        'Freight Charges',
        'Work Order Type',
        'Bill Submission',
        'Location',
        'Vehicle Line',
        'Vehicle Number',
        'Plant',
        'Division',
        'Work Order',
        'LR No',
        'Transporter',
        'Created Date',
        'Vehicle Type',
         'Provision',
    'Provision Amount',
    'Provision Date',
    'Account',
    'Basic Amount',
    'Deload Charges',
    'DeUnload Charges',
    'Load Charges',
    'Unload Charges',
    'Route Charges',
    'Transshipment Charges',
    'Other Charges',
    'Deduction'

      ]];


      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.ZINV_NO || '',
        record.ZODN_NO || '',
        record.ZSONO || '',
        record.ZSALE_PERSON || '',
        record.ZBILLNO || '',
        record.ZBILLDATE || '',
        record.ZPHY_DATE || '',
        record.ZFRT_CHARGES || '',
        record.ZWORKORDER || '',
        record.ZBILL_SUBMISSION || '',
        record.ZLOCATION || '',
        record.ZVEH_LINE || '',
        record.ZVEH_NUM || '',
        record.ZPLANT || '',
        record.ZDIVISION || '',
        record.ZWORK_ORDER || '',
        record.ZLRNO || '',
        record.ZTRANSPORTER || '',
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB')
          : '',
        record.ZVEH_TYPE || '',
         
  record.ZPRO_CHK === 'X' ? 'Yes' : 'No',
  record.ZPROVAMT || '',
  record.ZPROVDT
    ? new Date(record.ZPROVDT).toLocaleDateString('en-GB')
    : '',
  record.ZACC_CHK === 'X' ? 'Yes' : 'No',
  record.ZPR_BASIC || '',
  record.ZPR_DELOAD || '',
  record.ZPR_DEUNLOAD || '',
  record.ZPR_LOAD || '',
  record.ZPR_UNLOAD || '',
  record.ZPR_ROUTE || '',
  record.ZPR_TSHIP || '',
  record.ZPR_OTHER || '',
  record.ZPR_DEDUCT || ''

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
      theme: 'grid'
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  }

  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'FREIGHT BILLING'
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
  onFreightBillDateChange() {
    const freightDate = this.FreightBilling.get('FreightBillDate')?.value;

    if (freightDate) {
      const date = new Date(freightDate);
      date.setDate(date.getDate() + 2);
      this.minPhysicalDate = date.toISOString().split('T')[0];
      const physicalDate = this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.value;
      if (physicalDate && physicalDate < this.minPhysicalDate) {
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValue('');
      }
      // Also ensure BillSubmission is not earlier than allowed minimum
      const billSubmission = this.FreightBilling.get('BillSubmission')?.value;
      if (billSubmission && billSubmission < this.minPhysicalDate) {
        this.FreightBilling.get('BillSubmission')?.setValue('');
      }
    }
  }

  onPAFreightBillDateChange() {
    const freightDate = this.paFormData.freightBillDate;

    if (freightDate) {
      const date = new Date(freightDate);
      date.setDate(date.getDate() + 2);
      this.minPhysicalDate = date.toISOString().split('T')[0];

      // Clear physical submission date if it's earlier than minimum
      if (this.paFormData.physicalSubmissionDate &&
        this.paFormData.physicalSubmissionDate < this.minPhysicalDate) {
        this.paFormData.physicalSubmissionDate = '';
      }

      // Clear bill submission date if it's earlier than minimum
      if (this.paFormData.billSubmission &&
        this.paFormData.billSubmission < this.minPhysicalDate) {
        this.paFormData.billSubmission = '';
      }
    }
  }

  onProvisionChange() {
    const provisionChecked = this.FreightBilling.get('provision')?.value;

    if (provisionChecked) {
      this.FreightBilling.patchValue({ account: false });

      this.showProvisionFields = true;
      this.showAccountFields = false;
    } else {
      this.showProvisionFields = false;
    }
  }

  onAccountChange() {
    const accountChecked = this.FreightBilling.get('account')?.value;

    if (accountChecked) {
      this.FreightBilling.patchValue({ provision: false });

      this.showAccountFields = true;
      this.showProvisionFields = false;
    } else {
      this.showAccountFields = false;
    }
  }

  viewPACheck(item: any): void {
    this.selectedPAData = item;

    // Get reference to the modal template
    const modalRef = this.modalService.open(
      document.querySelector('#pACheckModal') as any,
      {
        backdrop: 'static',
        keyboard: false,
        size: 'md',
        centered: true
      }
    );
  }



  // Open modal and load data
  openPACheckModal(template: any, item: any, index: number): void {

    if (!item.isEdit) {
      Swal.fire({
        title: 'Edit Required',
        text: 'If you want to edit, please click the Edit button first.',
        icon: 'info',
        confirmButtonText: 'Ok',
        timer: 3000
      });
      return;  // ⬅️ Exit without opening modal
    }
    this.selectedPAItem = item;
    this.selectedPAIndex = index;


    // Load existing data into form
    this.paFormData = {
      provisionChecked: item.ZPRO_CHK === 'X',
      provisionAmount: item.ZPROVAMT || '',
      provisionDate: item.ZPROVDT || '',
      accountChecked: item.ZACC_CHK === 'X',
      freightBillNumber: item.ZBILLNO || '',
      freightBillDate: item.ZBILLDATE || '',
      physicalSubmissionDate: item.ZPHY_DATE || '',
      freightCharges: item.ZFRT_CHARGES || '',
      billSubmission: item.ZBILL_SUBMISSION || ''
    };

    // ✅ Load Freight Breakdown from backend
    this.paFreightBreakdown = {
      basicFreight: item.ZFC_BASIC || 0,
      detentionLoading: item.ZFC_DELOAD || 0,
      detentionUnloading: item.ZFC_DEUNLOAD || 0,
      loadingCharges: item.ZFC_LOAD || 0,
      unloadingCharges: item.ZFC_UNLOAD || 0,
      routeChangeCharges: item.ZFC_ROUTE || 0,
      transhipmentCharges: item.ZFC_TSHIP || 0,
      otherCharges: item.ZFC_OTHER || 0,
      deduction: item.ZFC_DEDUCT || 0
    };

    // ✅ Load Provision Breakdown from backend
    this.paProvisionBreakdown = {
      basicFreight: item.ZPR_BASIC || 0,
      detentionLoading: item.ZPR_DELOAD || 0,
      detentionUnloading: item.ZPR_DEUNLOAD || 0,
      loadingCharges: item.ZPR_LOAD || 0,
      unloadingCharges: item.ZPR_UNLOAD || 0,
      routeChangeCharges: item.ZPR_ROUTE || 0,
      transhipmentCharges: item.ZPR_TSHIP || 0,
      otherCharges: item.ZPR_OTHER || 0,
      deduction: item.ZPR_DEDUCT || 0
    };

    this.modalService.open(template, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      centered: true
    });
  }

  // Handle provision checkbox
  onProvisionCheckChange(): void {

  }

  // Handle account checkbox
  onAccountCheckChange(): void {

  }

  // Update P/A details - calls existing updateSearchRow method
  updatePADetails(): void {

    if (this.paFormData.provisionChecked) {
      this.selectedPAItem.ZPRO_CHK = 'X';
      this.selectedPAItem.ZPROVAMT = this.paFormData.provisionAmount;
      this.selectedPAItem.ZPROVDT = this.paFormData.provisionDate;

      // ✅ Store Provision Breakdown
      this.selectedPAItem.ZPR_BASIC = this.paProvisionBreakdown.basicFreight || 0;
      this.selectedPAItem.ZPR_DELOAD = this.paProvisionBreakdown.detentionLoading || 0;
      this.selectedPAItem.ZPR_DEUNLOAD = this.paProvisionBreakdown.detentionUnloading || 0;
      this.selectedPAItem.ZPR_LOAD = this.paProvisionBreakdown.loadingCharges || 0;
      this.selectedPAItem.ZPR_UNLOAD = this.paProvisionBreakdown.unloadingCharges || 0;
      this.selectedPAItem.ZPR_ROUTE = this.paProvisionBreakdown.routeChangeCharges || 0;
      this.selectedPAItem.ZPR_TSHIP = this.paProvisionBreakdown.transhipmentCharges || 0;
      this.selectedPAItem.ZPR_OTHER = this.paProvisionBreakdown.otherCharges || 0;
      this.selectedPAItem.ZPR_DEDUCT = this.paProvisionBreakdown.deduction || 0;
    } else {
      this.selectedPAItem.ZPRO_CHK = '';
      this.selectedPAItem.ZPROVAMT = '';
      this.selectedPAItem.ZPROVDT = '';

      // ✅ Clear Provision Breakdown
      this.selectedPAItem.ZPR_BASIC = 0;
      this.selectedPAItem.ZPR_DELOAD = 0;
      this.selectedPAItem.ZPR_DEUNLOAD = 0;
      this.selectedPAItem.ZPR_LOAD = 0;
      this.selectedPAItem.ZPR_UNLOAD = 0;
      this.selectedPAItem.ZPR_ROUTE = 0;
      this.selectedPAItem.ZPR_TSHIP = 0;
      this.selectedPAItem.ZPR_OTHER = 0;
      this.selectedPAItem.ZPR_DEDUCT = 0;
    }


    if (this.paFormData.accountChecked) {
      this.selectedPAItem.ZACC_CHK = 'X';
      this.selectedPAItem.ZBILLNO = this.paFormData.freightBillNumber;
      this.selectedPAItem.ZBILLDATE = this.paFormData.freightBillDate;
      this.selectedPAItem.ZPHY_DATE = this.paFormData.physicalSubmissionDate;
      this.selectedPAItem.ZFRT_CHARGES = this.paFormData.freightCharges;
      this.selectedPAItem.ZBILL_SUBMISSION = this.paFormData.billSubmission;

      // ✅ Store Freight Breakdown
      this.selectedPAItem.ZFC_BASIC = this.paFreightBreakdown.basicFreight || 0;
      this.selectedPAItem.ZFC_DELOAD = this.paFreightBreakdown.detentionLoading || 0;
      this.selectedPAItem.ZFC_DEUNLOAD = this.paFreightBreakdown.detentionUnloading || 0;
      this.selectedPAItem.ZFC_LOAD = this.paFreightBreakdown.loadingCharges || 0;
      this.selectedPAItem.ZFC_UNLOAD = this.paFreightBreakdown.unloadingCharges || 0;
      this.selectedPAItem.ZFC_ROUTE = this.paFreightBreakdown.routeChangeCharges || 0;
      this.selectedPAItem.ZFC_TSHIP = this.paFreightBreakdown.transhipmentCharges || 0;
      this.selectedPAItem.ZFC_OTHER = this.paFreightBreakdown.otherCharges || 0;
      this.selectedPAItem.ZFC_DEDUCT = this.paFreightBreakdown.deduction || 0;
    } else {
      this.selectedPAItem.ZACC_CHK = '';
      this.selectedPAItem.ZBILLNO = '';
      this.selectedPAItem.ZBILLDATE = '';
      this.selectedPAItem.ZPHY_DATE = '';
      this.selectedPAItem.ZFRT_CHARGES = '';
      this.selectedPAItem.ZBILL_SUBMISSION = '';

      // ✅ Clear Freight Breakdown
      this.selectedPAItem.ZFC_BASIC = 0;
      this.selectedPAItem.ZFC_DELOAD = 0;
      this.selectedPAItem.ZFC_DEUNLOAD = 0;
      this.selectedPAItem.ZFC_LOAD = 0;
      this.selectedPAItem.ZFC_UNLOAD = 0;
      this.selectedPAItem.ZFC_ROUTE = 0;
      this.selectedPAItem.ZFC_TSHIP = 0;
      this.selectedPAItem.ZFC_OTHER = 0;
      this.selectedPAItem.ZFC_DEDUCT = 0;
    }

    // Close modal
    this.modalService.dismissAll();

    // Call existing update method
    this.updateSearchRow(this.selectedPAItem, this.selectedPAIndex);
  }
}