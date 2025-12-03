import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';

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
  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // F4 lists from backend
  supplierList: any[] = [];
  segmentList: any[] = [];
  custGrpList: any[] = [];
  branchList: any[] = [];
  appTypeList: any[] = [];

  // showF4 flags
  showF4 = {
    SALES_EMP: false,
    SEGMENT: false,
    CUST_PROF: false,
    BRANCH: false,
    APPTYP: false,
  };

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

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.segmentInfo = this.fb.group({
      INV_VBELN: [''],
      SALES_EMP: ['', Validators.required],
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
      transporter: ['']
    });
  }

  resetF4Flags() {
    this.showF4 = {
      SALES_EMP: false,
      SEGMENT: false,
      CUST_PROF: false,
      BRANCH: false,
      APPTYP: false,
    };
  }

  enableAllF4() {
    this.showF4 = {
      SALES_EMP: true,
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
      INV_VBELN: data.INV_NUM || '',
      SALES_EMP: data.SALE_PERSON || '',
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
      SALES_EMP: !data.SALE_PERSON,
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
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : ''
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();
    this.service.GlobalReferenceNoFetch(obj).subscribe({
      next: (res: any) => {
        console.log('✅ GlobalRefSearch Response:', res);
        this.spinner.hide();
        this.populateReferenceRows(res);
      },
      error: err => {
        console.error('❌ Ref Fetch Error:', err);
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
    
        console.log('🔍 Payload1:', payload1);
        this.spinner.show();
        this.service.global_Fields_SearchOption(payload1).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          console.log('✅ Search Response:', res);
          if (res.NUMBER == "100" && res.STATUS == "FALSE") {
            this.searchOptionsList = [];
           
           
            Swal.fire('', res.MESSAGE, 'warning');
          } else {
            Swal.fire('No records found', '', 'info');
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

    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const formValue = this.segmentInfo.value;
    const payload = {
      SAVE: [
        {
          INV_VBELN: formValue.INV_VBELN,
          SALES_EMP: formValue.SALES_EMP,
          SEGMENT: formValue.SEGMENT,
          APPTYP: formValue.APPTYP,
          CUST_PROF: formValue.CUST_PROF,
          BRANCH: formValue.BRANCH,
          BRANCH_ZONE: formValue.BRANCH_ZONE,
          TAT_TYPE: formValue.TAT_Type,
          TAT_DAYS: formValue.TAT_DAYS,
          ETA_DATE: formValue.ETA_DATE,
          ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
        },
      ],
    };

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
              this.showForm = false;
            }
          });
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Server error while saving', '', 'error');
      },
    });
  }

  TatTypeChange(): void {
    const formValue = this.segmentInfo.value;
    const vbeln = this.ponumber || this.invoicenumber || formValue.INV_VBELN;

    if (!vbeln || !formValue.BRANCH || !formValue.BRANCH_ZONE || !formValue.TAT_Type) {
      console.log('❌ Missing required fields for TAT fetch');
      return;
    }

    const obj = {
      VBELN: vbeln,
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

  saveSegmentInfoWithoutSAP(action: 'stay' | 'next' | 'previous' = 'stay'): void {
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
      CREATE: [
        {
          SALES_EMP: formValue.SALES_EMP,
          SEGMENT: formValue.SEGMENT,
          APPTYP: formValue.APPTYP,
          CUST_PROF: formValue.CUST_PROF,
          BRANCH: formValue.BRANCH,
          BRANCH_ZONE: formValue.BRANCH_ZONE,
          TAT_TYPE: formValue.TAT_Type,
          TAT_DAYS: formValue.TAT_DAYS,
          ETA_DATE: formValue.ETA_DATE,
          ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
        },
      ],
    };

    this.spinner.show();
    this.service.SegmentInfoNonSap(payload).subscribe({
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
              this.showForm = true;
            }
          });
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error saving Non-SAP data', '', 'error');
      },
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
}