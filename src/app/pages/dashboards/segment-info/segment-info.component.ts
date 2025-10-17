import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-segment-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './segment-info.component.html',
  styleUrls: ['./segment-info.component.css']
})
export class SegmentInfoComponent implements OnInit {
  segmentInfo!: FormGroup;
  showForm = false;
  isEditMode = false;
  isSubmitting = false;

  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;

  constructor(private fb: FormBuilder, private service: GeneralserviceService) { }

  ngOnInit(): void {
    this.segmentInfo = this.fb.group({
      INV_VBELN: [''],
      SALES_EMP: ['', Validators.required],
      SEGMENT: [''],
      CUST_PROF: [''],
      BRANCH: [''],
      BRANCH_ZONE: [''],
      TAT_DAYS: [''],
      ETA_DATE: [''],
      actualloadintons: ['', [Validators.required, Validators.min(0)]],
      actualvolumeoccupied: ['', [Validators.required, Validators.min(0)]],
      shipmentvolume: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtweight: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtvolume: ['', [Validators.required, Validators.min(0)]],
      weekwiseshipmentflow: ['', Validators.required]
    });
  }

  onOrderTypeChange() {
    if (this.previousOrderType && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.showForm = false;
      this.segmentInfo.reset();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeChange() {
    this.showForm = this.sapType === 'Non-SAP';
  }

  onInputChange(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.segmentInfo.reset();
    }
  }

  getForm(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') return;

    this.setValidatorsOnFormFields();

    if (this.sapType === 'SAP') {
      this.fetchSAPData(type);
    } else {
      this.showForm = true;
    }
  }

  fetchSAPData(type: 'purchase' | 'invoice') {
    // Choose correct number depending on type
    const obj = type === 'purchase' ? { VBELN: this.ponumber } : { VBELN: this.invoicenumber };

    this.service.SegmentInfoInwardOutward(obj).subscribe({
      next: (res: any) => {
        console.log('SAP API Response:', res); // ✅ Check what API returns
        if (res && res.length > 0) {
          this.patchForm(res[0]);
        } else {
          this.segmentInfo.reset();
          this.showForm = false;
        }
      },
      error: (err) => {
        console.error('SAP API error:', err);
        this.showForm = false;
      }
    });
  }

  patchForm(data: any) {
    this.segmentInfo.patchValue({
      INV_VBELN: data.INV_VBELN || '',
      SALES_EMP: data.SALES_EMP || '',
      SEGMENT: data.SEGMENT || '',
      CUST_PROF: data.CUST_PROF || '',
      BRANCH: data.BRANCH || '',
      BRANCH_ZONE: data.BRANCH_ZONE || '',
      TAT_DAYS: data.TAT_DAYS || '',
      ETA_DATE: data.ETA_DATE || ''
    });
    this.showForm = true;
  }
  saveSegmentInfoWithSAP(): void {
    const requiredFields = ['INV_VBELN', 'SALES_EMP'];
    let missing = requiredFields.filter(f => !this.segmentInfo.get(f)?.value);

    if (missing.length > 0) {
      alert('Please fill required fields: ' + missing.join(', '));
      return;
    }

    const formValue = this.segmentInfo.value;

    const payload = {
      SAVE: [
        {
          INV_VBELN: formValue.INV_VBELN,
          SALES_EMP: formValue.SALES_EMP,
          SEGMENT: formValue.SEGMENT,
          CUST_PROF: formValue.CUST_PROF,
          BRANCH: formValue.BRANCH,
          BRANCH_ZONE: formValue.BRANCH_ZONE,
          TAT_DAYS: formValue.TAT_DAYS,
          ETA_DATE: formValue.ETA_DATE
        }
      ]
    };

    this.isSubmitting = true;

    this.service.SegmentInfoOutwardSave(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.STATUS === 'TRUE') {
          alert(`Saved successfully! Message: ${res.MESSAGE}`);
          this.segmentInfo.reset();
          this.showForm = false;
        } else {
          alert('Failed to save data: ' + res.MESSAGE);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('SAP Save Error:', err);
        alert('Failed to save data due to server error.');
      }
    });
  }



  setValidatorsOnFormFields() {
    Object.keys(this.segmentInfo.controls).forEach(c => {
      this.segmentInfo.get(c)?.setValidators(Validators.required);
      this.segmentInfo.get(c)?.updateValueAndValidity();
    });
  }

  savePlan() {
    if (this.segmentInfo.valid) {
      this.isSubmitting = true;
      console.log('Form Data:', this.segmentInfo.value);
      setTimeout(() => {
        this.isSubmitting = false;
        this.segmentInfo.reset();
        this.showForm = false;
      }, 1000);
    } else {
      Object.keys(this.segmentInfo.controls).forEach(key => {
        this.segmentInfo.get(key)?.markAsTouched();
      });
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.segmentInfo.reset();
    this.showForm = false;
  }
}