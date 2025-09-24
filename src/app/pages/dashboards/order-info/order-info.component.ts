import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-order-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-info.component.html',
  styleUrls: ['./order-info.component.css']
})
export class OrderInfoComponent implements OnInit {
  OrderInfo!: FormGroup;
  showForm = false;
  isEditMode = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      // Controls for the initial two steps
      OrderType: ['', Validators.required],
      SAPType: ['', Validators.required],

      // Full form fields (initially without validators)
      TaxInvoice: [''],
      ODN: [''],
      InvoiceData: [''],
      BasicShipment: [''],
      InvoiceWithGst: [''],
      FinanceYear: [''],
      SystemGeneratedDate: [''],
      FiscalYear: [''],
      FiscalQuarter: [''],
      Month: [''],
      BillingTransactionType: [''],
      Plant: [''],
      TransactionType: [''],
      Division: [''],
      SubDivision: [''],
      RefNumber: [''],
      Customer: [''],
      CustomerGroup: [''],
      CNee: [''],
      DestinationLocation: [''],
      DestinationState: [''],
      DestinationZone: [''],
      status: ['']
    });

    // When the OrderType changes, reset the SAPType and hide the full form.
    this.OrderInfo.get('OrderType')?.valueChanges.pipe(
      tap(() => {
        this.OrderInfo.get('SAPType')?.reset();
        this.showForm = false;
        this.clearValidatorsOnFormFields();
      })
    ).subscribe();

    // When the SAPType changes, hide the full form.
    this.OrderInfo.get('SAPType')?.valueChanges.pipe(
      tap(() => {
        this.showForm = false;
      })
    ).subscribe();
  }

  // This method is called when the "GET" button is clicked.
  getPurchaseOrder() {
    this.showForm = true;
    this.setValidatorsOnFormFields();
  }

  // Resets the entire form and its state.
  resetForm() {
    this.OrderInfo.reset();
    this.showForm = false;
    this.isEditMode = false;
    this.clearValidatorsOnFormFields();
  }

  // Sets required validators on the main form fields.
  private setValidatorsOnFormFields() {
    const controls = ['TaxInvoice', 'ODN', 'InvoiceData', 'BasicShipment', 'InvoiceWithGst', 'FinanceYear', 'SystemGeneratedDate', 'FiscalYear', 'FiscalQuarter', 'Month', 'BillingTransactionType', 'Plant', 'TransactionType', 'Division', 'SubDivision', 'RefNumber', 'Customer', 'CustomerGroup', 'CNee', 'DestinationLocation', 'DestinationState', 'DestinationZone', 'status'];
    controls.forEach(controlName => {
      this.OrderInfo.get(controlName)?.setValidators(Validators.required);
      this.OrderInfo.get(controlName)?.updateValueAndValidity();
    });
  }

  // Clears the validators from all form fields.
  private clearValidatorsOnFormFields() {
    const controls = ['TaxInvoice', 'ODN', 'InvoiceData', 'BasicShipment', 'InvoiceWithGst', 'FinanceYear', 'SystemGeneratedDate', 'FiscalYear', 'FiscalQuarter', 'Month', 'BillingTransactionType', 'Plant', 'TransactionType', 'Division', 'SubDivision', 'RefNumber', 'Customer', 'CustomerGroup', 'CNee', 'DestinationLocation', 'DestinationState', 'DestinationZone', 'status'];
    controls.forEach(controlName => {
      this.OrderInfo.get(controlName)?.clearValidators();
      this.OrderInfo.get(controlName)?.updateValueAndValidity();
    });
  }

  // Handles the form submission.
  savePlan() {
    if (this.OrderInfo.valid) {
      console.log('Order Info Data:', this.OrderInfo.value);
      this.resetForm();
    } else {
      Object.keys(this.OrderInfo.controls).forEach(key => {
        this.OrderInfo.get(key)?.markAsTouched();
      });
      console.log('Form is invalid. Please fill out all required fields.');
    }
  }

  // Cancels edit mode and resets the form.
  cancelEdit() {
    this.resetForm();
  }
}