import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface TransitInfo {
  physicalarrivedatdestinationdateandtime: string;
  unloadingdateandtime: string;
  sit: number;
  podscanreceiveddateandtime: string;
}

@Component({
  selector: 'app-transit-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transit-info.component.html',
  styleUrl: './transit-info.component.css'
})
export class TransitInfoComponent {

 transitInfo!: FormGroup;
  isEditMode = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.buildForm();
  }

  buildForm() {
    this.transitInfo = this.fb.group({
      physicalarrivedatdestinationdateandtime: ['', Validators.required],
      unloadingdateandtime: ['', Validators.required],
      sit: ['', [Validators.required, Validators.min(0)]],
      podscanreceiveddateandtime: ['', Validators.required],
    });
  }

  // ✅ Save form
  savePlan() {
    if (this.transitInfo.valid) {
      this.isSubmitting = true;
      const formData: TransitInfo = this.transitInfo.value;
      console.log('Form submitted:', formData);

      // 👉 Replace with API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);

    } else {
      // Mark all fields as touched so validation errors display
      Object.keys(this.transitInfo.controls).forEach(key => {
        this.transitInfo.get(key)?.markAsTouched();
      });
    }
  }

  // ✅ Reset form
  resetForm() {
    this.transitInfo.reset();
    this.isEditMode = false;
  }

  // ✅ Cancel edit
  cancelEdit() {
    this.isEditMode = false;
    this.resetForm();
  }
}

