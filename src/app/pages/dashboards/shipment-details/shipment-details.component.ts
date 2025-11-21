import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import Swal from 'sweetalert2';
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
  Incoterms: string = '';
  isAllSelected: boolean = false;

  selectedItems: any[] = [];
  searchReference: string = '';
  searchOptions = [
    { key: 'NUM', label: 'Reference No' },
    { key: 'INV_NO', label: 'Invoice No' },
    { key: 'ODN_NO', label: 'ODN No' },
    { key: 'SO_NUM', label: 'SO No' },
    { key: 'LR_NO', label: 'LR NO' }
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
  ) {}

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      Incoterms: ['', Validators.required],
      InsuranceScope: ['', Validators.required],
      Kilometres: [null, [Validators.required, Validators.min(0)]],
      items: this.fb.array([this.createItemRow()]),
      referenceItems: this.fb.array([this.createReferenceRow()])
    });
    this.fetchTypeofmaterial();
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
      Product: ['', Validators.required],
      TypeOfMaterial: ['', Validators.required],
      MaterialDescription: ['', Validators.required],
      Noofseats: [null, [Validators.required, Validators.min(1)]],
      AhLoadedInTruck: [null, [Validators.required, Validators.min(0)]],
      ShipmentWeight: [null, [Validators.required, Validators.min(0)]],
      BatteryCondition: ['']
    });
  }

  // Create one reference row
  createReferenceRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
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

    let payload: any = {
      NUM: '',
      INV_NO: '',
      ODN_NO: '',
      SO_NUM: '',
      LR_NO: ''
    };
    payload[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload:', payload);

    this.spinner.show();
    this.service.global_Fields_SearchOption(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.length > 0) {
          this.searchOptionsList = res;
          this.showForm = false;
          Swal.fire('Data fetched successfully!', '', 'success');
        } else {
          Swal.fire('No records found', '', 'info');
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

    const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;
    if (!referenceNumber?.trim()) {
      alert(`Please enter a valid ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} Number`);
      return;
    }

    const payload = { INV_GET: referenceNumber.trim() };
    this.spinner.show();
    
    this.service.shipmentdetailsfetch(payload).subscribe({
      next: (res: any) => {
        const result = Array.isArray(res) ? res : (res?.data || []);

        if (result.length > 0) {
          const firstItem = result[0];
          
          this.items.clear();
          
          this.ProductInfo.patchValue({
            Incoterms: firstItem.ZINCO || '',
            InsuranceScope: firstItem.ZINS_SCPOE || '',
            Kilometres: firstItem.ZKM !== null && firstItem.ZKM !== undefined ? firstItem.ZKM : null
          });

          result.forEach((item: any) => {
            this.items.push(this.fb.group({
              selected: [false],
              Product: [item.ZPRODUCT || ''],
              TypeOfMaterial: [item.MTBEZ || ''],
              MaterialDescription: [item.MAKTX || ''],
              Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
              AhLoadedInTruck: [item.ZAH || 0],
              ShipmentWeight: [item.ZSHIP_WT || 0],
              BatteryCondition: [item.ZBATCOND || '']
            }));
          });
          
          this.showForm = true;
          this.spinner.hide();
        } else {
          alert('No data found for this reference.');
          this.spinner.hide();
        }
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
    const selectedProductRows = this.getSelectedRows();
    const selectedReferenceRows = this.referenceItems.controls
      .filter((_, idx) => this.isItemSelected(idx))
      .map(item => item.value);

    if (selectedProductRows.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one product row to save.',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    if (this.orderType === 'Outward' && selectedReferenceRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one reference row before saving'
      });
      return;
    }

    const commonFields = {
      Incoterms: this.ProductInfo.get('Incoterms')?.value,
      InsuranceScope: this.ProductInfo.get('InsuranceScope')?.value,
      Kilometres: this.ProductInfo.get('Kilometres')?.value
    };

    const cleanedRows = selectedProductRows.map(({ selected, ...rest }) => ({
      ...rest,
      ...commonFields,
      ...(this.orderType === 'Outward' && selectedReferenceRows.length > 0 ? selectedReferenceRows[0] : {})
    }));

    console.log("Saving selected rows:", cleanedRows);
    this.spinner.show();

    const saveOperation = this.sapType === 'SAP'
      ? this.service.ShipmentOutwardSave(cleanedRows)
      : this.service.shipmentdetailsNonSapSave(cleanedRows);

    saveOperation.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        
        if (res.NUMBER == "200") {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Selected rows saved successfully!',
            icon: 'success',
            confirmButtonText: 'Ok'
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
            text: res.MSG || 'Save Failed',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error("Save Error:", err);
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong while saving shipment details.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  fetchTypeofmaterial() {
    this.spinner.show();
    this.service.getTypeofmaterial().subscribe({
      next: (res: any) => {
        this.TypeofmaterialList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Type of Material:", err);
        this.spinner.hide();
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
            Incoterms: firstItem.ZINCO || '',
            InsuranceScope: firstItem.ZINS_SCPOE || '',
            Kilometres: firstItem.ZKM || 0
          });
          res.forEach((item: any) => {
            this.items.push(this.fb.group({
              selected: [false],
              Product: [item.ZPRODUCT || ''],
              TypeOfMaterial: [item.MTART || ''],
              MaterialDescription: [item.MAKTX || ''],
              Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
              AhLoadedInTruck: [item.ZAH || 0],
              ShipmentWeight: [item.ZSHIP_WT || 0],
              BatteryCondition: [item.ZBATCOND || '']
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