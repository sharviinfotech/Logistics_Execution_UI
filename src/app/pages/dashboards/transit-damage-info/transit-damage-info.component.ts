import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-transit-damage-info',
   standalone: true,
 imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transit-damage-info.component.html',
  styleUrl: './transit-damage-info.component.css'
})
export class TransitDamageInfoComponent {
 
transitDamageInfo!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
 
  damageRemarksOptions = [
    'Packing material damage',
    'Pallet damage',
    'Cells damage',
    'Cell Bank damage',
    'Can damage',
    'Accident',
    'Prohibited material loading and seized by Police',
    'Damage during unloading',
    'Material in wet condition',
    'Damage due to other Materials loaded'
  ];
 
  claimSettlementOptions = [
    'Direct Deduction',
    'Insurance claim',
    'Repair Locally With cost',
    'Repair Locally Without cost',
 
  ];
 
  constructor(private fb: FormBuilder) {
    this.buildForm();
    this.setupStatusWatcher();
  }
 
  private buildForm() {
    this.transitDamageInfo = this.fb.group({
      incidentdate: ['', Validators.required],
      lrnumber: ['', Validators.required],
      transportername: ['', Validators.required],
      vechilenumber: ['', Validators.required,Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)],
      fsrreportdate: ['', Validators.required],
      imagesuploading: ['', Validators.required],
      customer: ['', Validators.required],
      nee: ['', Validators.required],
      invoicenumber: ['', Validators.required],
      invoicedate: ['', Validators.required],
      shipmentvalue: ['', Validators.required],
      DamageRemarks: ['', Validators.required],
      claimsettlement: ['', Validators.required],
      status: ['', Validators.required],
      closingdamagedate: ['']
    });
  }
 
 private setupStatusWatcher() {
  this.transitDamageInfo.get('status')?.valueChanges.subscribe(status => {
    const closingDateControl = this.transitDamageInfo.get('closingdamagedate');
    if (status === 'close') {
      closingDateControl?.setValidators([Validators.required]);
    } else {
      closingDateControl?.clearValidators();
      closingDateControl?.setValue(null); // Reset value when not required
    }
    closingDateControl?.updateValueAndValidity();
  });
}
 
  savePlan() {
    if (this.transitDamageInfo.valid) {
      this.isSubmitting = true;
      console.log('Form submitted:', this.transitDamageInfo.value);
      setTimeout(() => {
        this.isSubmitting = false;
        this.transitDamageInfo.reset();
        this.isEditMode = false;
      }, 1000);
    } else {
      Object.values(this.transitDamageInfo.controls).forEach(control => control.markAsTouched());
    }
  }
 
  cancelEdit() {
    this.isEditMode = false;
    this.transitDamageInfo.reset();
  }
}