import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface ProductionPlan {
  segment: string;
  customerprofile: string;
  branch: string;
  branchzone: string;
  tat: string;
  eta: string;
  actualloadintons: string;
  actualvolumeoccupied: string;
  shipmentvolume: string;
  loadingfactorwrtweight: string;
  loadingfactorwrtvolume: string;
  weekwiseshipmentflow: string;
}

@Component({
  selector: 'app-segment-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './segment-info.component.html',
  styleUrl: './segment-info.component.css'
})
export class SegmentInfoComponent {


  segmentInfo!: FormGroup;
  isEditMode = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.buildForm();
  }

  buildForm() {
    this.segmentInfo = this.fb.group({
      SalesPerson: ['', Validators.required],
      segment: ['', Validators.required],
      customerprofile: ['', Validators.required],
      branch: ['', Validators.required],
      branchzone: ['', Validators.required],
      tat: ['', Validators.required],
      eta: ['', Validators.required],
      actualloadintons: ['', [Validators.required, Validators.min(0)]],
      actualvolumeoccupied: ['', [Validators.required, Validators.min(0)]],
      shipmentvolume: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtweight: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtvolume: ['', [Validators.required, Validators.min(0)]],
      weekwiseshipmentflow: ['', Validators.required],
    });
  }

  // ✅ Save method for Save button
  savePlan() {
    if (this.segmentInfo.valid) {
      this.isSubmitting = true;
      const formData: ProductionPlan = this.segmentInfo.value;
      console.log('Form submitted:', formData);

      // 👉 Replace this with API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);

    } else {
      // Mark all fields as touched so errors display
      Object.keys(this.segmentInfo.controls).forEach(key => {
        this.segmentInfo.get(key)?.markAsTouched();
      });
    }
  }

  // ✅ Reset form after submit/cancel
  resetForm() {
    this.segmentInfo.reset();
    this.isEditMode = false;
  }

  // ✅ Cancel edit
  cancelEdit() {
    this.isEditMode = false;
    this.resetForm();
  }
}

