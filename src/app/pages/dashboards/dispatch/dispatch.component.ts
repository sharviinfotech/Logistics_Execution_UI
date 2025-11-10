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
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {

  dispatchForm!: FormGroup;
  showActionColumn: boolean = false;
  orderType: string = '';
  sapType: string = '';
  showForm = false;


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
}
onSapTypeChange(): void {
  this.dispatchForm.reset();
  this.showForm = !!(this.orderType && this.sapType);
  console.log('SAP Type changed to:', this.sapType, '| Form visible:', this.showForm);
}

  ngOnInit() {
    // ✅ FIRST ROW VEHICLE TYPE CHANGE LOGIC
    this.rows.at(0).get('VehicleType')?.valueChanges.subscribe(val => {
      this.showActionColumn = (val === 'Full Truck Load');

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
      VendorCode: [''],
      Transporter: [''],
      NoOfLRs: [''],
      LRNumber: [''],
      LoadingPoints: [''],
      UnLoadingPoints: ['']
    });

    // ✅ WHEN VEHICLE TYPE CHANGES → CLEAR ALL FIELDS
    row.get('VehicleType')?.valueChanges.subscribe(val => {
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
      VendorCode: '',
      Transporter: '',
      NoOfLRs: '',
      LRNumber: '',
      LoadingPoints: '',
      UnLoadingPoints: ''
    }, { emitEvent: false });

    // ✅ DELETE ALL OTHER ROWS
    while (this.rows.length > 1) {
      this.rows.removeAt(1);
    }
    this.showActionColumn = false;
    this.cd.detectChanges();
  }

  // ✅ ADD NEW ROW
  addRow() {
    this.rows.push(this.createRow(false));
    const firstType = this.rows.at(0).get('VehicleType')?.value;

    this.showActionColumn = (firstType === 'Full Truck Load');
    if (firstType) {
      this.applyVehicleTypeToAll(firstType);
    }
     this.cd.detectChanges();
  }

  // ✅ REMOVE ROW
  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
       this.cd.detectChanges();
    }
  }

  // ✅ SAVE
 save(action: 'stay' | 'next' | 'previous' = 'stay') {
  this.spinner.show();

  if (!this.dispatchForm.valid) {
    this.spinner.hide();
    this.dispatchForm.markAllAsTouched();
    return;
  }

  const payload = {
    DISPATCH: this.rows.controls.map((row: any) => ({
      NO_TRUCKS: row.get('NoOfTrucks')?.value,
      veh_type: row.get('VehicleType')?.value,
      work_order: row.get('workorder')?.value,
      transporter: row.get('Transporter')?.value,
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
      text: 'Please select SAP Type (With SAP / Without SAP)',
      icon: 'warning'
    });
    return;
  }

  request$.subscribe(
    (res: any) => {
      this.spinner.hide();

      if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
        Swal.fire({
          text: res.MSG,
          icon: 'success',
          confirmButtonText: 'Ok'
        }).then(() => {
          if (action === 'next') {
            this.router.navigate(['/order-info']);  // ✅ go to next
          } else if (action === 'previous') {
            this.router.navigate(['dashboard']);  // ✅ go to previous
          } else {
            this.resetAll();  // ✅ stay on same screen
          }
        });
      } else {
        Swal.fire({
          text: res.MSG || 'Dispatch saving failed!',
          icon: 'error'
        });
      }
    },
    err => {
      this.spinner.hide();
      Swal.fire({
        text: err?.error?.MSG || 'Failed to save Dispatch!',
        icon: 'error',
        timer: 3000
      });
    }
  );
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
