import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shipment-details.component.html',
  styleUrl: './shipment-details.component.css'
})
export class ShipmentDetailsComponent {
ProductInfo!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  editIndex: number | null = null;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      Product: ['', Validators.required],
      TypeOfMaterial: ['', Validators.required],
      MaterialDescription: ['', Validators.required],
      Noofseats: ['', Validators.required],
      AhLoadedInTruck: ['', Validators.required],
      ShipmentWeight: ['', Validators.required],
      BatteryCondition: ['', Validators.required],
      Incoterms: ['', Validators.required],
      InsuranceScope: ['', Validators.required],
      Kilometres: ['', Validators.required],
      status: ['Active', Validators.required]
    });
  }

  // This method will be called by your save button
  saveProduct() {
    if (this.ProductInfo.valid) {
      this.isSubmitting = true;
      
      // Your save logic here
      console.log('Product Data:', this.ProductInfo.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.ProductInfo.controls).forEach(key => {
        this.ProductInfo.get(key)?.markAsTouched();
      });
    }
  }

  // Cancel edit mode
  // cancelEdit() {
  //   this.isEditMode = false;
  //   this.editIndex = null;
  //   this.resetForm();
  // }

  // Reset form
  resetForm() {
    this.ProductInfo.reset();
    this.ProductInfo.patchValue({
      status: 'Active'
    });
    this.isEditMode = false;
    this.editIndex = null;
  }
}