import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';


@Component({
  selector: 'app-service-level',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './service-level.component.html',
  styleUrls: ['./service-level.component.css']
})
export class ServiceLevelComponent implements OnInit {

  orderType: string = '';
  sapType: string = '';

  pendingCount = 5;
  completedCount = 10;

  invoicenumber: string = '';
  truckType: string = '';

  OrderInfo!: FormGroup;
  showFeedback: boolean = false;

  selectedItems: number[] = [];
  feedback = {
    onTimePlacement: '',
    transhipment: '',
    delivery: '',
    damage: '',
    accident: '',
    pod: '',
    freight: '',
    overall: ''
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createRow()])
    });
  }

  get items(): FormArray {
    return this.OrderInfo.get('items') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addRow() {
    this.items.push(this.createRow());
  }

  removeRow(index: number) {
    this.items.removeAt(index);
  }

  onCheckboxChange(event: any, index: number) {
    if (event.target.checked) {
      this.selectedItems.push(index);
    } else {
      this.selectedItems = this.selectedItems.filter(i => i !== index);
    }
  }

  isItemSelected(index: number): boolean {
    return this.selectedItems.includes(index);
  }

  onOrderTypeChange() {

    console.log('Order Type:', this.orderType);

    this.sapType = '';
    this.invoicenumber = '';

    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createRow()])
    });

  }

  onSapTypeChange() {
    console.log('SAP Type:', this.sapType);

    this.truckType = '';
    this.invoicenumber = '';
    this.showFeedback = false;
  }
  onTruckTypeChange() {
    this.showFeedback = false;
  }

  refreshScreen() {
    this.orderType = 'Outward';
    this.sapType = 'SAP';
    this.invoicenumber = '';
    this.pendingCount = 5;
    this.completedCount = 10;

    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createRow()])
    });

    this.selectedItems = [];

    console.log('Screen Refreshed');
  }

  onInputChange(type: string) {
    console.log('Input changed:', type);
  }

  getForm(type: string) {

    console.log('GET clicked for:', type);
    console.log('Invoice No:', this.invoicenumber);
    console.log('Truck Type:', this.truckType);

    if (
      type === 'invoice' &&
      this.invoicenumber.trim() !== '' &&
      this.truckType !== ''
    ) {
      this.showFeedback = true;
    } else {
      this.showFeedback = false;
      alert('Please select Full Truck Load or Cargo and enter Invoice Number');
    }

  }


}
