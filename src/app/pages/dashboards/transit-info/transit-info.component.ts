import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

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
  showForm = false;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) { }

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


  // SAP Type change (With / Without SAP)
  onSapTypeChange(): void {
    // 1) Fully reset the form to clear any previous values
    this.transitInfo.reset();

    // 2) Set view flag only when both orderType and sapType are selected
    this.showForm = !!(this.orderType && this.sapType);

    // 3) Reapply validators based on order type
    if (this.orderType === 'Inward') {
      this.transitInfo.get('ponumber')?.setValidators([Validators.required]);
      this.transitInfo.get('invoicenumber')?.clearValidators();
    } else if (this.orderType === 'Outward') {
      this.transitInfo.get('invoicenumber')?.setValidators([Validators.required]);
      this.transitInfo.get('ponumber')?.clearValidators();
    } else {
      // no order selected — clear validators
      this.transitInfo.get('ponumber')?.clearValidators();
      this.transitInfo.get('invoicenumber')?.clearValidators();
    }

    // 4) Update validity so UI errors / touched status are consistent
    this.transitInfo.get('ponumber')?.updateValueAndValidity();
    this.transitInfo.get('invoicenumber')?.updateValueAndValidity();

    // 5) Optional: console log to debug flow
    console.log('onSapTypeChange -> sapType:', this.sapType, ' showForm:', this.showForm);
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
  saveTransitInfo(action: 'stay' | 'next' | 'previous' = 'stay'): void {
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

    const record = {
      INV_NO: formValue.invoicenumber || '',
      PHY_ARRIVE_DEST: this.formatDate(formValue.physicalarrivedatdestinationdateandtime),
      UNLOADING_DT: this.formatDateTime(formValue.unloadingdateandtime),
      POD_SCAN: this.formatDateTime(formValue.podscanreceiveddateandtime)
    };

    this.spinner.show();

    let request$;

    if (this.sapType === 'SAP') {
      request$ = this.service.TransitInfoSave({ SAVE: [record] });
    } else if (this.sapType === 'Non-SAP') {
      request$ = this.service.TransitInfoNonSap({ CREATE: [record] });
    } else {
      this.spinner.hide();
      Swal.fire({
        title: 'Missing Selection',
        text: 'Please select SAP Type before saving.',
        icon: 'warning',
        timer: 3000
      });
      return;
    }

    request$.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.STATUS == 'true' || res.NUMBER == '200') {
          Swal.fire({
            text: res.MESSAGE || 'Transit Info saved successfully!',
            icon: 'success',
            timer: 3000
          }).then(() => {
            if (action === 'next') {
              this.router.navigate(['/freight-billing']);   // ✅ Next screen
            }
            else if (action === 'previous') {
              this.router.navigate(['/vechile-info']);      // ✅ Previous screen
            }
            else {
              this.resetAll();  // ✅ Stay same screen
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
      error: (err) => {
        this.spinner.hide();
        Swal.fire({
          title: 'Error',
          text: `Error: ${err.status} - ${err.statusText}`,
          icon: 'error',
          timer: 3000
        });
      }
    });
  }


  // ✅ Reset helper
  resetAll(): void {
    this.transitInfo.reset();
    this.showForm = false;
    this.orderType = '';
    this.sapType = '';
  }
}
