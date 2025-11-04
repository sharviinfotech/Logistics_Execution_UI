import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {

  dispatchForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private service: GeneralserviceService
  ) {
    this.dispatchForm = this.fb.group({
      rows: this.fb.array([this.createRow(true)])
    });
  }

  ngOnInit() {
    // ✅ FIRST ROW VEHICLE TYPE CHANGE LOGIC
    this.rows.at(0).get('VehicleType')?.valueChanges.subscribe(val => {

      if (val !== 'Full Truck Load') {
        this.resetRowsForNonFTL(val);   // ✅ CLEAR ALL EXTRA ROWS
      } else {
        this.applyVehicleTypeToAll(val); // ✅ APPLY TO ALL ROWS
      }

      this.cd.detectChanges();
    });
  }

  // ✅ CREATE NEW ROW
  createRow(isFirstRow: boolean = false): FormGroup {
    const row = this.fb.group({
      workorder: [''],
      VehicleType: ['', Validators.required],
      NoOfTrucks: [''],
      Transporter: [''],
      LoadingPoints: [''],
      UnLoadingPoints: ['']
    });

    // ✅ WHEN VEHICLE TYPE CHANGES → CLEAR ALL FIELDS
    row.get('VehicleType')?.valueChanges.subscribe(val => {
      row.patchValue({
        workorder: '',
        NoOfTrucks: '',
        Transporter: '',
        LoadingPoints: '',
        UnLoadingPoints: ''
      }, { emitEvent: false });

      this.cd.detectChanges();
    });

    // ✅ ONLY FIRST ROW EDITABLE
    if (!isFirstRow) {
      row.get('VehicleType')?.disable();
    }

    return row;
  }

  // ✅ GET ROW ARRAY CONTROL
  get rows(): FormArray {
    return this.dispatchForm.get('rows') as FormArray;
  }

  // ✅ APPLY FIRST ROW VEHICLE TYPE TO ALL ROWS
  applyVehicleTypeToAll(type: string) {
    this.rows.controls.forEach((row, index) => {
      if (index === 0) return;

      row.get('VehicleType')?.setValue(type, { emitEvent: false });
      row.get('VehicleType')?.disable();
    });

    this.cd.detectChanges();
  }

  // ✅ REMOVE EXTRA ROWS IF NOT FTL
  resetRowsForNonFTL(type: string) {

    // ✅ KEEP ONLY FIRST ROW
    const firstRow = this.rows.at(0);

    firstRow.patchValue({
      workorder: '',
      NoOfTrucks: '',
      Transporter: '',
      LoadingPoints: '',
      UnLoadingPoints: ''
    }, { emitEvent: false });

    // ✅ DELETE ALL OTHER ROWS
    while (this.rows.length > 1) {
      this.rows.removeAt(1);
    }

    this.cd.detectChanges();
  }

  // ✅ ADD NEW ROW
  addRow() {
    this.rows.push(this.createRow(false));

    const firstType = this.rows.at(0).get('VehicleType')?.value;
    if (firstType) {
      this.applyVehicleTypeToAll(firstType);
    }
  }

  // ✅ REMOVE ROW
  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
    }
  }

  // ✅ SAVE
  save() {

    this.spinner.show();
    if (!this.dispatchForm.valid) {
      this.dispatchForm.markAllAsTouched();
      return;
    }

    const payload = {
      DISPATCH: this.rows.controls.map((row: any) => ({
        NO_TRUCKS: row.get('NoOfTrucks')?.value,
        VEH_TYPE: row.get('VehicleType')?.value,
        WORK_ORDER: row.get('workorder')?.value,
        LOAD_PT: row.get('LoadingPoints')?.value,
        UNLOAD_PT: row.get('UnLoadingPoints')?.value,
        TRANSPORTER: row.get('Transporter')?.value
      }))
    };

    console.log("Final Payload Sending →", payload);

    this.service.DispatchSave(payload).subscribe(
      (res: any) => {
        this.spinner.hide()
        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            text: res.MSG,
            icon: 'success',
            confirmButtonText: 'Ok',

          }).then(() =>
            this.resetAll()
          );
        } else {
          Swal.fire({
            text: res.MSG,
            icon: 'error',

          });
        }
      },

      err => {
        console.error("API Error:", err);

        this.spinner.hide();
        Swal.fire({
          text: err.MESSAGE || 'Failed to save Transit Info (Non-SAP)!',
          icon: 'error',
          timer: 3000
        });
      }
    );

  }
  resetAll() { }
}
