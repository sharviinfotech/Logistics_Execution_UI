import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dispatch',
  standalone: true,                     
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css'] 
})
export class DispatchComponent {

  dispatch!: FormGroup;
  isEditMode = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.buildForm();
  }

  private buildForm() {
    this.dispatch = this.fb.group({
      workorder: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      VehicleType: ['', Validators.required],
      NoOfTrucks: ['', [Validators.required, Validators.min(1)]],
      Transporter: ['', Validators.required],
      LoadingPoints: ['', [Validators.required, Validators.min(1)]],
      UnLoadingPoints: ['', [Validators.required, Validators.min(1)]]
    });
  }

  savePlan() {
    if (this.dispatch.valid) {
      this.isSubmitting = true;
      console.log('Form submitted:', this.dispatch.value);

      setTimeout(() => {
        this.isSubmitting = false;
        alert('Dispatch details saved successfully!');
        this.dispatch.reset();
        this.isEditMode = false;
      }, 1000);
    } else {
      Object.values(this.dispatch.controls).forEach((control: any) => control.markAsTouched());
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.dispatch.reset();
  }
}
