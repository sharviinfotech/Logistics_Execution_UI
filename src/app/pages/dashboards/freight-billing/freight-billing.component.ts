import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

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
  orderType: string = '';
  sapType: string = '';
  showForm = false;
  freightDetails: FreightDetails;
  totalFreight: number = 0;

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
    {key :"sales_person",label: 'Sales Person'},
    {key :"location",label: 'Location'},
    {key :"vehicle_no",label: 'Vehicle No'},
    {key :"freight_billno",label: 'Freight Bill No'},
  ]
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  constructor(
    private fb: FormBuilder,
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
  }

  initializeForm(): void {
    this.FreightBilling = this.fb.group({
      ponumber: [''],
      invoicenumber: [''],
      FreightBillNumber: ['', Validators.required],
      FreightBillDate: ['', Validators.required],
      FreightBillPhysicalSubmissionDate: ['', Validators.required],
      FreightCharges: ['', [Validators.required, Validators.min(0)]],
      WorkOrderNumber: [''],
      BillSubmission: ['', Validators.required],
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

  setupWorkOrderListener(): void {
    this.FreightBilling.get('WorkOrderNumber')?.valueChanges.subscribe((value) => {
      if (value && value !== '') {
        this.FreightBilling.get('FreightBillNumber')?.clearValidators();
        this.FreightBilling.get('FreightBillNumber')?.disable();
        this.FreightBilling.get('FreightBillNumber')?.setValue('');

        this.FreightBilling.get('FreightBillDate')?.clearValidators();
        this.FreightBilling.get('FreightBillDate')?.disable();
        this.FreightBilling.get('FreightBillDate')?.setValue('');

        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.clearValidators();
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.disable();
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValue('');

        this.FreightBilling.get('FreightCharges')?.clearValidators();
        this.FreightBilling.get('FreightCharges')?.disable();
        this.FreightBilling.get('FreightCharges')?.setValue('');
      } else {
        this.FreightBilling.get('FreightBillNumber')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillNumber')?.enable();

        this.FreightBilling.get('FreightBillDate')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillDate')?.enable();

        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.setValidators([Validators.required]);
        this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.enable();

        this.FreightBilling.get('FreightCharges')?.setValidators([Validators.required, Validators.min(0)]);
        this.FreightBilling.get('FreightCharges')?.enable();
      }

      this.FreightBilling.get('FreightBillNumber')?.updateValueAndValidity();
      this.FreightBilling.get('FreightBillDate')?.updateValueAndValidity();
      this.FreightBilling.get('FreightBillPhysicalSubmissionDate')?.updateValueAndValidity();
      this.FreightBilling.get('FreightCharges')?.updateValueAndValidity();
    });
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
      this.service.global_Fields_SearchOption(payload1).subscribe({
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

    const record = {
      INV_NO: formValue.invoicenumber || formValue.ponumber || '',
      BILLNO: formValue.FreightBillNumber || '',
      BILLDATE: formValue.FreightBillDate || '',
      PHY_DATE: formValue.FreightBillPhysicalSubmissionDate || '',
      FRT_CHARGES: formValue.FreightCharges || 0,
      ORDER_NO: formValue.WorkOrderNumber || '',
      BILL_SUBMISSION: formValue.BillSubmission,
      ...(this.orderType === 'Outward' && this.selectedItems.length > 0 ? this.selectedItems[0] : {})
    };

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
}