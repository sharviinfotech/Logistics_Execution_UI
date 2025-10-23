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

  initializeForm(): void {
  this.transitInfo = this.fb.group({
    ponumber: [''], // optional
    invoicenumber: ['', Validators.required], 
    physicalarrivedatdestinationdateandtime: [''], 
    unloadingdateandtime: [''], // optional
    podscanreceiveddateandtime: [''], // optional
    sit: [''] // optional
  });
}


  // 🔹 Auto-fill SIT based on field selections
 

  updateSIT(): void {
    const field1 = this.transitInfo.get('physicalarrivedatdestinationdateandtime')?.value;
    const field2 = this.transitInfo.get('unloadingdateandtime')?.value;
    const field3 = this.transitInfo.get('podscanreceiveddateandtime')?.value;

    if (field2 && field3) {
      this.transitInfo.get('sit')?.setValue('Sale');
    } 
     else if (field2 || field3) {
      this.transitInfo.get('sit')?.setValue('Sale');
      
    } 
      
    else {
       
        this.transitInfo.get('sit')?.setValue('');
       
    }
  }

  // 🔹 Order type change (Inward / Outward)
  onOrderTypeChange(): void {
    this.sapType = '';
    this.showForm = false;
    this.transitInfo.reset();
  }

  // 🔹 SAP type change (With SAP / Without SAP)
  onSapTypeChange(): void {
    this.showForm = !!(this.orderType && this.sapType);
    this.transitInfo.patchValue({ ponumber: '', invoicenumber: '' });

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

  // 🔹 Save button handler
  saveTransitInfo(): void {
    this.transitInfo.markAllAsTouched();

    if (this.transitInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'OK',
        timer: 4000
      });
      return;
    }

    if (this.sapType === 'Without SAP') {
      this.saveNonSap();
    } else {
      this.saveWithSap();
    }
  }

  private saveWithSap(): void {
    const formValue = this.transitInfo.value;
    const record = {
      PO_NUMBER: formValue.ponumber || '',
      INV_NO: formValue.invoicenumber || '',
      PHY_ARRIVE_DEST: formValue.physicalarrivedatdestinationdateandtime,
      UNLOADING_DT: formValue.unloadingdateandtime,
      POD_SCAN: formValue.podscanreceiveddateandtime,
      SIT: formValue.sit
    };
    const payload = { SAVE: [record] };

    this.spinner.show();
    this.service.TransitInfoSave(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('With SAP Response:', res);
        this.handleResponse(res);
      },
      error: (err) => {
        this.spinner.hide();
        console.error('With SAP Error:', err);
        Swal.fire('Server Error', 'Unable to save data. Please try again later.', 'error');
      }
    });
  }

  private saveNonSap(): void {
    const formValue = this.transitInfo.value;
    const record = {
      INV_NO: formValue.invoicenumber,
      PHY_ARRIVE_DEST: formValue.physicalarrivedatdestinationdateandtime,
      UNLOADING_DT: formValue.unloadingdateandtime,
      POD_SCAN: formValue.podscanreceiveddateandtime
    };
    const payload = { CREATE: [record] };

    console.log('Sending CREATE Payload:', payload);

    this.spinner.show();
    this.service.TransitInfoNonSap(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('Without SAP Response:', res);
        this.handleResponse(res);
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Without SAP Error:', err);
        Swal.fire('Server Error', 'Unable to save data. Please try again later.', 'error');
      }
    });
  }

  private handleResponse(res: any): void {
    if (res.STATUS === 'TRUE' || res.NUMBER === '200') {
      Swal.fire({
        text: res.MESSAGE || 'Data saved successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
        timer: 3000
      }).then(() => this.resetForm());
    } else {
      Swal.fire('Error', res.MESSAGE || 'Something went wrong!', 'error');
    }
  }

  private resetForm(): void {
    this.transitInfo.reset();
    this.showForm = false;
    this.orderType = '';
    this.sapType = '';
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.resetForm();
  }
}
