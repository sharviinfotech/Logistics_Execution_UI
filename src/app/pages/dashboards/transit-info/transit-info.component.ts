import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transit-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-info.component.html',
  styleUrls: ['./transit-info.component.css']
})
export class TransitInfoComponent implements OnInit {
  transitInfo!: FormGroup;

  orderType: string = '';
  sapType: string = '';
  showForm = false;
  isEditMode: boolean = false;

  ponumber: string = '';
  // Removed: invoicenumber: string = ''; // Property is no longer bound in the main input section
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

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
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
      vehicleNo: [''],
      vehicleLine: ['']
    });
  }

  updateSIT(): void {
    const field2 = this.transitInfo.get('unloadingdateandtime')?.value;
    const field3 = this.transitInfo.get('podscanreceiveddateandtime')?.value;

    if (field2 && field3) {
      this.transitInfo.get('sit')?.setValue('Sale');
    } else if (!field2 && field3) {
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
  }

  onSapTypeChange(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    this.transitInfo.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    // Show form only if both selections are made
    this.showForm = !!(this.orderType && this.sapType);

    if (this.orderType === 'Inward') {
      this.transitInfo.get('ponumber')?.setValidators([Validators.required]);
      this.transitInfo.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      // Updated: Removed Validators.required from invoicenumber. Outward validation is now implicit via search results/reference items.
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
      global_scr: 'TRANSIT INFO',
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
            transporter: [d.TRANSPORTER || ''],
            vehicleNo: [d.VEH_NUM || ''],
            vehicleLine: [d.VEH_LINE || '']
          })
        );
      });
    } else {
      Swal.fire({ icon: 'info', title: 'No Records Found', timer: 1500, showConfirmButton: false });
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
        claim_status: ''
      }
    };

    payload1.data[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload:', payload1);
    this.spinner.show();

    this.service.global_Fields_SearchOption(payload1).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.NUMBER === '100' && res?.STATUS === 'FALSE') {
          Swal.fire('', res.MESSAGE, 'warning');
          return;
        }

        // 🔥 NEW OBJECT & ARRAY REFERENCES
        this.headerData = res.HEADER?.[0] ? { ...res.HEADER[0] } : null;
        this.itemsList = res.ITEMS ? [...res.ITEMS] : [];

        if (!this.headerData) {
          Swal.fire('No data found', '', 'info');
          return;
        }

        this.showTable = true;
        this.showForm = false;

        Swal.fire('Data fetched successfully!', '', 'success');
      },
      error: () => {
        this.spinner.hide();
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
      SIT_SALE: f.sit || ''
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
        TRANSPORTER: item.transporter
      }));

    }


    const payload = {
      HEAD,
      ITEM
    };

    console.log("FINAL TRANSIT PAYLOAD:", payload);

    this.spinner.show();

    let request$ = this.service.TransitInfoSave(payload);

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
}