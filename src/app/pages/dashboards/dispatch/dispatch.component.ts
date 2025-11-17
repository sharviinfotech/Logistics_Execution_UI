import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Router } from '@angular/router';

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
  orderType: string = '';
  sapType: string = '';
  showForm = false;
  isAddingRow = false;
  maxTrucksReached = false;
  maxLimitReached = false;
  maxRowsAllowed = 0;
  isUpdateMode: boolean = false;
  fetchedLineNumbers: number[] = [];

  VendorCodeList: any[] = [];
  searchReference: string = ''; 

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

  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.dispatchForm.reset();
    this.isUpdateMode = false;
  }

  onSapTypeChange(): void {
    this.dispatchForm.reset();
    this.showForm = !!(this.orderType && this.sapType);
    this.isUpdateMode = false;
  }

  ngOnInit() {
    this.rows.at(0).get('VehicleType')?.valueChanges.subscribe(val => {
      this.handleVehicleTypeChange(val);
    });

    this.rows.controls.forEach((row, index) => {
      this.watchRowFields(row as FormGroup, index);
    });
    const firstRow = this.rows.at(0);

    ['NoOfTrucks', 'NoOfLRs', 'LoadingPoints', 'UnLoadingPoints'].forEach(field => {
      firstRow.get(field)?.valueChanges.subscribe(() => {
        this.updateMaxRowsAllowed();
      });
    });

    this.fetchVendorCodeList();
  }

  createRow(isFirstRow: boolean = false): FormGroup {
    const row = this.fb.group({
      LINE_NO: [''],
      workorder: [''],
      VehicleType: ['', Validators.required],
      NoOfTrucks: ['', Validators.required],
      VendorCode: [''],
      Transporter: ['', Validators.required],
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
          VendorCode: '',
          Transporter: '',
          NoOfLRs: '',
          LoadingPoints: '',
          LRNumber: '',
          UnLoadingPoints: ''
        }, { emitEvent: false });
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
    } else {
      this.applyVehicleTypeToAll(val);
    }
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

  shouldShowButtons(row: FormGroup): boolean {
    const vehType = row.get('VehicleType')?.value;
    if (vehType === 'Full Truck Load') return true;

    const trucks = +row.get('NoOfTrucks')?.value || 0;
    const lrs = +row.get('NoOfLRs')?.value || 0;
    const loadPts = +row.get('LoadingPoints')?.value || 0;
    const unloadPts = +row.get('UnLoadingPoints')?.value || 0;
    return trucks > 1 || lrs > 1 || loadPts > 1 || unloadPts > 1;
  }

  applyVehicleTypeToAll(type: string) {
    this.rows.controls.forEach((row, index) => {
      if (index === 0) return;
      row.get('VehicleType')?.setValue(type, { emitEvent: false });
      row.get('VehicleType')?.disable();
    });
    this.cd.detectChanges();
  }

  resetRowsForNonFTL(type: string) {
    const firstRow = this.rows.at(0);
    firstRow.patchValue({
      workorder: '',
      NoOfTrucks: '',
      VendorCode: '',
      Transporter: '',
      NoOfLRs: '',
      LRNumber: '',
      LoadingPoints: '',
      UnLoadingPoints: ''
    }, { emitEvent: false });

    while (this.rows.length > 1) {
      this.rows.removeAt(1);
    }

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

    const firstType = this.rows.at(0).get('VehicleType')?.value;
    this.showActionColumn = (firstType === 'Full Truck Load');
    if (firstType) {
      this.applyVehicleTypeToAll(firstType);
    }

    this.isAddingRow = false;
    this.updateMaxRowsAllowed();
    this.cd.detectChanges();
  }

  updateMaxRowsAllowed() {
    const firstRow = this.rows.at(0);

    const trucks = +firstRow.get('NoOfTrucks')?.value || 0;
    const lrs = +firstRow.get('NoOfLRs')?.value || 0;
    const loadPts = +firstRow.get('LoadingPoints')?.value || 0;
    const unloadPts = +firstRow.get('UnLoadingPoints')?.value || 0;

    this.maxRowsAllowed = Math.max(trucks, lrs, loadPts, unloadPts);
    this.maxLimitReached = this.rows.length >= this.maxRowsAllowed && this.maxRowsAllowed > 0;
  }

  checkAddButtonAvailability() {
    const firstRowTrucks = +this.rows.at(0).get('NoOfTrucks')?.value || 0;
    this.maxTrucksReached = this.rows.length >= firstRowTrucks && firstRowTrucks > 0;
  }

  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
      this.checkActionColumnVisibility();
      this.cd.detectChanges();
    }
  }

  // ✅ FETCH REFERENCE NUMBER DATA
  onSearchReference() {
    if (!this.searchReference?.trim()) {
      Swal.fire('Please enter a Reference Number', '', 'warning');
      return;
    }

    const payload = { RNO: this.searchReference };

    this.spinner.show();
    this.service.fetchReferencenumber(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log("✅ Reference Data:", res);

        const records = Array.isArray(res) ? res : res?.data || [];
        if (records.length > 0) {
          this.populateDispatchForm(records);
          this.isUpdateMode = true;
          this.showForm = true;
          Swal.fire('Data fetched successfully!', '', 'success');
        } else {
          Swal.fire('No record found for this Reference Number', '', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('❌ Fetch error:', err);
        Swal.fire('Error fetching Reference Number data', '', 'error');
      }
    });
  }

  // ✅ POPULATE FORM WITH FETCHED DATA
  populateDispatchForm(records: any[]) {
    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    rowsArray.clear();

    records.forEach((item, index) => {
      const row = this.fb.group({
        LINE_NO: [item.LINE_NO || ''],
        workorder: [item.WORK_ORDER || ''],
        VehicleType: [item.VEH_TYPE || '', Validators.required],
        NoOfTrucks: [item.NO_TRUCKS || '', Validators.required],
        VendorCode: [item.VENDOR_CD || ''],
        Transporter: [item.TRANSPORTER || '', Validators.required],
        NoOfLRs: [item.NO_LRS || '', Validators.required],
        LRNumber: [item.LR_NO || '', Validators.required],
        LoadingPoints: [item.LOAD_PT || '', Validators.required],
        UnLoadingPoints: [item.UNLOAD_PT || '', Validators.required],
      });

      row.get('LINE_NO')?.disable();
      rowsArray.push(row);
      if (index !== 0) row.get('VehicleType')?.disable();
    });

    this.checkActionColumnVisibility?.();
    this.updateMaxRowsAllowed?.();
    this.cd.detectChanges();
  }

  // ✅ UPDATE DISPATCH DATA
  onUpdateDispatch(action: 'stay' | 'next' | 'previous' = 'stay') {
    if (!this.searchReference) {
      Swal.fire('Reference Number missing', '', 'warning');
      return;
    }

    // ✅ Validate form before update
    if (!this.dispatchForm.valid) {
      this.dispatchForm.markAllAsTouched();
      Swal.fire('Please fill all required fields', '', 'warning');
      return;
    }

    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    const rawRows = rowsArray.getRawValue(); // ✅ Include disabled fields

    // ✅ Create payload matching API structure
    const payload = rawRows.map((row: any) => ({
      REFNO: Number(this.searchReference),
      LINE_NO: Number(row.LINE_NO),
      VEH_TYPE: row.VehicleType,
      NO_TRUCKS: Number(row.NoOfTrucks),
      WORK_ORDER: row.workorder || '',
      VENDOR_CD: Number(row.VendorCode) || 0,
      TRANSPORTER: row.Transporter || '',
      NO_LRS: Number(row.NoOfLRs) || 0,
      LR_NO: row.LRNumber || '',
      LOAD_PT: row.LoadingPoints || '',
      UNLOAD_PT: row.UnLoadingPoints || ''
    }));

    console.log("📤 Update payload:", payload);

    this.spinner.show();
    this.service.fetchReferencenumberEdit(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log("✅ Update response:", res);

       if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
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

  // ✅ FETCH VENDOR CODE LIST
  fetchVendorCodeList(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res) {
          console.log("✅ Vendor Data Fetched:", res);
          this.VendorCodeList = res[0].VEND_CODE;
          this.spinner.hide();
        } else {
          console.warn("⚠️ No vendor data found");
          Swal.fire("No Vendor Found", "", "warning");
        }
      },
      error => {
        console.error("❌ Vendor Fetch Error:", error);
        this.spinner.hide();
      }
    );
  }

  onchangeVendorCode(index: number) {
    const rowsArray = this.dispatchForm.get('rows') as FormArray;
    const currentRow = rowsArray.at(index);

    const selectedVendorCode = currentRow.get('VendorCode')?.value;
    const vendorObj = this.VendorCodeList.find(
      (item) => item.VENDOR_CODE == selectedVendorCode
    );

    if (vendorObj) {
      console.log("Selected Vendor Object:", vendorObj);
      currentRow.patchValue({
        Transporter: vendorObj.TRANSPORTER
      });
    } else {
      console.log("No Vendor Code selected");
      currentRow.patchValue({
        Transporter: ''
      });
    }
  }

  // ✅ SAVE NEW DISPATCH DATA
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
        veh_type: row.get('VehicleType')?.value,
        work_order: row.get('workorder')?.value,
        VENDOR_CD: row.get('VendorCode')?.value,
        transporter: row.get('Transporter')?.value,
        NO_LRS: row.get('NoOfLRs')?.value,
        lr_no: row.get('LRNumber')?.value,
        load_pt: row.get('LoadingPoints')?.value,
        unload_Pt: row.get('UnLoadingPoints')?.value
      }))
    };

    console.log("📤 Dispatch Save Payload:", payload);

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
        console.log("✅ Dispatch Save Response:", res);

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
        console.error("❌ Dispatch Save Error:", err);
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
    this.dispatchForm.markAsPristine();
    this.dispatchForm.markAsUntouched();
    this.dispatchForm.updateValueAndValidity();
    this.cd.detectChanges();
  }
}