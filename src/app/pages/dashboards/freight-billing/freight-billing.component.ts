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

  // setupWorkOrderListener(): void {
  //   const fields = [
  //     'FreightBillNumber',
  //     'FreightBillDate',
  //     'FreightBillPhysicalSubmissionDate',
  //     'FreightCharges'
  //   ];

  //   // FIRST TIME → ENABLE ALL FIELDS BY DEFAULT
  //   fields.forEach(f => {
  //     this.FreightBilling.get(f)?.enable({ emitEvent: false });
  //   });

  //   this.FreightBilling.get('WorkOrderNumber')?.valueChanges.subscribe((value) => {

  //     // → WORK ORDER NUMBER select chesina ENABLE
  //     if (value === 'WORK ORDER NUMBER') {
  //       fields.forEach(f => {
  //         this.FreightBilling.get(f)?.enable();
  //       });
  //     }

  //     // → Rate Contract / Customer Transporter / Local Transporter / Company Vehicle → DISABLE
  //     else if (value && value !== '') {
  //       fields.forEach(f => {
  //         this.FreightBilling.get(f)?.disable();
  //         this.FreightBilling.get(f)?.setValue('');
  //       });
  //     }

  //     // → EMPTY select chesina (Select Option) → ENABLE
  //     else {
  //       fields.forEach(f => {
  //         this.FreightBilling.get(f)?.enable();
  //       });
  //     }
  //   });
  // }


  // disableFreightFields() {
  //   const fields = ['FreightBillNumber', 'FreightBillDate', 'FreightBillPhysicalSubmissionDate', 'FreightCharges'];
  //   fields.forEach(f => {
  //     this.FreightBilling.get(f)?.clearValidators();
  //     this.FreightBilling.get(f)?.disable();
  //     this.FreightBilling.get(f)?.setValue('');
  //   });
  // }

  // enableFreightFields() {
  //   this.FreightBilling.get('FreightBillNumber')?.setValidators([Validators.required]);
  //   this.FreightBilling.get('FreightBillDate')?.setValidators([Validators.required]);
  //   this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValidators([Validators.required]);
  //   this.FreightBilling.get('FreightCharges')?.setValidators([Validators.required, Validators.min(0)]);

  //   this.FreightBilling.get('FreightBillNumber')?.enable();
  //   this.FreightBilling.get('FreightBillDate')?.enable();
  //   this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.enable();
  //   this.FreightBilling.get('FreightCharges')?.enable();
  // }

  // updateFreightValidators() {
  //   this.FreightBilling.get('FreightBillNumber')?.updateValueAndValidity();
  //   this.FreightBilling.get('FreightBillDate')?.updateValueAndValidity();
  //   this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.updateValueAndValidity();
  //   this.FreightBilling.get('FreightCharges')?.updateValueAndValidity();
  // }


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

  // populateReferenceRows(data: any[]): void {
  //   this.referenceItems.clear();

  //   if (data && data.length > 0) {
  //     data.forEach(d => {
  //       this.referenceItems.push(
  //         this.fb.group({
  //           referenceNumber: [d.REF_NO || ''],
  //           workOrderNumber: [d.WORK_ORDER_NO || ''],
  //           lrNumber: [d.LR_NO || ''],
  //           transporter: [d.TRANSPORTER || '']
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

    if (data && data.length > 0) {
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
      WORDUP: formValue.WorkOrderUploading || ''
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
              ZWORDUP: row.ZWORDUP
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

    this.modalService.open(calculateTotalpopup, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    }).result.finally(() => {

      // ✅ If provision popup closed → reset popup values
      if (type === 'provision') {
        this.freightDetails = this.resetDetails();
        this.totalFreight = 0;
      }

    });
  }

  saveAndCloseModal() {
    const finalTotal = this.calculateTotal();

    if (this.isPAModalContext) {
      // For P/A Check Modal
      if (this.popupType === 'freight') {
        this.paFormData.freightCharges = finalTotal;
      } else if (this.popupType === 'provision') {
        this.paFormData.provisionAmount = finalTotal;
      }
      this.isPAModalContext = false;
    } else {
      // For Creation Form (existing logic)
      if (this.popupType === 'freight') {
        this.FreightBilling.get('FreightCharges')?.setValue(finalTotal);
      } else if (this.popupType === 'provision') {
        this.FreightBilling.get('ProvisionAmount')?.setValue(finalTotal);
      }
    }

    this.modalService.dismissAll();
  }

  cancelModal() {
    if (this.popupType === 'provision') {
      this.resetPopupData();
    }
    this.isPAModalContext = false;
    this.modalService.dismissAll();
  }

  resetPopupData() {
    this.freightDetails = this.resetDetails();
    this.totalFreight = 0;
  }

  openPAModal(calculateTotalpopup: any, type: 'freight' | 'provision') {
    this.isPAModalContext = true;
    this.popupType = type;


    this.freightDetails = this.resetDetails();
    this.totalFreight = 0;

    this.modalService.open(calculateTotalpopup, {
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
    } else {
      this.selectedPAItem.ZPRO_CHK = '';
      this.selectedPAItem.ZPROVAMT = '';
      this.selectedPAItem.ZPROVDT = '';
    }


    if (this.paFormData.accountChecked) {
      this.selectedPAItem.ZACC_CHK = 'X';
      this.selectedPAItem.ZBILLNO = this.paFormData.freightBillNumber;
      this.selectedPAItem.ZBILLDATE = this.paFormData.freightBillDate;
      this.selectedPAItem.ZPHY_DATE = this.paFormData.physicalSubmissionDate;
      this.selectedPAItem.ZFRT_CHARGES = this.paFormData.freightCharges;
      this.selectedPAItem.ZBILL_SUBMISSION = this.paFormData.billSubmission;
    } else {
      this.selectedPAItem.ZACC_CHK = '';
      this.selectedPAItem.ZBILLNO = '';
      this.selectedPAItem.ZBILLDATE = '';
      this.selectedPAItem.ZPHY_DATE = '';
      this.selectedPAItem.ZFRT_CHARGES = '';
      this.selectedPAItem.ZBILL_SUBMISSION = '';
    }

    // Close modal
    this.modalService.dismissAll();

    // Call existing update method
    this.updateSearchRow(this.selectedPAItem, this.selectedPAIndex);
  }




}