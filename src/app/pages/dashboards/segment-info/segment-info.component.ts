import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-segment-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './segment-info.component.html',
  styleUrls: ['./segment-info.component.css']
})
export class SegmentInfoComponent implements OnInit {
  segmentInfo!: FormGroup;
  showForm = false;
  isSubmitting = false;
  tatValue: string = '';
  etaValue: string = '';

  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  PlantCodeList: any[] = [];

  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // F4 lists from backend
  supplierList: any[] = [];

  segmentList: any[] = [];
  custGrpList: any[] = [];
  branchList: any[] = [];
  appTypeList: any[] = [];
  SegmentData: any[] = [];
  dispatchData: any[] = [];

  // showF4 flags
  showF4 = {
    SALE_PERSON: false,
    SEGMENT: false,
    CUST_PROF: false,
    BRANCH: false,
    APPTYP: false,
  };

  mainMode: string = 'creation'; // Default to creation mode
  isUpdateMode: boolean = false;
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
  VendorCodeList: any[] = [];
  searchOptionsList: any[] = [];
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
  dropdownOpen = false;
  filterSapType: string = '';

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.segmentInfo = this.fb.group({
      INV_VBELN: [''],
      SALE_PERSON: ['', Validators.required],
      SEGMENT: ['', Validators.required],
      APPTYP: ['', Validators.required],
      CUST_PROF: [''],
      BRANCH: ['', Validators.required],
      BRANCH_ZONE: [''],
      TAT_Type: ['', Validators.required],
      TAT_DAYS: ['', Validators.required],
      ETA_DATE: ['', Validators.required],
      referenceItems: this.fb.array([this.createReferenceRow()])
    });

    this.fetchDropdownData();
    this.fetchTransporter();
    this.fetchPlantCodeList();

