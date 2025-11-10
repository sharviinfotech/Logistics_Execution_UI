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
  orderType: string = '';       // Inward / Outward
  sapType: string = '';         // SAP / Non-SAP
  invoicenumber: string = '';   // Invoice number
  showTable: boolean = false;   // To show or hide the vehicle table
  isAllSelected: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.VehicleForm = this.fb.group({
      vehicles: this.fb.array([])
    });
    this.addRow();
  }

  // Getter for form array
  get vehicles(): FormArray {
    return this.VehicleForm.get('vehicles') as FormArray;
  }

  // Create a single vehicle row
  createVehicleRow(data?: any): FormGroup {
    return this.fb.group({
      selected: [false], // ✅ checkbox added
      ZTRX_TYPE: [data?.ZTRX_TYPE || '', Validators.required],
      ZTRANSPOTER: [data?.ZTRANSPOTER || '', Validators.required],
      ZLRNO: [data?.ZLRNO || '', Validators.required],
      ZTRUC_TYPE: [data?.ZTRUC_TYPE || '', Validators.required],
      ZTRUC_WT: [data?.ZTRUC_WT || '', Validators.required],
      ZTRUC_VOL: [data?.ZTRUC_VOL || '', [Validators.required, Validators.min(0)]],
      ZVEH_NUM: [data?.ZVEH_NUM || '', Validators.required],
      ZNOOFVEH: [data?.ZNOOFVEH || '', [Validators.required, Validators.min(1)]],
      ZDNAME: [data?.ZDNAME || '', Validators.required],
      ZDNUMBER: [data?.ZDNUMBER || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });
  }

  // Add new row
  addRow(): void {
    this.vehicles.push(this.createVehicleRow());
  }

  onOrderTypeSelection(): void {
    this.sapType = '';
    this.invoicenumber = '';
    this.showTable = false;
    this.vehicles.clear();
    this.addRow();
  }

  // Remove row
  removeRow(index: number): void {
    if (this.vehicles.length > 1) {
      this.vehicles.removeAt(index);
    } else {
      Swal.fire('Warning', 'At least one vehicle entry is required.', 'warning');
    }
  }

  // ✅ Checkbox Methods Start
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
  }

  getSelectedRows() {
    return this.vehicles.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }
  // ✅ Checkbox Methods End

  // ✅ When switching between SAP / Non-SAP
  onSapTypeSelection(): void {
    this.vehicles.clear();
    this.showTable = false;

    if (this.sapType === 'Non-SAP') {
      this.addRow();
      this.showTable = true;
    } else if (this.sapType === 'SAP') {
      this.invoicenumber = '';
    }
  }

  // Fetch Vehicle Info (SAP)
  fetchVehicleDetails(): void {
    if (this.sapType !== 'SAP') {
      Swal.fire('Info', 'Please select "With SAP" first.', 'info');
      return;
    }

    if (!this.invoicenumber?.trim()) {
      Swal.fire('Warning', 'Please enter an invoice number.', 'warning');
      return;
    }

    const reqBody = { INV_GET: this.invoicenumber };

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
          Swal.fire('Success', 'Invoice details loaded successfully.', 'success');
        } else {
          this.showTable = false;
          Swal.fire('Info', 'No data found for this invoice number.', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('API Error:', err);
        Swal.fire('Error', 'Failed to fetch invoice details.', 'error');
      }
    });
  }

  // ✅ Save only selected rows
  saveVehicleInfo(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      Swal.fire('Warning', 'Please select at least one row to save.', 'warning');
      return;
    }

    const cleanedRows = selectedRows.map(({ selected, ...veh }, index: number) => ({
      MANDT: '234',
      VBELN: this.invoicenumber?.trim() || '',
      POSNR: (index + 1) * 10,
      ZVEH_LINE: '',
      ZTRX_TYPE: veh.ZTRX_TYPE,
      ZTRANSPOTER: veh.ZTRANSPOTER,
      ZLRNO: veh.ZLRNO,
      ZTRUC_TYPE: veh.ZTRUC_TYPE,
      ZTRUC_WT: veh.ZTRUC_WT,
      ZTRUC_VOL: Number(veh.ZTRUC_VOL),
      ZVEH_NUM: veh.ZVEH_NUM,
      ZNOOFVEH: Number(veh.ZNOOFVEH),
      ZDNAME: veh.ZDNAME,
      ZDNUMBER: veh.ZDNUMBER
    }));

    this.spinner.show();

    const apiCall =
      this.sapType === 'SAP'
        ? this.service.VehicleInfosave(cleanedRows)
        : this.service.VehicleInfoNonSap(cleanedRows);

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res?.NUMBER === '200') {
          Swal.fire('Success', res.MSG || 'Selected Vehicle(s) saved successfully!', 'success');
          if (action === 'next') {
            // Navigate to next screen (e.g., Invoice Load Details or other)
            this.router.navigate(['/transit-info']); 
          } else if (action === 'previous') {
            // Navigate back to Segment Info
            this.router.navigate(['/segment-info']); 
          }this.resetForm();
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

  // Reset the entire form
  resetForm(): void {
    this.VehicleForm.reset();
    this.vehicles.clear();
    this.addRow();
    this.orderType = '';
    this.sapType = '';
    this.invoicenumber = '';
    this.showTable = false;
    this.isAllSelected = false;
  }
}
