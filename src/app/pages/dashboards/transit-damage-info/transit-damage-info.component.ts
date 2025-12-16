import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-transit-damage-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-damage-info.component.html',
  styleUrl: './transit-damage-info.component.css'
})
export class TransitDamageInfoComponent implements OnInit {

  orderType: any;
  sapType: any;
  invoicenumber: any;
  ponumber: any;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;

  showTable = false;
  ShowHeaderForm = false;
  SavedDataShow = false;
  showForm = false;
  isEditMode = false;
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
    { key: "freight_billno", label: 'Freight Bill No' },
    { key: "product", label: 'Product' },
    { key: "route", label: 'Route' },
  ];
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.buildHeaderForm();
    this.buildItemForm();
  }

  buildHeaderForm() {
    this.HeaderForm = this.fb.group({
      INV_NO: [''],
      INV_DATE: [''],
      FSR_RPT_DT: [''],
      BASIC_VALUE: [''],
      INC_DATE: [''],
      CUSTOMER: [''],
      CONSIGN_NAME: [''],
      DAMAGE_RMK: [''],
      SETTLEMENT: [''],
      CLOSING_DT: [''],
      IMAGES: [''],
      ODN_NO: [''],
      SONO: [''],
      SALE_PERSON: [''],
      LOCATION: [''],
      ROUTE: [''],
      REFNO: [''],
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
  }

  buildItemForm() {
    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  get items() {
    return this.ItemForm.get('ITEMS') as FormArray;
  }

  get referenceItems(): FormArray {
    return this.HeaderForm.get('referenceItems') as FormArray;
  }

  createReferenceRow(): FormGroup {
    return this.fb.group({
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addItemRow() {
    const row = this.fb.group({
      selected: [false],
      ZMAPID: [''],
      INV_NO: [''],
      POSNR: [''],
      VEH_LINE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      TRANSPORTER: [''],
      REFNO: [''],
      WORK_ORDER: [''],
      PRODUCT: [''],
      BILLNO: [''],
    });

    this.items.push(row);
  }

  removeItemRow(i: number) {
    this.items.removeAt(i);
  }

  resetForms() {
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    this.invoicenumber = "";
    this.ponumber = "";
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';

    // ✅ Don't hide forms if Non-SAP is selected
    if (this.sapType !== 'Non-SAP') {
      this.ShowHeaderForm = false;
      this.showTable = false;
      this.showForm = false;
    }
  }

  onOrderTypeSelection() {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = null;
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
    this.resetForms();

    // ✅ Auto-show forms for Non-SAP
    if (this.sapType === 'Non-SAP') {
      this.ShowHeaderForm = true;
      this.showTable = true;
      this.showForm = true;

      // Add one empty row to items table
      if (this.items.length === 0) {
        this.addItemRow();
      }

      console.log('✅ Non-SAP selected - Forms displayed automatically');
    } else {
      // For SAP, keep forms hidden until GET is clicked
      this.ShowHeaderForm = false;
      this.showTable = false;
      this.showForm = false;
    }
  }

  resetConditionalFields(): void {
    // Don't reset these flags if switching to Non-SAP
    if (this.sapType !== 'Non-SAP') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      this.showForm = false;
    }

    this.searchOptionsList = [];
    this.selectedItems = [];
    this.HeaderForm.reset();
    this.referenceItems.clear();
    this.referenceItems.push(this.createReferenceRow());

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
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
      global_scr: 'TRANSIT DAMAGE INFO',
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
            MAPID: [d.MAPID || ''],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || '']
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

  onchangeMAPID(index: number) {
    const rowForm = this.items.at(index) as FormGroup;
    const selectedMapId = rowForm.get('ZMAPID')?.value;
    console.log("Selected MAPID:", selectedMapId);

    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);
    console.log("Selected MAPID object:", selectedObj);

    if (selectedObj) {
      rowForm.patchValue({
        REFNO: selectedObj.referenceNumber || "",
        WORK_ORDER: selectedObj.workOrderNumber || "",
        LR_NO: selectedObj.lrNumber || "",
        TRANSPORTER: selectedObj.transporter || "",
        ZMAPID: selectedObj.MAPID || ""
      });
    }
    console.log("Updated items form:", this.items.value);
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
          item.transporter === rowValue.transporter
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
        item.MAPID === rowValue.MAPID &&
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter
    );
  }

  onSearchTypeChange(): void {
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
    this.SavedDataShow = false;
    this.ShowHeaderForm = false;
    if (!this.selectedType) {
      Swal.fire('Please select a search type', '', 'info');
      return;
    }

    let payload1: any = {
      "global": "TRANSIT DAMAGE INFO",
      "data": {
        "REF_NO": "",
        "INV_NO": "",
        "SO_NO": "",
        "TRANSPORTER": "",
        "LR_NO": "",
        "WORKORDER_NO": "",
        "SALES_PERSON": "",
        "LOCATION": "",
        "ODN_NO": "",
        "VEHICLE_NO": "",
        "FREIGHT_BILLNO": "",
        "PRODUCT": "",
        "ROUTE": "",
        "NATURE_DAMAGE": "",
        "CLAIM_STATUS": ""
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

          this.searchOptionsList = res.ITEMS;
          this.showForm = false;
          this.SavedDataShow = true;
          this.ShowHeaderForm = true;
          this.showTable = false;
          const header = res.HEADER?.[0];
          console.log("HEADER PATCH", header)
          this.HeaderForm.patchValue({
            INV_NO: header.ZINV_NO,
            INV_DATE: header.ZINV_DATE,
            FSR_RPT_DT: header.ZFSR_RPT_DT,
            BASIC_VALUE: header.ZBASIC_VALUE,
            INC_DATE: header.ZINC_DATE,
            CUSTOMER: header.ZCUSTOMER,
            CONSIGN_NAME: header.ZCONSIGN_NAME,
            DAMAGE_RMK: header.ZDAMAGE_RMK,
            SETTLEMENT: header.ZSETTLEMENT,
            CLOSING_DT: header.ZCLOSING_DT,
            IMAGES: header.ZIMAGES,
            ODN_NO: header.ODN_NO,
            SONO: header.SONO,
            SALE_PERSON: header.ZSALE_PERSON,
            LOCATION: header.ZLOCATION,
            ROUTE: header.ZROUTE,
            REFNO: header.ZREFNO,
          });

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

  allSelected(): boolean {
    return this.items.controls.length > 0 &&
      this.items.controls.every(ctrl => ctrl.get('selected')?.value === true);
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.items.controls.forEach(ctrl => ctrl.get('selected')?.setValue(isChecked));
  }

  onRowCheckboxChange(): void {
    this.isAllSelected = this.allSelected();
    console.log('All Selected:', this.items.value);
  }

  getSelectedRows() {
    return this.items.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showTable = false;
      this.ShowHeaderForm = false;
      this.showForm = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    if (this.sapType === 'SAP') {
      this.fetchInvoiceDetails();
    } else if (this.sapType === 'Non-SAP') {
      this.fetchInvoiceDetailsnonsap();
    }
  }

  fetchInvoiceDetails() {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = {
      VBELN: referenceNumber
    };

    this.spinner.show();
    this.service.TransitDamageInfofetch(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire("No data found", '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.ShowHeaderForm = true;
        this.showForm = true;

        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES,
          ODN_NO: header.ODN_NO,
          SONO: header.SONO,
          SALE_PERSON: header.SALE_PERSON,
          LOCATION: header.LOCATION,
          ROUTE: header.ROUTE,
          REFNO: header.REFNO,
        });

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            selected: [false],
            ZMAPID: [x.MAPID || ''],
            INV_NO: [x.INV_NO],
            REFNO: [x.REFNO],
            BILLNO: [x.BILLNO],
            PRODUCT: [x.PRODUCT],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER],
            WORK_ORDER: [x.WORK_ORDER]
          });

          this.items.push(row);
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire("Error fetching data", '', 'error');
      }
    });
  }

  onSaveActionSap(action: 'stay' | 'next' | 'previous' = 'stay') {


    const selectedItems = this.items.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }) => rest);

    if (selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one row', 'warning');
      return;
    }


    const invoiceNo =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!invoiceNo) {
      Swal.fire('Warning', 'Invoice / PO missing', 'warning');
      return;
    }

    /* 3️⃣ HEADER preparation */
    const headerValue: any = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = invoiceNo;

    headerValue.REFNO = selectedItems[0]?.REFNO || null;
    headerValue.INC_DATE = headerValue.INC_DATE || null;
    headerValue.CLOSING_DT = headerValue.CLOSING_DT || null;
    headerValue.ROUTE = headerValue.ROUTE ||
      selectedItems.forEach((row: any) => {
        row.INV_NO = invoiceNo;
        row.REFNO = headerValue.REFNO;
      });


    const payload = {
      HEADER: headerValue,
      ITEM: selectedItems
    };

    console.log('✅ FINAL SAVE PAYLOAD', payload);

    /* 6️⃣ API Call */
    this.spinner.show();
    this.service.TransitDamageInfoSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === 'TRUE') {
          Swal.fire({
            icon: 'success',
            text: 'Data Saved Successfully',
            timer: 1200,
            showConfirmButton: false,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/insurance-claim-tracking']);
              } else if (action === 'previous') {
                this.router.navigate(['/freight-billing']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire('Save Failed', res?.MESSAGE || '', 'warning');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Save failed', 'error');
      }
    });
  }

  fetchInvoiceDetailsnonsap() {
    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber) {
      Swal.fire('Warning', `Please enter ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} number`, 'warning');
      return;
    }

    const payload = {
      VBELN: referenceNumber
    };

    this.spinner.show();
    this.service.fetchinvoicelistnonsapwosp(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (!res || res.length === 0) {
          Swal.fire("No data found", '', 'info');
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        this.showTable = true;
        this.ShowHeaderForm = true;
        this.showForm = true;

        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES
        });

        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        items.forEach((x: any) => {
          const row = this.fb.group({
            selected: [false],
            ZMAPID: [''],
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER],
            REFNO: [''],
            WORK_ORDER: [''],
            PRODUCT: [''],
            BILLNO: ['']
          });

          this.items.push(row);
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        Swal.fire("Error fetching NON-SAP data", '', 'error');
      }
    });
  }

  onSaveNonSap(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (this.orderType === 'Outward' && this.selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    // Get header form value and remove referenceItems array
    const headerValue = { ...this.HeaderForm.value };
    delete headerValue.referenceItems;

    headerValue.INV_NO = referenceNumber;

    this.items.controls.forEach(row => {
      row.patchValue({ INV_NO: referenceNumber });
    });

    const payload = {
      HEADER: headerValue,
      ITEM: this.ItemForm.value.ITEMS
    };

    console.log("📤 Non-SAP Final Payload:", payload);

    this.spinner.show();
    this.service.withoutsapSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res?.STATUS === "TRUE" || res?.STATUS === true) {
          Swal.fire({
            text: "✅ Data Saved Successfully!",
            icon: "success",
            showConfirmButton: false,
            timer: 900,
            willClose: () => {
              if (action === 'next') {
                this.router.navigate(['/insurance-claim-tracking']);
              } else if (action === 'previous') {
                this.router.navigate(['/freight-billing']);
              } else {
                this.resetForms();
              }
            }
          });
        } else {
          Swal.fire({
            text: "⚠️ Save Failed: " + (res.MESSAGE || ''),
            icon: "warning"
          });
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire({
          text: "❌ Error while saving data",
          icon: "error"
        });
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

  isSap(): boolean {
    return this.sapType === 'SAP';
  }
}