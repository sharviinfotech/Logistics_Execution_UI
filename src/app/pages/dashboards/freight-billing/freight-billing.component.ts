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

  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  isUpdateMode: boolean = false;

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
  Vehicle_Form!: FormGroup;
  FreightBillingData: any[] = [];
  dispatchData: any[] = [];
  filterSapType: string = '';

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
    this.setupWorkOrderListener();
    this.fetchTransporter();
    this.fetchPlantCodeList();
  }

  initializeForm(): void {
    this.FreightBilling = this.fb.group({
      ponumber: [''],
      REFNO: [''],
      invoicenumber: [''],
      FreightBillNumber: ['', Validators.required],
      FreightBillDate: ['', Validators.required],
      FreightBillPhysicalSubmissionDate: ['', Validators.required],
      FreightCharges: ['', [Validators.required, Validators.min(0)]],
      WorkOrderNumber: [''],
      BillSubmission: ['', Validators.required],
      LRNO: [''],
      TRANSPORTER: [''],
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
      transporter: ['']
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

  setupWorkOrderListener(): void {
    const fields = [
      'FreightBillNumber',
      'FreightBillDate',
      'FreightBillPhysicalSubmissionDate',
      'FreightCharges'
    ];

    // FIRST TIME → ENABLE ALL FIELDS BY DEFAULT
    fields.forEach(f => {
      this.FreightBilling.get(f)?.enable({ emitEvent: false });
    });

    this.FreightBilling.get('WorkOrderNumber')?.valueChanges.subscribe((value) => {

      // → WORK ORDER NUMBER select chesina ENABLE
      if (value === 'WORK ORDER NUMBER') {
        fields.forEach(f => {
          this.FreightBilling.get(f)?.enable();
        });
      }

      // → Rate Contract / Customer Transporter / Local Transporter / Company Vehicle → DISABLE
      else if (value && value !== '') {
        fields.forEach(f => {
          this.FreightBilling.get(f)?.disable();
          this.FreightBilling.get(f)?.setValue('');
        });
      }

      // → EMPTY select chesina (Select Option) → ENABLE
      else {
        fields.forEach(f => {
          this.FreightBilling.get(f)?.enable();
        });
      }
    });
  }


  disableFreightFields() {
    const fields = ['FreightBillNumber', 'FreightBillDate', 'FreightBillPhysicalSubmissionDate', 'FreightCharges'];
    fields.forEach(f => {
      this.FreightBilling.get(f)?.clearValidators();
      this.FreightBilling.get(f)?.disable();
      this.FreightBilling.get(f)?.setValue('');
    });
  }

  enableFreightFields() {
    this.FreightBilling.get('FreightBillNumber')?.setValidators([Validators.required]);
    this.FreightBilling.get('FreightBillDate')?.setValidators([Validators.required]);
    this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValidators([Validators.required]);
    this.FreightBilling.get('FreightCharges')?.setValidators([Validators.required, Validators.min(0)]);

    this.FreightBilling.get('FreightBillNumber')?.enable();
    this.FreightBilling.get('FreightBillDate')?.enable();
    this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.enable();
    this.FreightBilling.get('FreightCharges')?.enable();
  }

  updateFreightValidators() {
    this.FreightBilling.get('FreightBillNumber')?.updateValueAndValidity();
    this.FreightBilling.get('FreightBillDate')?.updateValueAndValidity();
    this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.updateValueAndValidity();
    this.FreightBilling.get('FreightCharges')?.updateValueAndValidity();
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

    this.FreightBilling.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

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
      BILLNO: formValue.FreightBillNumber || '',
      BILLDATE: formValue.FreightBillDate || '',
      PHY_DATE: formValue.FreightBillPhysicalSubmissionDate || '',
      FRT_CHARGES: formValue.FreightCharges || 0,
      ORDER_NO: formValue.WorkOrderNumber || '',
      WORKORDER: ref.workOrderNumber || '',
      LRNO: ref.lrNumber || formValue.LRNO || '',
      TRANSPORTER: ref.transporter || '',
      BILL_SUBMISSION: formValue.BillSubmission,
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
    }).then((result) => {
      if (!result.isConfirmed) return;

      // ✅ SAME payload as saveFreightBilling
      const record = {
        INV_NO: row.ZINV_NO || '',
        REFNO: row.ZREFNO || '',
        BILLNO: row.FreightBillNumber || row.ZBILLNO || '',
        BILLDATE: row.FreightBillDate || row.ZBILLDATE || '',
        PHY_DATE: row.FreightBillPhysicalSubmissionDate || row.ZPHY_DATE || '',
        FRT_CHARGES: row.FreightCharges || row.ZFRT_CHARGES || 0,
        ORDER_NO: row.WorkOrderNumber || row.ZORDER_NO || '',
        WORKORDER: row.ZWORK_ORDER || '',
        LRNO: row.ZLRNO || '',
        TRANSPORTER: row.ZTRANSPORTER || '',
        BILL_SUBMISSION: row.BillSubmission || row.ZBILL_SUBMISSION || '',
      };

      console.log('🛠 FREIGHT BILLING UPDATE PAYLOAD:', record);

      this.spinner.show();

      // ✅ REPLACED OrderInfo APIs with FreightBilling APIs
      let request$ =
        this.sapType === 'SAP'
          ? this.service.FreightBillingSave({ SAVE: [record] })
          : this.service.FreightBillingNonSap({ CREATE: [record] });

      request$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              icon: 'success',
              text: res.MESSAGE || 'Freight Billing updated successfully',
              confirmButtonText: 'Ok'
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
              this.onSearchReference(); // refresh table
            });
          } else {
            Swal.fire({
              icon: 'error',
              text: res.MESSAGE || 'Failed to update Freight Billing',
            });
          }
        },
        (error) => {
          this.spinner.hide();
          console.error('❌ Freight Billing Update Error:', error);
          Swal.fire({
            icon: 'error',
            text: 'Internal Server Error. Please try again later.'
          });
        }
      );
    });
  }




  deleteRow(row: any, index: number): void {
    if (row.SAP_TYPE === 'SAP') {
      this.DeleteWithSap(row, index);
    } else {
      this.DeleteWithoutSap(row, index);
    }
  }

  DeleteWithSap(row: any, index: number): void {
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

      // 🔹 Prepare request payload (With SAP format)
      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      // 🔹 Call API
      this.service.FreightBillingDeleteWithSap(payload).subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE') {
            // 🔹 Remove row from table only after success
            this.searchOptionsList.splice(index, 1);

            Swal.fire({
              title: 'Deleted',
              text: res.MESSAGE || 'Record deleted successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
          } else {
            Swal.fire({
              title: 'Failed',
              text: res?.MESSAGE || 'Delete failed',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'Something went wrong while deleting',
            icon: 'error'
          });
        }
      });
    });
  }
  DeleteWithoutSap(row: any, index: number): void {
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

      // 🔹 Prepare request payload (With SAP format)
      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      // 🔹 Call API
      this.service.FreightBillingDeleteWithOutSap(payload).subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE') {
            // 🔹 Remove row from table only after success
            this.searchOptionsList.splice(index, 1);

            Swal.fire({
              title: 'Deleted',
              text: res.MESSAGE || 'Record deleted successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
          } else {
            Swal.fire({
              title: 'Failed',
              text: res?.MESSAGE || 'Delete failed',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'Something went wrong while deleting',
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

  openModal(calculateTotalpopup: any) {
    if (this.FreightBilling.get('FreightCharges')?.disabled) {
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
    this.modalService.open(calculateTotalpopup, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

  saveAndCloseModal() {
    const finalTotal = this.calculateTotal();
    console.log("finalTotal", finalTotal);

    this.FreightBilling.get('FreightCharges')?.setValue(finalTotal);
    this.modalService.dismissAll();
    console.log("FreightCharges", this.FreightBilling.get('FreightCharges')?.value);
  }

  cancelModal() {
    this.modalService.dismissAll();
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

  onFilterDivisionChange(): void {
    const plantObj = this.PlantCodeList.find(item => item.DIVISION === this.filterDivision);

    if (plantObj) {
      this.filterPlant = plantObj.PLANT;
    } else {
      this.filterPlant = '';
    }
    this.cd.detectChanges();
  }

  onFilterPlantChange(): void {
    const plantObj = this.PlantCodeList.find(item => item.PLANT === this.filterPlant);

    if (plantObj) {
      this.filterDivision = plantObj.DIVISION;
    } else {
      this.filterDivision = '';
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
          Swal.fire('Success', `Vehicle Info records: ${records.length}`, 'success');
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
        'Vehicle Type': record.ZVEH_TYPE || ''
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
        'Vehicle Type'
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


}