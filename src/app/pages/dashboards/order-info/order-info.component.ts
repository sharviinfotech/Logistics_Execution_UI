import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-info',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-info.component.html',
  styleUrl: './order-info.component.css'
})
export class OrderInfoComponent {
 OrderInfo!: FormGroup;
  isEditMode = false;
  editIndex: number | null = null;
  isSubmitting = false; // Added property

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.OrderInfo = this.fb.group({
      FinanceYear: ['', Validators.required],
      SystemGeneratedDate: ['', Validators.required],
      MonthQuarter: ['', Validators.required],
      Plant: ['', Validators.required], 
      TransactionType: ['', Validators.required],
      Division: ['', Validators.required],
      SubDivision: ['', Validators.required],
      RefNumber: ['', Validators.required],
      Customer: ['', Validators.required],
      CustomerGroup: ['', Validators.required],
      CNee: ['', Validators.required],
      DestinationLocation: ['', Validators.required],
      DestinationState: ['', Validators.required],
      DestinationZone: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  // Reset form method
  resetForm() {
    this.OrderInfo.reset();
    this.isEditMode = false;
    this.editIndex = null;
  }

  // Save plan method
  savePlan() {
    if (this.OrderInfo.valid) {
      this.isSubmitting = true;

      // Your save logic here
      console.log('Product Data:', this.OrderInfo.value);

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.OrderInfo.controls).forEach(key => {
        this.OrderInfo.get(key)?.markAsTouched();
      });
    }
  }
}
