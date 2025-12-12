import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from 'src/app/spinner.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.css']
})
export class ShipmentDetailsComponent implements OnInit {

  // Dropdown options
  productOptions = ['Batteries', 'Electronics', 'Fuze', 'Cement Poles and Piles', 'Raw Materials', 'Job Work Material', 'Machinery', 'Others'];
  batteryConditionOptions = ['Dry and discharge with solid electrolyte', 'Dry and discharge with Liquid electrolyte', 'Filled and discharged', 'Filled and charged', 'Filled and formed no free Acid', 'Lead acid batteries (Dry)', 'Lead acid batteries (Filled)'];
  insuranceScopeOptions = ['Buyer', 'Supplier'];

  // Form and variables
  ProductInfo!: FormGroup;
  isEditMode = false;
  showForm = false;
  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  TypeofmaterialList: any = [];
  IncotermsList: any[] = [];
  isAllSelected: boolean = false;

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

  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      ZINCO: ['', Validators.required],
      ZINS_SCPOE: ['', Validators.required],
      ZKM: [null, [Validators.required, Validators.min(0)]],
      items: this.fb.array([this.createItemRow()]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });

    this.fetchIncoterms();
  }

  // Getter for Product Items FormArray
  get items(): FormArray {
    return this.ProductInfo.get('items') as FormArray;
  }

  // Getter for Reference Items FormArray
  get referenceItems(): FormArray {
    return this.ProductInfo.get('referenceItems') as FormArray;
  }

  // Create one product item row
  createItemRow(): FormGroup {
    return this.fb.group({
      selected: [false],
      ZMAPID: [''],
      ZPRODUCT: ['', Validators.required],
      MTBEZ: ['', Validators.required],
      MAKTX: ['', Validators.required],
      ZSETS: [null, [Validators.required, Validators.min(1)]],
      ZAH: [null, [Validators.required, Validators.min(0)]],
      ZSHIP_WT: [null, [Validators.required, Validators.min(0)]],
      ZBATCOND: [''],
      MANDT: [''],
      ZREFNO: [''],
      ZLINE_NO: [''],
      VBELN: [''],
      POSNR: [''],
      ZSO_NO: [''],
      ZODN_NO: [''],
      MTART: [''],
      ZINCO: [''],
      ZINS_SCPOE: [''],
      ZPIN_PLT: [''],
      ZPIN_STP: [''],
      ZKM: [''],
      ZWORK_ORDER: [''],
      ZLRNO: [''],
      ZTRANSPORTER: [''],

    });
  }



  // Create one reference row
  createReferenceRow(): FormGroup {
    return this.fb.group({
      MAPID: [''],
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      soNumber: [''],        // Sales Order Number
      odnNumber: [''],       // ODN Number
      materialType: [''],    // Material Type (MTART)
      plantCode: [''],       // Plant Code (ZPIN_PLT)
      shippingPoint: ['']    // Shipping Point (ZPIN_STP)
    });
  }

  // Add / Remove product rows
  addRow() {
    this.items.push(this.createItemRow());
  }

  removeRow(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      alert('Cannot delete the last row.');
    }
  }

  resetForm() {
    this.ProductInfo.reset();
    this.items.clear();
    this.referenceItems.clear();
    this.items.push(this.createItemRow());
    this.referenceItems.push(this.createReferenceRow());
    this.showForm = false;
    this.ponumber = '';
    this.invoicenumber = '';
    this.sapType = '';
    this.orderType = '';
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.searchReference = '';
    this.selectedType = '';
  }

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    if (this.sapType === 'SAP') {
      this.showForm = false;
      this.ponumber = '';
      this.invoicenumber = '';
    } else {
      this.showForm = true;
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

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.ProductInfo.reset();
    this.items.clear();
    this.referenceItems.clear();
    this.items.push(this.createItemRow());
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
      global_scr: 'SHIPMENT DETAILS',
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : ''
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();
    let apiCall;

    // 🎯 CONDITION BASED API CALL
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
            MAPID: [d.MAPID],
            referenceNumber: [d.REF_NO || d.referenceNumber || ''],
            workOrderNumber: [d.WORK_ORDER_NO || d.workOrderNumber || ''],
            lrNumber: [d.LR_NO || d.lrNumber || ''],
            transporter: [d.TRANSPORTER || d.transporter || ''],
            soNumber: [d.SO_NO || d.soNumber || ''],        // Sales Order Number
            odnNumber: [d.ODN_NO || d.odnNumber || ''],     // ODN Number
            materialType: [d.MTART || d.materialType || ''], // Material Type
            plantCode: [d.PLANT_CODE || d.ZPIN_PLT || d.plantCode || ''],  // Plant Code
            shippingPoint: [d.SHIPPING_POINT || d.ZPIN_STP || d.shippingPoint || '']  // Shipping Point
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

    // Find object based on selected MAPID
    const selectedObj = this.selectedItems.find(item => item.MAPID == selectedMapId);

    console.log("Selected MAPID object:", selectedObj);

    if (selectedObj) {
      rowForm.patchValue({
        ZREFNO: selectedObj.referenceNumber || "",
        ZWORK_ORDER: selectedObj.workOrderNumber || "",
        ZLRNO: selectedObj.lrNumber || "",
        ZTRANSPORTER: selectedObj.transporter || "",
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

      "global": "SHIPMENT DETAILS",
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

  // Product checkbox methods
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

  // Fetch invoice details
  fetchInvoiceDetails() {
    if (this.sapType !== 'SAP') {
      alert('Please select "With SAP" first.');
      return;
    }

    const referenceNumber =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber?.trim()) {
      alert(
        `Please enter a valid ${this.orderType === 'Inward' ? 'PO' : 'Invoice'
        } Number`
      );
      return;
    }

    const payload = { INV_GET: referenceNumber.trim() };
    this.spinner.show();

    this.service.shipmentdetailsfetch(payload).subscribe({
      next: (res: any) => {
        // YOUR SAP RESPONSE IS ALWAYS ARRAY
        const result = Array.isArray(res) ? res : [];

        if (result.length === 0) {
          alert('No data found for this reference.');
          this.spinner.hide();
          return;
        }

        const firstItem = result[0];

        // Clear existing rows
        this.items.clear();

        // Patch top form (Product Info)
        this.ProductInfo.patchValue({
          ZINCO: firstItem.ZINCO || '',
          ZINS_SCPOE: firstItem.ZINS_SCPOE || '',
          ZKM: firstItem.ZKM ?? null
        });

        // Fill FormArray rows
        result.forEach((item: any) => {
          this.items.push(
            this.fb.group({
              selected: [false],
              ZPRODUCT: [item.ZPRODUCT || ''],
              MTBEZ: [item.MTBEZ || ''],
              MAKTX: [item.MAKTX || ''],
              ZSETS: [item.ZSETS || 0, [Validators.min(1)]],
              ZAH: [item.ZAH || 0],
              ZSHIP_WT: [item.ZSHIP_WT || 0],
              ZBATCOND: [item.ZBATCOND || ''],
              MANDT: [item.MANDT || ''],
              ZREFNO: [item.ZREFNO || ''],
              ZLINE_NO: [item.ZLINE_NO || ''],
              VBELN: [item.VBELN || ''],
              POSNR: [item.POSNR || ''],
              ZSO_NO: [item.ZSO_NO || ''],
              ZODN_NO: [item.ZODN_NO || ''],
              MTART: [item.MTART || ''],
              ZINCO: [item.ZINCO || ''],
              ZINS_SCPOE: [item.ZINS_SCPOE || ''],
              ZPIN_PLT: [item.ZPIN_PLT || ''],
              ZPIN_STP: [item.ZPIN_STP || ''],
              ZKM: [item.ZKM || ''],
              ZWORK_ORDER: [item.ZWORK_ORDER || ''],
              ZLRNO: [item.ZLRNO || ''],
              ZTRANSPORTER: [item.ZTRANSPORTER || ''],
              ZMAPID: [item.ZMAPID || 0]
            })
          );
        });

        this.showForm = true;
        this.spinner.hide();
      },

      error: (err) => {
        console.error('Error fetching data:', err);
        alert('Error fetching data from SAP.');
        this.spinner.hide();
      }
    });
  }


  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.fetchInvoiceDetails();
  }

  // Save functionality
  saveShipmentOutward(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    // get selected rows (remove selected flag)
    const selectedRows = this.items.value
      .filter((row: any) => row.selected === true)
      .map(({ selected, ...rest }) => rest);

    console.log('🟦 selectedRows (raw):', selectedRows);

    if (selectedRows.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one product row to save.',
        icon: 'warning',
        timer: 3000,
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

    // parent (common) fields
    const commonFields = {
      ZINCO: this.ProductInfo.get('ZINCO')?.value || '',
      ZINS_SCPOE: this.ProductInfo.get('ZINS_SCPOE')?.value || '',
      ZKM: this.ProductInfo.get('ZKM')?.value ?? 0
    };

    // Build final payload: ensure ZINS_SCPOE & ZKM exist on each row (fallback to commonFields)
    const finalPayload = selectedRows.map((row: any, idx: number) => {
      // prefer item-level ZINS_SCPOE if not empty, otherwise parent
      const itemZins = (row.ZINS_SCPOE && String(row.ZINS_SCPOE).trim() !== '')
        ? row.ZINS_SCPOE
        : commonFields.ZINS_SCPOE;

      // for ZKM, use row.ZKM if not null/undefined, otherwise use parent (allow 0)
      const itemZkm = (row.ZKM !== null && row.ZKM !== undefined && row.ZKM !== '')
        ? row.ZKM
        : commonFields.ZKM;

      // also ensure ZINCO is present on row (fallback)
      const itemZinco = (row.ZINCO && String(row.ZINCO).trim() !== '')
        ? row.ZINCO
        : commonFields.ZINCO;

      return {
        ...row,
        ZINS_SCPOE: itemZins,
        ZKM: itemZkm,
        ZINCO: itemZinco,
        // ensure numeric fields are numbers (optional)
        ZSETS: row.ZSETS ?? 0,
        ZAH: row.ZAH ?? 0,
        ZSHIP_WT: row.ZSHIP_WT ?? 0,
        // you can include any mapping with reference data here if needed later
      };
    });

    console.log('📤 finalPayload (to send):', finalPayload);

    this.spinner.show();
    this.service.ShipmentOutwardSave(finalPayload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ SAP Save Response:', res);

        if (res && res.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Saved successfully',
            icon: 'success',
            confirmButtonText: 'Ok',
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/invoice-load-details']);
            } else if (action === 'previous') {
              this.router.navigate(['/order-info']);
            } else {
              this.resetForm();
            }
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: (res && res.MSG) || 'Failed to save data',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Error saving shipment details:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to save shipment details.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }





  fetchIncoterms() {
    this.spinner.show();
    const payload = { INCO1: "", BEZEI: "" };
    this.service.Incoterms(payload).subscribe({
      next: (res: any) => {
        this.IncotermsList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Incoterms:", err);
        this.spinner.hide();
      }
    });
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onTypeOfMaterialChange() {
    console.log('Type of Material changed');
  }

  fetchNonSapReports(): void {
    const payload = { REPORT: "X" };
    this.spinner.show();

    this.service.shipmentdetailsNonSapReports(payload).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.items.clear();
          const firstItem = res[0];
          this.ProductInfo.patchValue({
            ZINCO: firstItem.ZINCO || '',
            ZINS_SCPOE: firstItem.ZINS_SCPOE || '',
            ZKM: firstItem.ZKM || 0
          });
          res.forEach((item: any) => {
            this.items.push(this.fb.group({
              selected: [false],
              ZPRODUCT: [item.ZPRODUCT || ''],
              MTART: [item.MTART || ''],
              MAKTX: [item.MAKTX || ''],
              ZSETS: [item.ZSETS || 0, [Validators.min(1)]],
              ZAH: [item.ZAH || 0],
              ZSHIP_WT: [item.ZSHIP_WT || 0],
              ZBATCOND: [item.ZBATCOND || '']
            }));
          });
          this.showForm = true;
        } else {
          Swal.fire({
            title: 'Warning',
            text: 'No report data found',
            icon: 'warning',
            confirmButtonText: 'Ok',
            timer: 4000
          });
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Non-SAP Reports:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch Non-SAP reports',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        this.spinner.hide();
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
}