import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-freight-billing',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './freight-billing.component.html',
  styleUrl: './freight-billing.component.css'
})
export class FreightBillingComponent {

 FreightBilling!: FormGroup;
  isEditMode = false;
  editIndex: number | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.FreightBilling = this.fb.group({
      FreightBillNumber: ['', Validators.required],
      FreightBillDate: ['', Validators.required],
      FreightBillPhysicalSubmissionDate: ['', Validators.required],
      FreightCharges: ['', [Validators.required, Validators.min(0)]],
      WorkOrderNumber: ['', Validators.required]
    });
  }

  // Reset form
  resetForm() {
    this.FreightBilling.reset();
    this.isEditMode = false;
    this.editIndex = null;
  }

  // Save form
  saveFreightBill() {
    if (this.FreightBilling.valid) {
      this.isSubmitting = true;

      // 👉 Your API call or logic here
      console.log('Freight Billing Data:', this.FreightBilling.value);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.FreightBilling.controls).forEach(key => {
        this.FreightBilling.get(key)?.markAsTouched();
      });
    }
  }
}

