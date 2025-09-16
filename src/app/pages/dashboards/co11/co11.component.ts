import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ProductionPlan {
  Confirmation: string;
  Material: string;
  MatDescr: string;                   // Material Description
  Order: string;
  Operation: string;
  Suboperation: string;
  Split: string;
  Plant: string;
  ClearOpenReservations: string;
  Sequence: string;                  // Sequence
  Yield: number;
  Scrap: number;
  Rework: number;
  ReasonForVariance: string;
}

@Component({
  selector: 'app-co11',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './co11.component.html',
  styleUrls: ['./co11.component.css']
})
export class Co11Component {
  plans: ProductionPlan[] = [];
  isEditMode = false;
  editIndex: number | null = null;
  planForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    // Initialize the reactive form with all fields, matching the interface
    this.planForm = this.fb.group({
      Confirmation: ['', Validators.required],
      Material: ['', Validators.required],
      MatDescr: ['', Validators.required],
      Order: ['', Validators.required],
      Operation: ['', Validators.required],
      Suboperation: ['', Validators.required],
      Split: ['', Validators.required],
      Plant: ['', Validators.required],
      ClearOpenReservations: [''],
      Sequence: ['', Validators.required],
      Yield: [null, Validators.required],
      Scrap: [null],
      Rework: [null],
      ReasonForVariance: ['']
    });
  }

  editPlan(index: number) {
    this.isEditMode = true;
    this.editIndex = index;
    const plan = this.plans[index];
    this.planForm.setValue({ ...plan });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  savePlan() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const plan: ProductionPlan = this.planForm.value;

    if (this.isEditMode && this.editIndex !== null) {
      this.plans[this.editIndex] = { ...plan };
      this.isEditMode = false;
      this.editIndex = null;
    } else {
      this.plans.push({ ...plan });
    }

    this.planForm.reset();
    this.createForm(); // Reset form and reinitialize validators
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editIndex = null;
    this.planForm.reset();
    this.createForm();
  }

  deletePlan(index: number) {
    if (this.editIndex === index) {
      this.cancelEdit();
    } else if (this.editIndex !== null && this.editIndex > index) {
      this.editIndex--;
    }
    this.plans.splice(index, 1);
  }
}
