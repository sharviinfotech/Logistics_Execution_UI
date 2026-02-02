import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-vechile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vechile-info.component.html',
  styleUrls: ['./vechile-info.component.css']
})
export class VechileInfoComponent implements OnInit {

  VehicleForm!: FormGroup;
  PlantCodeList: any[] = [];
  VendorCodeList: any[] = [];
  orderType: string = '';
  showForm = false;
  sapType: string = '';
  invoicenumber: string = '';
  isUpdateMode: boolean = false;
  ponumber: string = '';
  showTable: boolean = false;
  isAllSelected: boolean = false;
  previousOrderType: string | null = null;
  previousSapType: string | null = null;
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
    { key: 'transporter', label: 'Transporter' },
    { key: 'lr_no', label: 'LR NO' },
    { key: 'workorder_no', label: 'Workorder No' },
    { key: "sales_person", label: 'Sales Person' },
    { key: "location", label: 'Location' },
    { key: "vehicle_no", label: 'Vehicle No' },


  ]

  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filterStatus: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;
  Vehicle_Form!: FormGroup;
  VehicleInfoData: any[] = [];
  dispatchData: any[] = [];
  filterSapType: string = '';
  shipmentType: string = '';
  invoiceF4List: string[] = [];
  vehicleApiData: any[] = [];


  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.VehicleForm = this.fb.group({
      VBELN: [''],
      vehicles: this.fb.array([]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
    this.addRow();
    this.fetchTransporter();
    this.fetchPlantCodeList();
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

      ZTRX_TYPE: [
        data?.ZTRX_TYPE || this.shipmentType || '',
        Validators.required
      ],
      ZTRANSPORTER: [data?.ZTRANSPORTER || '', Validators.required],
      ZLRNO: [data?.ZLRNO || '', Validators.required],
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZTRUC_WT: [data?.ZTRUC_WT || '', Validators.required],
      ZTRUCK_LINE: [data?.ZTRUCK_LINE || ''],
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
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }

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

    console.log('Selected MAPID:', selectedMapId);



    const selectedObj = this.selectedItems.find(
      item => String(item.MAPID) === String(selectedMapId)
    );

    if (selectedObj) {
      rowForm.patchValue({
        ZREFNO: selectedObj.referenceNumber || '',
        ZWORK_ORDER: selectedObj.workOrderNumber || '',
        ZLRNO: selectedObj.lrNumber || '',
        ZTRANSPORTER: selectedObj.transporter || '',
        ZMAPID: selectedObj.MAPID || ''
      });
    }

    console.log('Step-1 Updated form:', this.vehicles.value);



    const vbeln =
      this.sapType === 'Non-SAP'
        ? this.VehicleForm.get('VBELN')?.value?.trim()
        : (this.orderType === 'Inward'
          ? this.ponumber
          : this.invoicenumber
        )?.trim();

    if (!vbeln || !selectedMapId) {
      console.log('VBELN or MAPID missing, API not called');
      return;
    }


    const reqBody =
      this.sapType === 'SAP'
        ? {
          VBELN: vbeln,
          MAPID: selectedMapId
        }
        : {
          VBELN: vbeln,
          MPID: selectedMapId
        };

    console.log('🚀 MAPID API Payload:', reqBody);



    this.spinner.show();

    const apiCall =
      this.sapType === 'SAP'
        ? this.service.VehicleInfoMapid(reqBody)
        : this.service.VehicleInfoMapidForNonsap(reqBody);

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('🚛 MAPID API Response:', res);

        if (res) {
          rowForm.patchValue({
            ZTRUC_TYPE: res.ZTRUC_TYPE || '',
            ZTRUC_WT: res.ZTRUC_WT || '',
            ZTRUC_VOL: res.ZTRUC_VOL || ''
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ MAPID API Error:', err);
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
    this.invoiceF4List = [];   // ✅ RESET F4 LIST

    if (data && data.length > 0) {
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
            INV_NO_LIST: [d.INV_NO || []]
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

      console.log('✅ Invoice F4 List:', this.invoiceF4List);

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

    this.showTable = false;


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

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
      this.searchOptionsList = [];
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.fetchVehicleDetails();
  }



  // fetchVehicleDetails(): void {
  //   if (this.sapType !== 'SAP') {
  //     Swal.fire('Info', 'Please select "With SAP" first.', 'info');
  //     return;
  //   }

  //   const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

  //   if (!referenceNumber?.trim()) {
  //     Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number.`, 'warning');
  //     return;
  //   }

  //   this.searchOptionsList = [];
  //   this.searchReference = '';
  //   this.selectedType = '';


  //   const selectedMapId = this.selectedItems?.[0]?.MAPID || "";
  //   const selectedRefNo = this.selectedItems?.[0]?.referenceNumber || '';

  //   const reqBody: any = {
  //     INV_GET: referenceNumber.trim(),
  //     refno: selectedRefNo
  //   };

  //   if (selectedMapId) {
  //     reqBody.MAPID = selectedMapId;
  //   }

  //   console.log("🚀 Final Vehicle Fetch Payload:", reqBody);

  //   this.spinner.show();
  //   this.service.VehicleInfofetch(reqBody).subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();
  //       this.vehicles.clear();

  //       if (Array.isArray(res) && res.length > 0) {
  //         this.showTable = true;
  //         res.forEach((item: any) => {
  //           this.vehicles.push(this.createVehicleRow(item));
  //         });
  //         Swal.fire('Success', 'Vehicle details loaded successfully.', 'success');
  //       } else {
  //         this.showTable = false;

  //         Swal.fire('Info', 'No data found.', 'info');
  //       }
  //     },
  //     error: (err) => {
  //       this.spinner.hide();
  //       console.error('API Error:', err);
  //       Swal.fire('Error', 'Failed to fetch vehicle details.', 'error');
  //     }
  //   });
  // }
  fetchVehicleDetails(): void {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber?.trim()) {
      Swal.fire(
        'Warning',
        `Please enter ${this.orderType === 'Inward' ? 'PO' : 'invoice'} number`,
        'warning'
      );
      return;
    }

    const payload = { INV_GET: referenceNumber.trim() };

    this.spinner.show();

    this.service.Invoiceloaddetailsfetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (Array.isArray(res) && res.length > 0) {
          this.vehicles.clear(); // clear existing vehicle rows

          console.log('🔎 Reference Items:', this.referenceItems.value);

          // 🔥 LOOP THROUGH REFERENCE ITEMS (SOURCE OF TRUTH)
          this.referenceItems.value.forEach((ref: any) => {
            const truckCount = Number(ref.ZNO_TRUCKS) || 1;

            for (let i = 0; i < truckCount; i++) {
              this.vehicles.push(this.createVehicleRow({
                VBELN: referenceNumber,
                ZMAPID: ref.MAPID || '',
                ZREFNO: ref.referenceNumber || '',
                ZWORK_ORDER: ref.workOrderNumber || '',
                ZLRNO: ref.lrNumber || '',
                ZTRANSPORTER: ref.transporter || '',
                ZTRUCK_LINE: i + 1
              }));
            }
          });

          this.showTable = true;
          this.searchOptionsList = [];

          console.log('✅ Total Vehicle Rows Created:', this.vehicles.length);

          Swal.fire(
            'Success',
            `Invoice details loaded (Truck-wise: ${this.vehicles.length} rows)`,
            'success'
          );
        } else {
          Swal.fire('Info', 'No records found for this invoice', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to fetch invoice details', 'error');
        console.error(err);
      }
    });
  }




  saveVehicleInfo(action: 'stay' | 'next' | 'previous' = 'stay'): void {

    const vbeln =

      this.sapType === 'Non-SAP'
        ? this.VehicleForm.get('VBELN')?.value?.trim()
        : (this.orderType === 'Inward'
          ? this.ponumber
          : this.invoicenumber
        )?.trim();

    if (!vbeln) {
      Swal.fire('Warning', 'Invoice / PO number is required', 'warning');
      return;
    }

    const filtered = this.vehicles.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }, index) => ({
        ...rest,
        VBELN: vbeln,
        POSNR: (index + 1) * 10
      }));


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
  updateVehicleSap(row: any) {

    // 🔑 Mandatory PKs for SAP
    if (!row.ZREFNO || !row.VBELN || !row.POSNR || !row.ZLINE_NO || !row.ZMAPID) {
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

          ZVEH_LINE: row.ZVEH_LINE,
          ZTRX_TYPE: row.ZTRX_TYPE,
          ZODN_NO: row.ZODN_NO,
          ZSONO: row.ZSONO,
          ZSALE_PERSON: row.ZSALE_PERSON,
          ZTRANSPORTER: row.ZTRANSPORTER,
          ZLRNO: row.ZLRNO,
          ZTRUC_TYPE: row.ZTRUC_TYPE,
          ZTRUC_WT: row.ZTRUC_WT,
          ZTRUC_VOL: row.ZTRUC_VOL,
          ZVEH_NUM: row.ZVEH_NUM,
          ZNOOFVEH: row.ZNOOFVEH,
          ZDNAME: row.ZDNAME,
          ZDNUMBER: row.ZDNUMBER,
          ZLOCATION: row.ZLOCATION,
          ZWORK_ORDER: row.ZWORK_ORDER,
          ZMAPID: row.ZMAPID,
          ZCREATED_DT: row.ZCREATED_DT,
          ZPLANT: row.ZPLANT,
          ZDIVISION: row.ZDIVISION,
          ZVEH_TYPE: row.ZVEH_TYPE
        }
      ]
    };


    return this.service.VehicleInfoChangeWithSap(payload);
  }

  updateVehicleNonSap(row: any) {


    if (!row.ZREFNO || !row.VBELN || !row.POSNR || !row.ZLINE_NO || !row.ZMAPID) {
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

          ZVEH_LINE: row.ZVEH_LINE,
          ZTRX_TYPE: row.ZTRX_TYPE,
          ZODN_NO: row.ZODN_NO,
          ZSONO: row.ZSONO,
          ZSALE_PERSON: row.ZSALE_PERSON,
          ZTRANSPORTER: row.ZTRANSPORTER,
          ZLRNO: row.ZLRNO,
          ZTRUC_TYPE: row.ZTRUC_TYPE,
          ZTRUC_WT: row.ZTRUC_WT,
          ZTRUC_VOL: row.ZTRUC_VOL,
          ZVEH_NUM: row.ZVEH_NUM,
          ZNOOFVEH: row.ZNOOFVEH,
          ZDNAME: row.ZDNAME,
          ZDNUMBER: row.ZDNUMBER,
          ZLOCATION: row.ZLOCATION,
          ZWORK_ORDER: row.ZWORK_ORDER,
          ZMAPID: row.ZMAPID,
          ZCREATED_DT: row.ZCREATED_DT,
          ZPLANT: row.ZPLANT,
          ZDIVISION: row.ZDIVISION,
          ZVEH_TYPE: row.ZVEH_TYPE
        }
      ]
    };


    return this.service.VehicleInfoChangeWithoutSap(payload);
  }

  updateVehicleRow(row: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.spinner.show();

      const api$ =
        this.sapType === 'SAP'
          ? this.updateVehicleSap(row)
          : this.updateVehicleNonSap(row);

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
              text: 'Vehicle updated successfully',
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
        ? this.service.VehicleInfoDeleteWithSap(payload)
        : this.service.VehicleInfoDeleteWithoutSap(payload);

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
      GLOBAL: 'VEHICLE INFO',
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
          this.VehicleInfoData = [];
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
          this.VehicleInfoData = records;
          this.dispatchData = [];
          Swal.fire('Success', `Vehicle Info records: ${records.length}`, 'success');
        }
        else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.VehicleInfoData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        }
        else {
          this.VehicleInfoData = [];
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

  // fetchDCReferenceNo(): void {

  //   if (this.sapType !== 'Non-SAP') return;

  //   const invoiceNo = this.VehicleForm.get('VBELN')?.value;
  //   if (!invoiceNo) {
  //     Swal.fire('Warning', 'Invoice number is required', 'warning');
  //     return;
  //   }

  //   const payload = { INV_NO: invoiceNo };

  //   this.spinner.show();

  //   this.service.DCReferenceNo(payload).subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();
  //       console.log('✅ DC Response:', res);

  //       if (res?.ZTRANS_TYPE) {

  //         // 🔥 STORE GLOBALLY
  //         this.shipmentType = res.ZTRANS_TYPE;

  //         // 🔥 APPLY TO ALL EXISTING ROWS
  //         this.applyShipmentTypeToAllRows();
  //       }
  //     },
  //     error: () => {
  //       this.spinner.hide();
  //       Swal.fire('Error', 'Failed to fetch DC Reference', 'error');
  //     }
  //   });
  // }

  fetchDCReferenceNo(): void {

    if (this.sapType !== 'Non-SAP') return;

    const invoiceNo = this.VehicleForm.get('VBELN')?.value;

    if (!invoiceNo) {
      Swal.fire('Warning', 'Invoice number is required', 'warning');
      return;
    }

    const payload = { VBELN: invoiceNo };  // ✅ confirm with backend

    this.spinner.show();

    this.service.DCReferenceNo(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ DC Response:', res);

        if (res?.ZTRANS_TYPE) {
          this.shipmentType = res.ZTRANS_TYPE;
          this.applyShipmentTypeToAllRows();
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to fetch DC Reference', 'error');
      }
    });
  }


  applyShipmentTypeToAllRows() {
    if (!this.shipmentType) return;

    this.vehicles.controls.forEach(ctrl => {
      ctrl.patchValue({
        ZTRX_TYPE: this.shipmentType
      });
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
      exportSource = this.VehicleInfoData;
      fileName = this.sapType === 'SAP' ? 'VehicleInfo_Completed_SAP.xlsx' : 'VehicleInfo_Completed_NonSAP.xlsx';
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
        'Map ID': record.ZMAPID || '',
        'REFNO': record.ZREFNO || '',
        'Invoice No': record.VBELN || '',
        'Odn Number': record.ZODN_NO || '',
        'SO Number': record.ZSONO || '',
        'Vehicle Line': record.ZVEH_LINE || '',
        'Type of Shipment': record.ZTRX_TYPE || '',
        'Type of Vehicle': record.ZTRUC_TYPE || '',
        'Passing Weight (Tons)': record.ZTRUC_WT || '',
        'Volume of Truck': record.ZTRUC_VOL || '',
        'Vehicle Number': record.ZVEH_NUM || '',
        'No of Vehicles': record.ZNOOFVEH || '',
        'Sales Person': record.ZSALE_PERSON || '',
        'Driver Name': record.ZDNAME || '',
        'Driver Mobile': record.ZDNUMBER || '',
        'Work Order': record.ZWORK_ORDER || '',
        'Location': record.ZLOCATION || '',
        'Plant': record.ZPLANT || '',
        'Division': record.ZDIVISION || '',
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
      exportSource = this.VehicleInfoData;
      fileName = this.sapType === 'SAP' ? 'Vehicle_Info_Completed_SAP.pdf' : 'Vehicle_Info_Completed_NonSAP.pdf';
      reportTitle = 'Vehicle Info Records (Completed)';
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
        'Map ID',
        'REFNO',
        'Invoice No',
        'ODN No',
        'SO No',
        'Vehicle Line',
        'Type of Shipment',
        'Type of Vehicle',
        'Passing Weight (Tons)',
        'Volume of Truck',
        'Vehicle Number',
        'No of Vehicles',
        'Sales Person',
        'Driver Name',
        'Driver Mobile',
        'Work Order',
        'Location',
        'Plant',
        'Division',
        'LR No',
        'Transporter',
        'Created Date',
        'Vehicle Type'

      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZMAPID || '',
        record.ZREFNO || '',
        record.VBELN || '',
        record.ZODN_NO || '',
        record.ZSONO || '',
        record.ZVEH_LINE || '',
        record.ZTRX_TYPE || '',
        record.ZTRUC_TYPE || '',
        record.ZTRUC_WT || '',
        record.ZTRUC_VOL || '',
        record.ZVEH_NUM || '',
        record.ZNOOFVEH || '',
        record.ZSALE_PERSON || '',
        record.ZDNAME || '',
        record.ZDNUMBER || '',
        record.ZWORK_ORDER || '',
        record.ZLOCATION || '',
        record.ZPLANT || '',
        record.ZDIVISION || '',
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
      SCREEN: 'VEHICLE INFO'
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

    // Reset previous state trackers
    this.previousOrderType = null;
    this.previousSapType = null;

    // Reset invoice/PO numbers
    this.invoicenumber = '';
    this.ponumber = '';

    // Reset shipment type
    this.shipmentType = '';

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';
    this.searchOptionsList = [];
    this.dropdownOpen = false;

    // Reset table display flags
    this.showTable = false;

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
    this.VehicleInfoData = [];
    this.dispatchData = [];
    this.selectedItems = [];

    // Reset counts
    this.pendingCount = 0;
    this.completedCount = 0;

    // Reset checkbox state
    this.isAllSelected = false;

    // Reset Vehicle Form
    this.VehicleForm.reset();



    // Show success message
    Swal.fire({
      text: 'Screen refreshed successfully',
      icon: 'success',
      confirmButtonText: 'Ok',
      timer: 4000,

    });

    // Trigger change detection
    this.cd.detectChanges();
  }


}