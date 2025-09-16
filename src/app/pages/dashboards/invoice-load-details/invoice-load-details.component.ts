import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
interface InvoiceLoadDetails {
  gstinvoicenumber: string;
  odnnumber: string;
  invoicedate: string;
  basicshipmentvalue: number;
  invoicevaluewithgst: number;
  physicaldispatchdateandtime: string;
  actualloadintons: number;
  actualvolumeoccupied: number;
  shipmentvolume: number;
  loadingfactorwrtweight: number;
  loadingfactorwrtvolume: number;
  weekwiseshipmentflow: string;
}

@Component({
  selector: 'app-invoice-load-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-load-details.component.html',
  styleUrl: './invoice-load-details.component.css'
})
export class InvoiceLoadDetailsComponent {
invoiceLoadDetails!: FormGroup;
  isEditMode = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.buildForm();
  }

  buildForm() {
    this.invoiceLoadDetails = this.fb.group({
      gstinvoicenumber: ['', Validators.required],
      odnnumber: ['', Validators.required],
      invoicedate: ['', Validators.required],
      basicshipmentvalue: ['', [Validators.required, Validators.min(0)]],
      invoicevaluewithgst: ['', [Validators.required, Validators.min(0)]],
      physicaldispatchdateandtime: ['', Validators.required],
      actualloadintons: ['', [Validators.required, Validators.min(0)]],
      actualvolumeoccupied: ['', [Validators.required, Validators.min(0)]],
      shipmentvolume: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtweight: ['', [Validators.required, Validators.min(0)]],
      loadingfactorwrtvolume: ['', [Validators.required, Validators.min(0)]],
      weekwiseshipmentflow: ['', Validators.required],
    });
  }

  // Save method
  savePlan() {
    if (this.invoiceLoadDetails.valid) {
      this.isSubmitting = true;

      console.log('Form submitted:', this.invoiceLoadDetails.value);
      // 👉 Call API or service here

      // Simulate API call delay
      setTimeout(() => {
        this.isSubmitting = false;
        this.resetForm();
      }, 1000);

    } else {
      // Mark all fields as touched to show validation errors in UI
      Object.keys(this.invoiceLoadDetails.controls).forEach(key => {
        this.invoiceLoadDetails.get(key)?.markAsTouched();
      });
    }
  }

  // Reset form
  resetForm() {
    this.invoiceLoadDetails.reset();
    this.isEditMode = false;
  }

  // Cancel edit
  cancelEdit() {
    this.isEditMode = false;
    this.resetForm();
  }
}

