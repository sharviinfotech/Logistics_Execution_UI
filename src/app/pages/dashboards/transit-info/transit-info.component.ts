import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transit-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-info.component.html',
  styleUrls: ['./transit-info.component.css']
})
export class TransitInfoComponent implements OnInit {
  transitInfo!: FormGroup;

  orderType: string = ''; // Inward / Outward
  sapType: string = '';   // With SAP / Without SAP
  showForm: boolean = false;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  // ✅ Initialize form
  initializeForm(): void {
    this.transitInfo = this.fb.group({
      ponumber: [''],
      invoicenumber: ['', Validators.required],
      physicalarrivedatdestinationdateandtime: [''],
      unloadingdateandtime: [''],
      podscanreceiveddateandtime: [''],
      sit: ['']
    });
  }

  // ✅ Auto update SIT based on fields
  updateSIT(): void {
    const field2 = this.transitInfo.get('unloadingdateandtime')?.value;
    const field3 = this.transitInfo.get('podscanreceiveddateandtime')?.value;

    if (field2 && field3) {
      this.transitInfo.get('sit')?.setValue('Sale');
    } else if (!field2 && field3) {
      this.transitInfo.get('sit')?.setValue('SIT');
    } else {
      this.transitInfo.get('sit')?.setValue('');
    }
  }

  // ✅ Order Type change (Inward/Outward)
  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.transitInfo.reset();
  }

  // ✅ SAP Type change (With / Without SAP)
  onSapTypeChange(): void {
    this.showForm = !!(this.orderType && this.sapType);

    this.transitInfo.patchValue({
      ponumber: '',
      invoicenumber: ''
    });

    if (this.orderType === 'Inward') {
      this.transitInfo.get('ponumber')?.setValidators([Validators.required]);
      this.transitInfo.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.transitInfo.get('invoicenumber')?.setValidators([Validators.required]);
      this.transitInfo.get('ponumber')?.clearValidators();
    }

    this.transitInfo.get('ponumber')?.updateValueAndValidity();
    this.transitInfo.get('invoicenumber')?.updateValueAndValidity();
  }

  // ✅ Format helpers
  private formatDate(date: string): string {
    if (!date) return '';
    return date.split('T')[0];
  }

  private formatDateTime(datetime: string): string {
    if (!datetime) return '';
    return datetime;
  }

  // ✅ SAVE BUTTON CLICK
  saveTransitInfo(): void {
    this.transitInfo.markAllAsTouched();

    if (this.transitInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'Ok',
        timer: 4000
      });
      return;
    }

    const formValue = this.transitInfo.value;

    // prepare record
    const record = {
      INV_NO: formValue.invoicenumber || '',
      PHY_ARRIVE_DEST: this.formatDate(formValue.physicalarrivedatdestinationdateandtime),
      UNLOADING_DT: this.formatDateTime(formValue.unloadingdateandtime),
      POD_SCAN: this.formatDateTime(formValue.podscanreceiveddateandtime)
    };

    this.spinner.show();

    // ✅ FIXED: Correct condition for SAP / Non-SAP
    if (this.sapType === 'SAP') {
      // --- With SAP ---
      const payload = { SAVE: [record] };

      this.service.TransitInfoSave(payload).subscribe({
        next: (res: any) => {
          console.log('Response (With SAP):', res);
          this.spinner.hide();
          if (res.STATUS == 'true' || res.NUMBER == '200') {
            Swal.fire({
              text: res.MESSAGE || 'Transit Info (SAP) saved successfully!',
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 3000
            }).then(() => this.resetAll());
          } else {
            Swal.fire({
              text: res.MESSAGE || 'Failed to save Transit Info (SAP)!',
              icon: 'error',
              timer: 3000
            });
          }
        },
        error: (err) => {
          console.error('Error (With SAP):', err);
          this.spinner.hide();
          Swal.fire({
            title: 'Error',
            text: `Error: ${err.status} - ${err.statusText}`,
            icon: 'error',
            timer: 3000
          });
        }
      });
    } else if (this.sapType === 'Non-SAP') {
      // --- Without SAP ---
      const payload = { CREATE: [record] };

      this.service.TransitInfoNonSap(payload).subscribe({
        next: (res: any) => {
          console.log('Response (Without SAP):', res);
          this.spinner.hide();
          if (res.STATUS == 'true' || res.NUMBER == '200') {
            Swal.fire({
              text: res.MESSAGE || 'Transit Info (Non-SAP) saved successfully!',
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 3000
            }).then(() => this.resetAll());
          } else {
            Swal.fire({
              text: res.MESSAGE || 'Failed to save Transit Info (Non-SAP)!',
              icon: 'error',
              timer: 3000
            });
          }
        },
        error: (err) => {
          console.error('Error (Without SAP):', err);
          this.spinner.hide();
          Swal.fire({
            title: 'Error',
            text: `Error: ${err.status} - ${err.statusText}`,
            icon: 'error',
            timer: 3000
          });
        }
      });
    } else {
      this.spinner.hide();
      Swal.fire({
        title: 'Missing Selection',
        text: 'Please select SAP Type before saving.',
        icon: 'warning',
        timer: 3000
      });
    }
  }

  // ✅ Reset helper
  resetAll(): void {
    this.transitInfo.reset();
    this.showForm = false;
    this.orderType = '';
    this.sapType = '';
  }
}
