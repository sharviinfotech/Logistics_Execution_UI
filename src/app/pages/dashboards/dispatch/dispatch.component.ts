import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';





@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {

  dispatchForm!: FormGroup;
  showActionColumn: boolean = false;

  // Main mode selection
  mainMode: string = 'creation';

  orderType: string = '';
  sapType: string = '';
  showForm = false;
  isAddingRow = false;
  maxTrucksReached = false;
  maxLimitReached = false;
  maxRowsAllowed = 0;
  isUpdateMode: boolean = false;
  fetchedLineNumbers: number[] = [];

  
  originalTotalTrucks: number = 0;
  originalTotalInvoices: number = 0;
  originalTotalLRs: number = 0;
  originalTotalLoadingPoints: number = 0;
  originalTotalUnLoadingPoints: number = 0;

  VendorCodeList: any[] = [];
  PlantCodeList: any[] = [];
  filterSapType: string = '';

  searchReference: string = '';
  selectedType: string = '';
  searchValue: string = '';
  searchPlaceholder: string = 'Select search type';

  searchOptions = [
    { key: 'RNO', label: 'Reference Number' },
    { key: 'LR_NO', label: 'LR Number' },
    { key: 'TRANSPORTER', label: 'Transporter' },
    { key: 'WORK_ORDER', label: 'Work Order' }
  ];

  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private service: GeneralserviceService,
    private router: Router
  ) {
    this.dispatchForm = this.fb.group({
      rows: this.fb.array([this.createRow(true)])
    });
  }

  ngOnInit() {
    this.rows.at(0).get('VehicleType')?.valueChanges.subscribe(val => {
      this.handleVehicleTypeChange(val);
    });

    this.rows.controls.forEach((row, index) => {
      this.watchRowFields(row as FormGroup, index);
    });

    const firstRow = this.rows.at(0) as FormGroup;

    // Watch for NoOfTrucks changes in first row to update original value
    firstRow.get('NoOfTrucks', )?.valueChanges.subscribe(val => {
      this.originalTotalTrucks = +val || 0;
      this.redistributeNoOfTrucks();
    });

    // Watch for NoOfInvoices changes in first row to update original value
    firstRow.get('NoOfInvoices')?.valueChanges.subscribe(val => {
      this.originalTotalInvoices = +val || 0;
      this.redistributeInvoices();
    });

    // Watch for NoOfLRs changes in first row to update original value
    firstRow.get('NoOfLRs')?.valueChanges.subscribe(val => {
      this.originalTotalLRs = +val || 0;
      this.redistributeLRs();
    });

    // Watch for LoadingPoints changes in first row to update original value
    firstRow.get('LoadingPoints')?.valueChanges.subscribe(val => {
      this.originalTotalLoadingPoints = +val || 0;
      this.redistributeLoadingPoints();
    });

    // Watch for UnLoadingPoints changes in first row to update original value
    firstRow.get('UnLoadingPoints')?.valueChanges.subscribe(val => {
      this.originalTotalUnLoadingPoints = +val || 0;
      this.redistributeUnLoadingPoints();
    });

    ['VehicleType', 'NoOfInvoices', 'NoOfLRs', 'LoadingPoints', 'UnLoadingPoints']
      .forEach(field => {
        firstRow.get(field)?.valueChanges.subscribe(() => {
          this.applyFirstRowValuesToAll();
        });
      });

    this.fetchVendorCodeList();
    this.fetchPlantCodeList();
  }

  onMainModeChange(): void {
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isUpdateMode = false;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterSapType = '';
    this.filterVehicleType = '';
    this.filteredData = [];
    this.filterApplied = false;
    this.selectedType = '';
    this.searchValue = '';
    this.cd.detectChanges();
  }

  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.dispatchForm.reset();
    this.isUpdateMode = false;
    this.originalTotalTrucks = 0;
  }

  onSapTypeChange(): void {
  this.dispatchForm.reset();
  this.showForm = !!(this.orderType && this.sapType);
  this.isUpdateMode = false;

  // Reset search bar
  this.selectedType = '';
  this.searchValue = '';
  this.searchPlaceholder = 'Select search type';

  const rowsArray = this.dispatchForm.get('rows') as FormArray;
  rowsArray.clear();
  rowsArray.push(this.createRow(true));

  this.showActionColumn = false;
  this.maxLimitReached = false;
  this.maxRowsAllowed = 0;
  this.originalTotalTrucks = 0;

  this.cd.detectChanges();
}

  createRow(isFirstRow: boolean = false): FormGroup {
    const row = this.fb.group({
      LINE_NO: [''],
      CREATED_DT: [''],
      workorder: [''],
      VehicleType: ['', Validators.required],
      NoOfTrucks: ['', Validators.required],
      NoOfInvoices: ['', Validators.required],
      VendorCode: [''],
      Transporter: ['', Validators.required],
      Plant: ['', Validators.required],
      Division: ['', Validators.required],
      NoOfLRs: ['', Validators.required],
      LRNumber: ['', Validators.required],
      LoadingPoints: ['', Validators.required],
      UnLoadingPoints: ['', Validators.required]
    });

    row.get('VehicleType')?.valueChanges.subscribe(() => {
      if (!this.isAddingRow) {
        row.patchValue({
          workorder: '',
          NoOfTrucks: '',
          NoOfInvoices: '',
          VendorCode: '',
          Transporter: '',
          Plant: '',
          Division: '',
          NoOfLRs: '',
          LoadingPoints: '',
          LRNumber: '',
          UnLoadingPoints: ''
        }, { emitEvent: false });
        this.originalTotalTrucks = 0;
      }
      this.checkActionColumnVisibility();
      this.cd.detectChanges();
    });

    return row;
  }

  get rows(): FormArray {
    return this.dispatchForm.get('rows') as FormArray;
  }

  watchRowFields(row: FormGroup, index: number) {
    ['NoOfTrucks', 'NoOfLRs', 'LoadingPoints', 'UnLoadingPoints'].forEach(field => {
      row.get(field)?.valueChanges.subscribe(() => {
        this.checkActionColumnVisibility();
      });
    });
  }

  handleVehicleTypeChange(val: string) {
    this.showActionColumn = (val === 'Full Truck Load');

    if (val !== 'Full Truck Load') {
      this.resetRowsForNonFTL(val);
    }

    this.applyFirstRowValuesToAll();
    this.cd.detectChanges();
  }

  checkActionColumnVisibility() {
    const firstType = this.rows.at(0).get('VehicleType')?.value;

    if (firstType === 'Full Truck Load') {
      this.showActionColumn = true;
      this.cd.detectChanges();
      return;
    }

    this.showActionColumn = this.rows.controls.some((row: any) => {
      const trucks = +row.get('NoOfTrucks')?.value || 0;
      const lrs = +row.get('NoOfLRs')?.value || 0;
      const loadPts = +row.get('LoadingPoints')?.value || 0;
      const unloadPts = +row.get('UnLoadingPoints')?.value || 0;
      return trucks > 1 || lrs > 1 || loadPts > 1 || unloadPts > 1;
    });

    this.cd.detectChanges();
  }

  redistributeNoOfTrucks() {
    if (this.originalTotalTrucks === 0 || this.rows.length === 0) return;

    const totalRows = this.rows.length;
    const trucksPerRow = Math.floor(this.originalTotalTrucks / totalRows);
    const remainder = this.originalTotalTrucks % totalRows;

    this.rows.controls.forEach((row, index) => {
      const splitValue = trucksPerRow + (index < remainder ? 1 : 0);
      row.get('NoOfTrucks',)?.setValue(splitValue, { emitEvent: false });
    });

    this.updateMaxRowsAllowed();
    this.cd.detectChanges();
  }

  redistributeInvoices() {
    if (this.originalTotalInvoices === 0 || this.rows.length === 0) return;

    const totalRows = this.rows.length;
    const invoicesPerRow = Math.floor(this.originalTotalInvoices / totalRows);
    const remainder = this.originalTotalInvoices % totalRows;

    this.rows.controls.forEach((row, index) => {
      const splitValue = invoicesPerRow + (index < remainder ? 1 : 0);
      row.get('NoOfInvoices')?.setValue(splitValue, { emitEvent: false });
    });

    this.cd.detectChanges();
  }

  redistributeLRs() {
    if (this.originalTotalLRs === 0 || this.rows.length === 0) return;

    const totalRows = this.rows.length;
    const lrsPerRow = Math.floor(this.originalTotalLRs / totalRows);
    const remainder = this.originalTotalLRs % totalRows;

    this.rows.controls.forEach((row, index) => {
      const splitValue = lrsPerRow + (index < remainder ? 1 : 0);
      row.get('NoOfLRs')?.setValue(splitValue, { emitEvent: false });
    });

    this.cd.detectChanges();
  }

  redistributeLoadingPoints() {
    if (this.originalTotalLoadingPoints === 0 || this.rows.length === 0) return;

    const totalRows = this.rows.length;
    const loadingPointsPerRow = Math.floor(this.originalTotalLoadingPoints / totalRows);
    const remainder = this.originalTotalLoadingPoints % totalRows;

    this.rows.controls.forEach((row, index) => {
      const splitValue = loadingPointsPerRow + (index < remainder ? 1 : 0);
      row.get('LoadingPoints')?.setValue(splitValue, { emitEvent: false });
    });

    this.cd.detectChanges();
  }

  redistributeUnLoadingPoints() {
    if (this.originalTotalUnLoadingPoints === 0 || this.rows.length === 0) return;

    const totalRows = this.rows.length;
    const unloadingPointsPerRow = Math.floor(this.originalTotalUnLoadingPoints / totalRows);
    const remainder = this.originalTotalUnLoadingPoints % totalRows;

    this.rows.controls.forEach((row, index) => {
      const splitValue = unloadingPointsPerRow + (index < remainder ? 1 : 0);
      row.get('UnLoadingPoints')?.setValue(splitValue, { emitEvent: false });
    });

    this.cd.detectChanges();
  }

  applyFirstRowValuesToAll() {
    const firstRow = this.rows.at(0) as FormGroup;

    const fixedValues = {
      VehicleType: firstRow.get('VehicleType')?.value,
      workorder: firstRow.get('workorder')?.value,
      VendorCode: firstRow.get('VendorCode')?.value,
      Transporter: firstRow.get('Transporter')?.value,
      // NoOfLRs: firstRow.get('NoOfLRs')?.value,
      // LoadingPoints: firstRow.get('LoadingPoints')?.value,
      // UnLoadingPoints: firstRow.get('UnLoadingPoints')?.value
    };

    this.rows.controls.forEach((row, index) => {
      if (index === 0) return;

      row.get('VehicleType')?.enable({ emitEvent: false });
      row.get('workorder')?.enable({ emitEvent: false });
      row.get('VendorCode')?.enable({ emitEvent: false });
      row.get('Transporter')?.enable({ emitEvent: false });
      // row.get('NoOfLRs')?.enable({ emitEvent: false });
      // row.get('LoadingPoints')?.enable({ emitEvent: false });
      // row.get('UnLoadingPoints')?.enable({ emitEvent: false });

      row.patchValue(fixedValues, { emitEvent: false });

      row.get('VehicleType')?.disable({ emitEvent: false });
      row.get('workorder')?.disable({ emitEvent: false });
      row.get('VendorCode')?.disable({ emitEvent: false });
      row.get('Transporter')?.disable({ emitEvent: false });
      // row.get('NoOfLRs')?.disable({ emitEvent: false });
      // row.get('LoadingPoints')?.disable({ emitEvent: false });
      // row.get('UnLoadingPoints')?.disable({ emitEvent: false });
    });

    this.redistributeNoOfTrucks();
  }

  resetRowsForNonFTL(type: string) {
    const firstRow = this.rows.at(0);
    firstRow.patchValue({
      workorder: '',
      NoOfTrucks: '',
      NoOfInvoices: '',
      VendorCode: '',
      Transporter: '',
      Plant: '',
      Division: '',
      NoOfLRs: '',
      LRNumber: '',
      LoadingPoints: '',
      UnLoadingPoints: ''
    }, { emitEvent: false });

    while (this.rows.length > 1) {
      this.rows.removeAt(1);
    }

    this.originalTotalTrucks = 0;
    this.showActionColumn = false;
    this.cd.detectChanges();
  }

  addRow() {
    if (this.maxLimitReached) {
      Swal.fire({
        text: `You can only add up to ${this.maxRowsAllowed} rows based on entered values.`,
        icon: 'warning',
        timer: 2000
      });
      return;
    }

    this.isAddingRow = true;
    const newRow = this.createRow(false);
    this.rows.push(newRow);
    this.watchRowFields(newRow, this.rows.length - 1);
    this.isAddingRow = false;

    // Redistribute values after adding row
    this.redistributeNoOfTrucks();
    this.redistributeInvoices();
    this.redistributeLRs();
    this.redistributeLoadingPoints();
    this.redistributeUnLoadingPoints();
    this.applyFirstRowValuesToAll();
  }

  updateMaxRowsAllowed() {
    const firstRow = this.rows.at(0);
    const trucks = this.originalTotalTrucks || (+firstRow.get('NoOfTrucks')?.value || 0);
    const lrs = +firstRow.get('NoOfLRs')?.value || 0;
    const loadPts = +firstRow.get('LoadingPoints')?.value || 0;
    const unloadPts = +firstRow.get('UnLoadingPoints')?.value || 0;

    this.maxRowsAllowed = Math.max(trucks, lrs, loadPts, unloadPts);
    this.maxLimitReached = this.rows.length >= this.maxRowsAllowed && this.maxRowsAllowed > 0;
  }

  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);

      // Redistribute values after removing row
      this.redistributeNoOfTrucks();
      this.redistributeInvoices();
      this.redistributeLRs();
      this.redistributeLoadingPoints();
      this.redistributeUnLoadingPoints();
      this.checkActionColumnVisibility();
      this.cd.detectChanges();
    }
  }

  onSearchTypeChange(): void {
    this.searchValue = '';
    this.showForm = false;
    this.isUpdateMode = false;

    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    rowsArray.clear();
    rowsArray.push(this.createRow(true));

    this.showActionColumn = false;
    this.maxLimitReached = false;
    this.maxRowsAllowed = 0;
    this.originalTotalTrucks = 0;

    const selected = this.searchOptions.find(opt => opt.key === this.selectedType);
    this.searchPlaceholder = selected ? `Search by ${selected.label}` : 'Select search type';

    this.cd.detectChanges();
  }

  onSearchReference() {
    if (!this.selectedType || !this.searchValue) {
      Swal.fire('Warning', 'Please select search type and enter value', 'warning');
      return;
    }

    const payload: any = {
      RNO: '',
      LR_NO: '',
      TRANSPORTER: '',
      WORK_ORDER: ''
    };

    payload[this.selectedType] = this.searchValue;

    this.spinner.show();
    let request$;

    if (this.sapType === 'SAP') {
      request$ = this.service.fetchReferencenumber(payload);
    } else if (this.sapType === 'Non-SAP') {
      request$ = this.service.fetchReferencenumberWithoutSap(payload);
    } else {
      this.spinner.hide();
      Swal.fire('Invalid SAP Type configuration', '', 'error');
      return;
    }

    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showForm = false;

        const records = Array.isArray(res) ? res : res?.data || [];

        if (records.length > 0) {
          this.searchReference = records[0].ZREFNO || records[0].REFNO || records[0].RNO || records[0].REF_NO || '';

          console.log('✅ Captured Reference Number:', this.searchReference);
          this.populateDispatchForm(records);
          this.isUpdateMode = true;
          this.showForm = true;
          Swal.fire('Data fetched successfully!', '', 'success');
        } else {
          Swal.fire('No record found for the search criteria', '', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error fetching reference data', '', 'error');
      }
    });
  }

  populateDispatchForm(records: any[]) {
    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    rowsArray.clear();

    // Calculate total trucks from all records
    let totalTrucks = 0;
    records.forEach(item => {
      totalTrucks += (+item.NO_TRUCKS || 0);
    });
    this.originalTotalTrucks = totalTrucks;

    records.forEach((item, index) => {
      const row = this.fb.group({
        LINE_NO: [item.LINE_NO || ''],
        CREATED_DT: [item.CREATED_DT || ''],
        workorder: [item.WORK_ORDER || ''],
        VehicleType: [item.VEH_TYPE || '', Validators.required],
        NoOfTrucks: [item.NO_TRUCKS || '', Validators.required],
        NoOfInvoices: [item.NO_INVOICES || '', Validators.required],
        VendorCode: [item.VENDOR_CD || ''],
        Transporter: [item.TRANSPORTER || '', Validators.required],
        Plant: [item.WERKS || ''],
        Division: [item.DIVISION || '', Validators.required],
        NoOfLRs: [item.NO_LRS || '', Validators.required],
        LRNumber: [item.LR_NO || '', Validators.required],
        LoadingPoints: [item.LOAD_PT || '', Validators.required],
        UnLoadingPoints: [item.UNLOAD_PT || '', Validators.required],
      });

      row.get('LINE_NO')?.disable();
      
      rowsArray.push(row);
      if (index !== 0) row.get('VehicleType')?.disable();
    });

    this.checkActionColumnVisibility();
    this.updateMaxRowsAllowed();
    this.cd.detectChanges();
  }

  onUpdateDispatch(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (!this.searchReference) {
      Swal.fire('Reference Number missing', '', 'warning');
      return;
    }

    if (!this.dispatchForm.valid) {
      this.dispatchForm.markAllAsTouched();
      Swal.fire('Please fill all required fields', '', 'warning');
      return;
    }

    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    const rawRows = rowsArray.getRawValue();

    const payload = rawRows.map((row: any) => ({
      REFNO: Number(this.searchReference),
      LINE_NO: Number(row.LINE_NO),
      CREATED_DT: row.CREATED_DT || '',
      VEH_TYPE: row.VehicleType,
      NO_TRUCKS: Number(row.NoOfTrucks),
      NO_INVOICES: Number(row.NoOfInvoices),
      WORK_ORDER: row.workorder || '',
      VENDOR_CD: Number(row.VendorCode) || 0,
      TRANSPORTER: row.Transporter || '',
      WERKS: row.Plant || '',
      DIVISION: row.Division || '',
      NO_LRS: Number(row.NoOfLRs) || 0,
      LR_NO: row.LRNumber || '',
      LOAD_PT: row.LoadingPoints || '',
      UNLOAD_PT: row.UnLoadingPoints || '',

    }));

    console.log("📤 Update payload:", payload);

    this.spinner.show();
    this.service.fetchReferencenumberEdit(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log("✅ Update response:", res);

        if (res.STATUS === 'TRUE' && res.NUMBER === '200') {
          Swal.fire({
            title: 'Success',
            text: res.MSG || 'Dispatch data updated successfully',
            icon: 'success'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/order-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/dashboard']);
            } else {
              this.resetAll();
              this.searchReference = '';
              this.isUpdateMode = false;
              this.showForm = false;
            }
          });
        } else {
          Swal.fire('Failed', res.MSG || 'Something went wrong', 'error');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Update error:', err);
        Swal.fire('Error', err?.error?.MSG || 'Unable to update dispatch data', 'error');
      }
    });
  }

  fetchVendorCodeList(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res) {
          this.VendorCodeList = res[0].VEND_CODE;
          this.spinner.hide();
        } else {
          Swal.fire("No Vendor Found", "", "warning");
        }
      },
      error => {
        this.spinner.hide();
      }
    );
  }

  onchangeVendorCode(index: number) {
    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    const currentRow = rowsArray.at(index);
    const selectedVendorCode = currentRow.get('VendorCode')?.value;
    const vendorObj = this.VendorCodeList.find(item => item.VENDOR_CODE == selectedVendorCode);

    if (vendorObj) {
      currentRow.patchValue({ Transporter: vendorObj.TRANSPORTER });
    } else {
      currentRow.patchValue({ Transporter: '' });
    }
  }

  onchangeTransporter(index: number) {
    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    const currentRow = rowsArray.at(index);
    const selectedTransporter = currentRow.get('Transporter')?.value;
    const transporterObj = this.VendorCodeList.find(item => item.TRANSPORTER == selectedTransporter);

    if (transporterObj) {
      currentRow.patchValue({ VendorCode: transporterObj.VENDOR_CODE });
    } else {
      currentRow.patchValue({ VendorCode: '' });
    }
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

  onchangePlantCode(index: number) {
  const rowsArray = this.dispatchForm.get('rows') as FormArray;
  const currentRow = rowsArray.at(index);
  const selectedPlantText = currentRow.get('Plant')?.value;  
  
  
  const plantObj = this.PlantCodeList.find(item => item.PLANT_TEXT === selectedPlantText);

  if (plantObj) {
    currentRow.patchValue({ Division: plantObj.DIVISION });
  } else {
    currentRow.patchValue({ Division: '' });
  }
}

 onchangeDivisionCode(index: number) {
  const rowsArray = this.dispatchForm.get('rows') as FormArray;
  const currentRow = rowsArray.at(index);
  const selectedDivision = currentRow.get('Division')?.value;
  const plantObj = this.PlantCodeList.find(item => item.DIVISION === selectedDivision);

  if (plantObj) {
    currentRow.patchValue({ Plant: plantObj.PLANT_TEXT }); 
  } else {
    currentRow.patchValue({ Plant: '' });
  }
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

  onFilterTransporterChange(): void {
    this.cd.detectChanges();
  }

  save(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (!this.sapType) {
      Swal.fire({
        text: 'Please select SAP Type (With SAP / Without SAP) before saving',
        icon: 'warning'
      });
      return;
    }

    if (!this.dispatchForm.valid) {
      this.dispatchForm.markAllAsTouched();
      Swal.fire({
        text: 'Please fill all required fields before saving',
        icon: 'warning'
      });
      return;
    }

    this.spinner.show();

    const payload = {
      DISPATCH: this.rows.controls.map((row: any) => ({
        NO_TRUCKS: row.get('NoOfTrucks')?.value,
        NO_INVOICES: row.get('NoOfInvoices')?.value,
        veh_type: row.get('VehicleType')?.value,
        work_order: row.get('workorder')?.value,
        VENDOR_CD: row.get('VendorCode')?.value,
        transporter: row.get('Transporter')?.value,
        WERKS: row.get('Plant')?.value,
        DIVISION: row.get('Division')?.value,
        NO_LRS: row.get('NoOfLRs')?.value,
        lr_no: row.get('LRNumber')?.value,
        load_pt: row.get('LoadingPoints')?.value,
        unload_Pt: row.get('UnLoadingPoints')?.value
      }))
    };

    let request$;
    if (this.sapType === 'SAP') {
      request$ = this.service.DispatchSave(payload);
    } else if (this.sapType === 'Non-SAP') {
      request$ = this.service.DispatchNonSapSave(payload);
    } else {
      this.spinner.hide();
      Swal.fire({
        text: 'Invalid SAP Type selected. Please choose With SAP or Without SAP.',
        icon: 'error'
      });
      return;
    }

    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
          Swal.fire({
            text: res.MSG || 'Dispatch data saved successfully!',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/order-info']);
            } else if (action === 'previous') {
              this.router.navigate(['/dashboard']);
            } else {
              this.resetAll();
            }
          });
        } else {
          Swal.fire({
            text: res.MSG || 'Dispatch saving failed!',
            icon: 'error'
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire({
          text: err?.error?.MSG || 'Failed to save Dispatch!',
          icon: 'error'
        });
      }
    });
  }

  resetAll() {
    while (this.rows.length !== 0) {
      this.rows.removeAt(0);
    }
    this.rows.push(this.createRow(true));
    this.showActionColumn = false;
    this.originalTotalTrucks = 0;
    this.dispatchForm.markAsPristine();
    this.dispatchForm.markAsUntouched();
    this.dispatchForm.updateValueAndValidity();
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
  
  // Clear filtered data and results
  this.filteredData = [];
  this.filterApplied = false;
  
  this.cd.detectChanges();
}



  applyFilter() {
  if (!this.filterSapType) {
    Swal.fire('Warning', 'Please select SAP Type (With SAP / Without SAP)', 'warning');
    return;
  }

  if (!this.filterFromDate || !this.filterToDate) {
    Swal.fire('Warning', 'Please select From Date and To Date', 'warning');
    return;
  }

  const payload: any = {
    DATE_FROM: this.filterFromDate,
    DATE_TO: this.filterToDate,
    PLANT: this.filterPlant || '',
    DIVISION: this.filterDivision || '',
    TRANSPORTER: this.filterTransporter || '',
    VEHICLE_TYPE: this.filterVehicleType || ''
  };

  this.spinner.show();

  // Choose service based on SAP type
  let request$;
  if (this.filterSapType === 'SAP') {
    request$ = this.service.fetchDispatchFiltered(payload);
  } else if (this.filterSapType === 'Non-SAP') {
    request$ = this.service.fetchDispatchFilteredNonSap(payload);
  } else {
    this.spinner.hide();
    Swal.fire('Error', 'Invalid SAP Type selected', 'error');
    return;
  }

  request$.subscribe({
    next: (res: any) => {
      this.spinner.hide();
      const records = Array.isArray(res) ? res : res?.data || [];

      if (records.length > 0) {
        this.filteredData = records;
        this.filterApplied = true;
        Swal.fire('Success', `Found ${records.length} records`, 'success');
      } else {
        this.filteredData = [];
        this.filterApplied = true;
        Swal.fire('No Records', 'No records found matching the filters', 'info');
      }
    },
    error: (err) => {
      this.spinner.hide();
      Swal.fire('Error', 'Failed to fetch filtered data', 'error');
    }
  });
}

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filteredData = [];
    this.filterApplied = false;
    this.cd.detectChanges();
  }

  downloadExcel() {
    if (!this.filteredData || this.filteredData.length === 0) {
      Swal.fire('Warning', 'No data to download. Please apply filters first.', 'warning');
      return;
    }

    const exportData = this.filteredData.map((record) => ({
      "Reference No": record.ZREFNO || '',
      "Date": record.ZCREATED_DT || '',
      "Vehicle Type": record.ZVEH_TYPE || '',
      "Work Order": record.ZWORK_ORDER || '',
      "Vendor Code": record.ZVENDOR_CD || '',
      "Transporter": record.ZTRANSPORTER || '',
      "Plant": record.ZWERKS || '',
      "Division": record.ZDIVISION || '',
      "No. of Trucks": record.ZNO_TRUCKS || '',
      "No. of LRs": record.ZNO_LRS || '',
      "LR Number": record.ZLR_NO || '',
      "Loading Points": record.ZLOAD_PT || '',
      "Unloading Points": record.ZUNLOAD_PT || '',
      "No. of Invoices": record.ZNO_INVOICES || '',
      "Created date": record.ZCREATED_DT || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dispatch Records');

    // Auto column width
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(key.length + 5, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Dispatch_Records.xlsx');
     Swal.fire('Success', `Excel file downloaded: Dispatch_Records.xlsx`, 'success');
  }

  downloadPDF() {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('Warning', 'No data to download. Please apply filters first.', 'warning');
    return;
  }

  const doc = new (jsPDF as any).default('l', 'mm', 'a3'); // landscape

  /* ===== PDF HEADING ===== */
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Dispatch Records Report', doc.internal.pageSize.getWidth() / 2, 12, {
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

  const headers = [[
    'Reference No',
    'Date',
    'Vehicle Type',
    'Work Order',
    'Vendor Code',
    'Transporter',
    'Plant',
    'Division',
    'No. of Trucks',
    'No. of LRs',
    'LR Number',
    'Loading Points',
    'Unloading Points',
    'No. of Invoices',
    'Created date'
  ]];

  const data = this.filteredData.map(record => ([
    record.ZREFNO || '',
    record.ZCREATED_DT || '',
    record.ZVEH_TYPE || '',
    record.ZWORK_ORDER || '',
    record.ZVENDOR_CD || '',
    record.ZTRANSPORTER || '',
    record.ZWERKS || '',
    record.ZDIVISION || '',
    record.ZNO_TRUCKS || '',
    record.ZNO_LRS || '',
    record.ZLR_NO || '',
    record.ZLOAD_PT || '',
    record.ZUNLOAD_PT || '',
    record.ZNO_INVOICES || '',
    record.ZCREATED_DT || ''
  ]));

  

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 25, // ⬅️ important: start after heading
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [52, 152, 219]
    }
  });

  doc.save('Dispatch_Records.pdf');
   Swal.fire('Success', `PDF file downloaded: Dispatch_Records.pdf  `, 'success');
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
  this.searchValue = '';
  this.searchPlaceholder = 'Select search type';
  
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
  this.resetAll();
  
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