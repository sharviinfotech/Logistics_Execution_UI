import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vechile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vechile-info.component.html',
  styleUrls: ['./vechile-info.component.css']
})
export class VechileInfoComponent implements OnInit {

  VehicleForm!: FormGroup;
  orderType: string = '';
  showForm = false;
  sapType: string = '';
  invoicenumber: string = '';
  ponumber: string = '';
  showTable: boolean = false;
  isAllSelected: boolean = false;
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

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
    this.VehicleForm = this.fb.group({
      vehicles: this.fb.array([]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
    this.addRow();
  }

  get vehicles(): FormArray {
    return this.VehicleForm.get('vehicles') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.VehicleForm.get('referenceItems') as FormArray;
  }

  createVehicleRow(data?: any): FormGroup {
    console.log("createVehicleRow data", data)
    return this.fb.group({
      selected: [false],
      VBELN: [data?.VBELN],
      MANDT: [data?.MANDT],
      POSNR: [data?.POSNR],
      ZMAPID: [data?.ZMAPID || ''],
      ZTRX_TYPE: [data?.ZTRX_TYPE || '', Validators.required],
      ZTRANSPORTER: [data?.ZTRANSPORTER || '', Validators.required],
      ZLRNO: [data?.ZLRNO || '', Validators.required],
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZTRUC_WT: [data?.ZTRUC_WT || '', Validators.required],
      ZTRUC_VOL: [data?.ZTRUC_VOL || '', [Validators.required, Validators.min(0)]],
      ZVEH_NUM: [data?.ZVEH_NUM || '', Validators.required],
      ZNOOFVEH: [data?.ZNOOFVEH || '', [Validators.required, Validators.min(1)]],
      ZDNAME: [data?.ZDNAME || '', Validators.required],
      ZDNUMBER: [data?.ZDNUMBER || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      ZREFNO: [data?.ZREFNO || ''],
      ZLOCATION: [data?.ZLOCATION || ''],
      ZSALE_PERSON: [data?.ZSALE_PERSON || ''],
      ZWORK_ORDER: [data?.ZWORK_ORDER || ''],

      // ZTRANSPORTER: [data?.ZTRANSPORTER || ''],
      ZSO_NO: [data?.ZSONO || ''],
      ZODN_NO: [data?.ZODN_NO || '']
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
    });
  }

  addRow(): void {
    this.vehicles.push(this.createVehicleRow());
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
    this.sapType = '';
    this.invoicenumber = '';
    this.ponumber = '';
    this.showTable = false;
    this.vehicles.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
    this.searchOptionsList = [];
    this.selectedItems = [];
  }

  removeRow(index: number): void {
    if (this.vehicles.length > 1) {
      this.vehicles.removeAt(index);
    } else {
      Swal.fire('Warning', 'At least one vehicle entry is required.', 'warning');
    }
  }

  allSelected(): boolean {
    return this.vehicles.controls.length > 0 &&
      this.vehicles.controls.every(ctrl => ctrl.get('selected')?.value === true);
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.vehicles.controls.forEach(ctrl => ctrl.get('selected')?.setValue(isChecked));
  }

  onRowCheckboxChange(): void {
    this.isAllSelected = this.allSelected();
    console.log('All Selected:', this.vehicles.value);
  }

  getSelectedRows() {
    return this.vehicles.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }

  onSapTypeSelection(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    this.vehicles.clear();
    this.showTable = false;

    if (this.sapType === 'Non-SAP') {
      this.addRow();
      this.showTable = true;
    } else if (this.sapType === 'SAP') {
      this.invoicenumber = '';
      this.ponumber = '';
    }
  }

  resetConditionalFields(): void {
    this.showTable = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.VehicleForm.reset();
    this.vehicles.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
  }

  onchangeMAPID(index: number) {
    const rowForm = this.vehicles.at(index) as FormGroup;
    const selectedMapId = rowForm.get('ZMAPID')?.value;
    console.log("Selected MAPID:", selectedMapId);

    // Get selected reference object
    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);

    if (selectedObj) {
      rowForm.patchValue({
        ZREFNO: selectedObj.referenceNumber || "",
        ZWORK_ORDER: selectedObj.workOrderNumber || "",
        ZLRNO: selectedObj.lrNumber || "",
        ZTRANSPORTER: selectedObj.transporter || "",
        ZMAPID: selectedObj.MAPID || ""
      });
    }

    console.log("Step-1 Updated form:", this.vehicles.value);

    // 🚀 Step-2: API Call to fetch TRUCK details based on MAPID
    const vbeln = this.orderType === 'Inward' ? this.ponumber.trim() : this.invoicenumber.trim();

    if (!vbeln) {
      console.warn("VBELN missing, cannot hit MAPID API");
      return;
    }

    const reqBody = {
      VBELN: vbeln,
      MAPID: selectedMapId
    };

    console.log("🚀 Hitting VehicleInfoMapid API:", reqBody);

    this.spinner.show();
    this.service.VehicleInfoMapid(reqBody).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log("🚛 MAPID Vehicle Info Response:", res);

        if (res) {
          rowForm.patchValue({
            ZTRUC_TYPE: res.ZTRUC_TYPE || "",
            ZTRUC_WT: res.ZTRUC_WT || "",
            ZTRUC_VOL: res.ZTRUC_VOL || ""
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error("❌ MAPID Fetch Error:", err);
      }
    });
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
      global_scr: 'VEHICLE INFO',
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
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || ''],
            soNumber: [d.SO_NO || d.soNumber || ''],
            odnNumber: [d.ODN_NO || d.odnNumber || ''],
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
          item.MAPID === rowValue.MAPID &&
          item.referenceNumber === rowValue.referenceNumber &&
          item.workOrderNumber === rowValue.workOrderNumber &&
          item.lrNumber === rowValue.lrNumber &&
          item.transporter === rowValue.transporter &&
          item.soNumber === rowValue.soNumber &&
          item.odnNumber === rowValue.odnNumber
      );
      if (!exists) {
        this.selectedItems.push(rowValue);
      }
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
            item.odnNumber === rowValue.odnNumber
          )
      );
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
        item.odnNumber === rowValue.odnNumber
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

      "global": "VEHICLE INFO",
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

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.fetchVehicleDetails();
  }



  fetchVehicleDetails(): void {
    if (this.sapType !== 'SAP') {
      Swal.fire('Info', 'Please select "With SAP" first.', 'info');
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber?.trim()) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number.`, 'warning');
      return;
    }

    
    const selectedMapId = this.selectedItems?.[0]?.MAPID || "";
    const selectedRefNo = this.selectedItems?.[0]?.referenceNumber || '';

    const reqBody: any = {
      INV_GET: referenceNumber.trim(),
        refno: selectedRefNo               
    };

    if (selectedMapId) {
      reqBody.MAPID = selectedMapId;
    }

    console.log("🚀 Final Vehicle Fetch Payload:", reqBody);

    this.spinner.show();
    this.service.VehicleInfofetch(reqBody).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.vehicles.clear();

        if (Array.isArray(res) && res.length > 0) {
          this.showTable = true;
          res.forEach((item: any) => {
            this.vehicles.push(this.createVehicleRow(item));
          });
          Swal.fire('Success', 'Vehicle details loaded successfully.', 'success');
        } else {
          this.showTable = false;
          Swal.fire('Info', 'No data found.', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('API Error:', err);
        Swal.fire('Error', 'Failed to fetch vehicle details.', 'error');
      }
    });
  }


  saveVehicleInfo(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    const filtered = this.vehicles.value
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


    if (filtered.length === 0) {
      Swal.fire('Warning', 'Please select at least one row to save.', 'warning');
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

    // const cleanedRows = filtered.map(({ selected, ...veh }, index: number) => ({
    //   MANDT: '234',
    //   VBELN: referenceNumber?.trim() || '',
    //   POSNR: (index + 1) * 10,
    //   ZVEH_LINE: '',
    //   ZTRX_TYPE: veh.ZTRX_TYPE,
    //   ZTRANSPOTER: veh.ZTRANSPOTER,
    //   ZLRNO: veh.ZLRNO,
    //   ZTRUC_TYPE: veh.ZTRUC_TYPE,
    //   ZTRUC_WT: veh.ZTRUC_WT,
    //   ZTRUC_VOL: Number(veh.ZTRUC_VOL),
    //   ZVEH_NUM: veh.ZVEH_NUM,
    //   ZNOOFVEH: Number(veh.ZNOOFVEH),
    //   ZDNAME: veh.ZDNAME,
    //   ZDNUMBER: veh.ZDNUMBER,
    //   ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
    // }));

    this.spinner.show();

    const apiCall =
      this.sapType === 'SAP'
        ? this.service.VehicleInfosave(filtered)
        : this.service.VehicleInfoNonSap(filtered);

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Selected Vehicle(s) saved successfully!',
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/transit-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/segment-info']);
            } else {
              this.resetForm();
            }
          });
        } else {
          Swal.fire('Error', res?.MSG || 'Failed to save selected vehicle info.', 'error');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Save API Error:', err);
        Swal.fire('Error', 'Failed to save vehicle info.', 'error');
      }
    });
  }

  resetForm(): void {
    this.VehicleForm.reset();
    this.vehicles.clear();
    this.referenceItems.clear();
    this.addRow();
    this.referenceItems.push(this.createReferenceRow());
    this.orderType = '';
    this.sapType = '';
    this.invoicenumber = '';
    this.ponumber = '';
    this.showTable = false;
    this.isAllSelected = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }
}