    // ✅ Subscribe to TAT_Type changes
    this.segmentInfo.get('TAT_Type')?.valueChanges.subscribe(() => {
      if (this.sapType === 'SAP') {
        this.TatTypeChange();
      } else if (this.sapType === 'Non-SAP') {
        this.TatTypeNonSap();
      }
    });
  }

  get referenceItems(): FormArray {
    return this.segmentInfo.get('referenceItems') as FormArray;
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      soNumber: [''],
      odnNumber: [''],
      SONO: [''],       // ✔ match backend
      ODN_NO: ['']
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

  resetF4Flags() {
    this.showF4 = {
      SALE_PERSON: false,
      SEGMENT: false,
      CUST_PROF: false,
      BRANCH: false,
      APPTYP: false,
    };
  }

  enableAllF4() {
    this.showF4 = {
      SALE_PERSON: true,
      SEGMENT: true,
      CUST_PROF: true,
      BRANCH: true,
      APPTYP: true,
    };
  }

  onOrderTypeChange() {
    if (this.previousOrderType && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeChange() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    if (this.orderType === 'Outward' && this.sapType) {
    this.fetchPendingAndCompletedCounts();
  }

    if (this.sapType === 'Non-SAP') {
      this.segmentInfo.reset();
      this.referenceItems.clear();
      this.referenceItems.push(this.createReferenceRow());
      this.enableAllF4();
      this.showForm = true;
    } else if (this.sapType === 'SAP') {
      this.segmentInfo.reset();
      this.referenceItems.clear();
      this.referenceItems.push(this.createReferenceRow());
      this.resetF4Flags();
      this.showForm = false;
    }
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.segmentInfo.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());
    this.resetF4Flags();
  }

  onInputChange(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.segmentInfo.reset();
      this.referenceItems.clear();
      this.referenceItems.push(this.createReferenceRow());
      this.resetF4Flags();
    }
  }

  getForm(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') return;
    if (this.sapType === 'SAP') {
      this.fetchSAPData(type);
    }
  }

  fetchSAPData(type: 'purchase' | 'invoice') {
    const obj = type === 'purchase' ? { VBELN: this.ponumber } : { VBELN: this.invoicenumber };
    this.spinner.show();
    this.service.SegmentInfoOutwardFetch(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
          this.searchOptionsList = [];
        } else {
          Swal.fire('No data found', '', 'info');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching SAP data', '', 'error');
      }
    });
  }

  patchForm(data: any) {
    this.segmentInfo.patchValue({
      REF_NO: data.REFNO || '',
      WORK_ORDER_NO: data.WORK_ORDER || '',
      LR_NO: data.LRNO || '',
      TRANSPORTER: data.TRANSPORTER || '',
      SO_NO: data.SO_NO || '',
      ODN_NO: data.ODN_NO || '',
      INV_VBELN: data.INV_NUM || '',
      SALE_PERSON: data.SALE_PERSON || '',
      SEGMENT: data.SEGMENT || '',
      APPTYP: data.APPTYP || '',
      CUST_PROF: data.CUST_PROFILE || '',
      BRANCH: data.BRANCH || '',
      BRANCH_ZONE: data.BRANCH_ZONE || '',
      TAT_Type: data.TAT_TYPE || '',
      TAT_DAYS: data.TAT || '',
      ETA_DATE: data.ETA || ''
    });

    this.showF4 = {
      SALE_PERSON: !data.SALE_PERSON,
      SEGMENT: !data.SEGMENT,
      CUST_PROF: !data.CUST_PROFILE,
      BRANCH: !data.BRANCH,
      APPTYP: !data.APPTYP
    };
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
      global_scr: 'SEGMENT INFO',
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
            transporter: [d.TRANSPORTER || ''],
            SONO: [d.SONO || d.SO_NO || ''],
            ODN_NO: [d.ODN_NO || ''],  // ODN Number

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
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.referenceItems.at(index) as FormGroup).value;

    if (checkbox.checked) {

      // check duplicate
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

      // remove unchecked row
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

    console.log('Selected Items:', this.selectedItems);
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

      "global": "SEGMENT INFO",
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
          this.searchOptionsList = res.HEADER;
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

  fetchDropdownData(): void {
    this.spinner.show();
    this.service.getssc().subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res && res.length > 0) {
          const data = res[0];
          this.supplierList = data.SUPPLIERS || [];
          this.segmentList = data.SEGMENTS || [];
          this.custGrpList = data.CUST_PROF || [];
          this.branchList = data.BRANCH || [];
          this.appTypeList = data.APP_TYPE || [];
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('F4 fetch error', err);
        Swal.fire('Error', 'Failed to load master dropdown data (F4).', 'error');
      }
    });
  }

  savePlan(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.sapType === 'SAP') {
      this.saveSegmentInfoWithSAP(action);
    } else {
      this.saveSegmentInfoWithoutSAP(action);
    }
  }

  saveSegmentInfoWithSAP(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    this.segmentInfo.markAllAsTouched();

    if (this.segmentInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Outward validation
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const formValue = this.segmentInfo.value;


    // BUILD MULTIPLE RECORDS
    let saveArray: any[] = [];

    if (this.orderType === 'Outward') {
      this.selectedItems.forEach(item => {
        saveArray.push({
          REFNO: item.referenceNumber || 0,
          WORK_ORDER: item.workOrderNumber || '',
          LRNO: item.lrNumber || '',
          TRANSPORTER: item.transporter || '',
          SO_NO: item.SONO || '',           // ✅ FIXED: Read from item.SONO
          ODN_NO: item.ODN_NO || '',        // ✅ Already correct

          INV_NUM: formValue.INV_VBELN || this.invoicenumber || '',
          SALE_PERSON: formValue.SALE_PERSON || '',
          SEGMENT: formValue.SEGMENT || '',
          APPTYP: formValue.APPTYP || '',

          CUST_PROFILE: formValue.CUST_PROF || '',
          BRANCH: formValue.BRANCH || '',
          BRANCH_ZONE: formValue.BRANCH_ZONE || '',
          TAT_TYPE: formValue.TAT_Type || '',
          TAT: formValue.TAT_DAYS || '',
          ETA: formValue.ETA_DATE || ''
        });
      });
    }

    const payload = {
      SAVE: saveArray
    };

    console.log("✅ Saving Segment Info with SO_NO & ODN_NO:", payload);

    this.spinner.show();
    this.service.SegmentInfoOutwardSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            title: 'Success',
            text: res.MESSAGE,
            icon: 'success',
            confirmButtonText: 'Ok',
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/vehicle-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/invoice-load-details']);
            } else {
              this.segmentInfo.reset();
              this.selectedItems = [];
              this.showForm = false;
            }
          });
        } else {
          Swal.fire({
            text: res.MESSAGE,
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Server error while saving', '', 'error');
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




  updateSearchRow(row: any, index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 🔑 Mandatory PK validation
      if (!row.ZREFNO || !row.ZLINE_NO) {
        Swal.fire('Error', 'Missing mandatory keys (ZREFNO / ZLINE_NO)', 'error');
        return;
      }

      const changePayload = {
        ZREFNO: String(row.ZREFNO),
        ZLINE_NO: String(row.ZLINE_NO),
        ZINV_NUM: row.ZINV_NUM || '',
        ZODN_NO: row.ZODN_NO || '',
        ZSO_NO: row.ZSO_NO || '',

        ZSALE_PERSON: row.ZSALE_PERSON || '',
        ZSEGMENT: row.ZSEGMENT || '',
        ZAPPTYP: row.ZAPPTYP || '',

        ZCUST_PROFILE: row.ZCUST_PROFILE || '',
        ZBRANCH: row.ZBRANCH || '',
        ZBRANCH_ZONE: row.ZBRANCH_ZONE || '',

        ZTAT_TYPE: row.ZTAT_TYPE || '',
        ZTAT: String(row.ZTAT || ''),
        ZETA: row.ZETA || '',

        ZWORK_ORDER: row.ZWORK_ORDER || '',
        ZLRNO: row.ZLRNO || '',
        ZTRANSPORTER: row.ZTRANSPORTER || '',

        ZCREATED_DT: row.ZCREATED_DT || '',
        ZPLANT: row.ZPLANT || '',
        ZDIVISION: row.ZDIVISION || '',
        ZVEH_TYPE: row.ZVEH_TYPE || ''
      };

      const payload = {
        CHANGE: [changePayload]
      };

      console.log('🛠 SEGMENT CHANGE PAYLOAD:', payload);

      this.spinner.show();

      const api$ =
        this.sapType === 'SAP'
          ? this.service.SegmentInfoChangeWithSap(payload)
          : this.service.SegmentInfoChangeWithoutSap(payload);

      api$.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Data updated successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
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
            ZINV_NO: row.ZINV_NUM,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      // 🔹 Choose API based on sapType
      const apiCall = this.sapType === 'SAP'
        ? this.service.SegmentInfoDeleteWithSap(payload)
        : this.service.SegmentInfoDeleteWithoutSap(payload);

      // 🔹 Call API
      apiCall.subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE' || res?.STATUS === true) {
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


  TatTypeChange(): void {
    const formValue = this.segmentInfo.value;
    const invNo = this.invoicenumber || formValue.INV_VBELN || 'NA';

    

    const obj = {
      INV_NO: invNo,
      BRANCH: formValue.BRANCH,
      BRANCH_ZONE: formValue.BRANCH_ZONE,
      TAT_TYPE: formValue.TAT_Type
    };

    console.log('📤 Fetching SAP TAT from backend with payload:', obj);

    this.spinner.show();

    this.service.fetchTAT(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ SAP TAT Response:', res);

        if (res && (res.TAT || res.ETA)) {
          this.segmentInfo.patchValue({
            TAT_DAYS: res.TAT || '',
            ETA_DATE: res.ETA || ''
          });
        } else {
          Swal.fire('No TAT data found for selected type', '', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Error fetching SAP TAT details:', err);
        Swal.fire('Error fetching SAP TAT details', '', 'error');
      }
    });
  }

  TatTypeNonSap(): void {
    const formValue = this.segmentInfo.getRawValue();
    const invNo = this.invoicenumber || formValue.INV_VBELN || 'NA';

    const obj = {
      INV_NO: invNo,
      BRANCH: formValue.BRANCH,
      BRANCH_ZONE: formValue.BRANCH_ZONE,
      TAT_TYPE: formValue.TAT_Type
    };

    this.spinner.show();
    this.service.fetchNonSapTAT(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res) {
          this.segmentInfo.patchValue({
            TAT_DAYS: res.TAT || '',
            ETA_DATE: res.ETA || ''
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching Non-SAP TAT details', '', 'error');
      }
    });
  }

  onTatTypeChange(): void {
    if (this.sapType === 'SAP') {
      this.TatTypeChange();
    } else if (this.sapType === 'Non-SAP') {
      this.TatTypeNonSap();
    }
  }

  saveSegmentInfoWithoutSAP(
    action: 'stay' | 'next' | 'previous' = 'stay'
  ): void {

    this.segmentInfo.markAllAsTouched();

    if (this.segmentInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
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

    const formValue = this.segmentInfo.value;

    const payload = {
      CREATE: this.selectedItems.map((item: any, index: number) => ({
        REFNO: item.referenceNumber || 0,
        LINE_NO: index + 1,
        WORK_ORDER: item.workOrderNumber || '',
        LRNO: item.lrNumber || '',
        TRANSPORTER: item.transporter || '',
        SONO: item.SONO || '',
        ODN_NO: item.ODN_NO || '',
        INV_NUM: formValue.INV_VBELN || this.invoicenumber || '',
        SALES_EMP: formValue.SALE_PERSON || '',
        SEGMENT: formValue.SEGMENT || '',
        APPTYP: formValue.APPTYP.DESC || '',
        CUST_PROF: formValue.CUST_PROF || '',
        BRANCH: formValue.BRANCH || '',
        BRANCH_ZONE: formValue.BRANCH_ZONE || '',
        TAT_TYPE: formValue.TAT_Type || '',
        TAT: formValue.TAT_DAYS || '',
        ETA: formValue.ETA_DATE || ''
      }))
    };

    this.spinner.show();
    this.service.SegmentInfoNonSap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.STATUS === 'true' || res.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MESSAGE,
            icon: 'success',
            confirmButtonText: 'Ok',
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/vehicle-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/invoice-load-details']);
            } else {
              this.segmentInfo.reset();
              this.showForm = true;
            }
          });
        } else {
          Swal.fire({
            icon: 'warning',
            text: res.MESSAGE,
            confirmButtonText: 'Ok',
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error saving Non-SAP data', '', 'error');
      }
    });
  }


  fetchzonechange() {
    console.log('SAP Type:', this.sapType);

    if (!this.sapType || this.sapType.toLowerCase() !== 'non-sap') {
      console.log('Skipping fetchzonechange: SAP mode active');
      return;
    }

    const branchDesc = this.segmentInfo.value.BRANCH;

    if (!branchDesc) {
      console.log('❌ Branch missing, resetting zone');
      this.segmentInfo.patchValue({
        BRANCH_ZONE: '',
      });
      return;
    }

    const obj = { STATE: branchDesc };
    console.log('📦 Fetching Zone & TAT with payload:', obj);

    this.spinner.show();

    this.service.fetchzoneTat(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ Zone Response:', res);
        this.segmentInfo.patchValue({
          BRANCH_ZONE: res.ZZONE || '',
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Error fetching Zone & TAT:', err);
        Swal.fire('Error fetching Zone & TAT', '', 'error');
        this.segmentInfo.patchValue({
          BRANCH_ZONE: '',
        });
      }
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
      GLOBAL: 'SEGMENT INFO',
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
          this.SegmentData = [];
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
          this.SegmentData = records;
          this.dispatchData = [];
          Swal.fire('Success', `SegmentInfo records: ${records.length}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.SegmentData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.SegmentData = [];
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
  downloadExcel() {
    // 1️⃣ Determine data source based on status
    let exportSource: any[] = [];
    let fileName = '';

    if (this.filterStatus === 'Completed') {
      exportSource = this.SegmentData;
      fileName = this.sapType === 'SAP' ? 'SegmentData_Completed_SAP.xlsx' : 'SegmentData_Completed_NonSAP.xlsx';
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
      exportData = exportSource.map((item, index) => ({
        'SI.No': index + 1,
        'Line No': item.ZLINE_NO || '',
        'REFNO': item.ZREFNO || '',
        'Invoice No': item.ZINV_NUM || '',
        'ODN Number': item.ZODN_NO || '',
        'SO Number': item.ZSO_NO || '',
        'Sales Person': item.ZSALE_PERSON || '',
        'Segment': item.ZSEGMENT || '',
        'Application Type': item.ZAPPTYP || '',
        'Customer Profile': item.ZCUST_PROFILE || '',
        'Branch': item.ZBRANCH || '',
        'Branch Zone': item.ZBRANCH_ZONE || '',
        'TAT Type': item.ZTAT_TYPE || '',
        'TAT Days': item.ZTAT || '',
        'ETA': item.ZETA || '',
        'Plant': item.ZPLANT || '',
        'Division': item.ZDIVISION || '',
        'Work Order': item.ZWORK_ORDER || '',
        'LR No': item.ZLRNO || '',
        'Transporter': item.ZTRANSPORTER || '',
        'Created Date': item.ZCREATED_DT || '',
        'Vehicle Type': item.ZVEH_TYPE || ''
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
    let exportSource: any[] = [];
    let fileName = '';
    let reportTitle = '';

    if (this.filterStatus === 'Completed') {
      exportSource = this.SegmentData; // ✅ same as table
      fileName = this.sapType === 'SAP'
        ? 'SegmentData_Completed_SAP.pdf'
        : 'SegmentData_Completed_NonSAP.pdf';
      reportTitle = 'Segment Data Records (Completed)';
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

    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    const doc = new (jsPDF as any).default({
      orientation: 'landscape',
      unit: 'mm',
      format: [420, 297] // A2 landscape
    });

    /* ===== HEADER ===== */
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-GB')}`,
      doc.internal.pageSize.getWidth() / 2,
      18,
      { align: 'center' }
    );

    let headers: any[] = [];
    let data: any[] = [];

    /* ================= COMPLETED ================= */
    if (this.filterStatus === 'Completed') {
      headers = [[
        'SI.No',
        'Line No',
        'REFNO',
        'Invoice No',
        'ODN Number',
        'SO Number',
        'Sales Person',
        'Segment',
        'Application Type',
        'Customer Profile',
        'Branch',
        'Branch Zone',
        'TAT Type',
        'TAT Days',
        'ETA',
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
        item.ZLINE_NO || '',
        item.ZREFNO || '',
        item.ZINV_NUM || '',
        item.ZODN_NO || '',
        item.ZSO_NO || '',
        item.ZSALE_PERSON || '',
        item.ZSEGMENT || '',
        item.ZAPPTYP || '',
        item.ZCUST_PROFILE || '',
        item.ZBRANCH || '',
        item.ZBRANCH_ZONE || '',
        item.ZTAT_TYPE || '',
        item.ZTAT || '',
        item.ZETA || '',
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

    /* ================= PENDING ================= */
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

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      theme: 'grid',
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
      }
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF downloaded: ${fileName}`, 'success');
  }

  fetchPendingAndCompletedCounts() {
  const payload = {
    INOUT: 'OUTWARD',
    TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
    SCREEN: 'SEGMENT INFO'
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


}