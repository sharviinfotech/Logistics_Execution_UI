import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface ProductionPlan {
  typeofshipment: string;
  transporter: string;
  Lrno: number;
 typeofvechile : number;
  passingweight: string;
  volumeofthetruck: string;
 vechilenumber: string;
  noofvechiles: string;
 drivername: string;
 drivermobilenumber: string;
transparentgroup: string;

}

@Component({
  selector: 'app-vechile-info',
    standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vechile-info.component.html',
  styleUrl: './vechile-info.component.css'
})
export class VechileInfoComponent {

Vechileinfo!: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    const today = new Date().toISOString().substring(0, 10);
    this.Vechileinfo = this.fb.group({
      typeofshipment: ['', Validators.required],
      transporter: ['', Validators.required],
      Lrno: ['', Validators.required],
      typeofvechile : ['', Validators.required],
      passingweight: ['', Validators.required],
    volumeofthetruck: ['', Validators.required],
      vechilenumber: ['', Validators.required],
      noofvechiles: ['', Validators.required],
      drivername: ['', Validators.required],
     drivermobilenumber: ['', Validators.required],
      transparentgroup: ['', Validators.required],
     
    });
  }

  savePlan() {
  if (this.Vechileinfo.valid) {
    console.log('Plan submitted:', this.Vechileinfo.value);
    // Add your API call or logic here
  } else {
    // Show validation errors
    Object.keys(this.Vechileinfo.controls).forEach(key => {
      this.Vechileinfo.get(key)?.markAsTouched();
    });
  }
}

}

