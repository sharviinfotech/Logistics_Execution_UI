import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.css']
})
export class ShipmentDetailsComponent implements OnInit {

  // Dropdown options
  productOptions = ['Batteries', 'Electronics', 'Fuze', 'Cement Poles and Piles', 'Raw Materials', 'Job Work Material', 'Machinery', 'Others'];
  materialTypeOptions = ['Raw Material', 'Semi Finished', 'Finished Goods', 'Consumables', 'Spare Parts'];
  batteryConditionOptions = ['DRY & DISCHARGED', 'DRY & DISCHARGE', 'FILLED & DISCHARGED', 'FILLED & CHARGE', 'FILLED & FORMED NO FREE ACID', 'LEAD ACID BATTERIES(DRY)', 'LEAD ACID BATTERIES(Filled)'];
  incotermOptions = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP', 'FCA', 'CPT'];
  insuranceScopeOptions = ['Buyer', 'Supplier'];

  // Form and variables
  ProductInfo!: FormGroup;
  isEditMode = false;
  showForm = false;
  orderType: string = '';     // Inward / Outward
  sapType: string = '';       // SAP / Non-SAP
  ponumber: string = '';      // For Inward SAP
  invoicenumber: string = ''; // For Outward SAP

  constructor(private fb: FormBuilder, private service: GeneralserviceService) { }

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      items: this.fb.array([])
    });
    this.addRow();
  }

  // Getter for FormArray
  get items(): FormArray {
    return this.ProductInfo.get('items') as FormArray;
  }

  // Create one item row
  createItemRow(): FormGroup {
    return this.fb.group({
      Product: ['', Validators.required],
      TypeOfMaterial: ['', Validators.required],
      MaterialDescription: ['', Validators.required],
      Noofseats: [null, [Validators.required, Validators.min(1)]],
      AhLoadedInTruck: [null, [Validators.required, Validators.min(0)]],
      ShipmentWeight: [null, [Validators.required, Validators.min(0.01)]],
      BatteryCondition: [''],
      Incoterms: ['', Validators.required],
      InsuranceScope: ['Buyer'],
      Kilometres: [null, Validators.required]
    });
  }

  // Add/Remove rows
  addRow() {
    this.items.push(this.createItemRow());
  }

  removeRow(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      alert('Cannot delete the last row.');
    }
  }

  // Reset form
  resetForm() {
    this.ProductInfo.reset();
    this.items.clear();
    this.addRow();
    this.showForm = false;
    this.ponumber = '';
    this.invoicenumber = '';
    this.sapType = '';
    this.orderType = '';
  }

  // SAP type change
  onSapTypeSelection() {
    if (this.sapType === 'Non-SAP') {
      this.showForm = true; // show directly
    } else {
      this.showForm = false;
      this.ponumber = '';
      this.invoicenumber = '';
    }
  }

  // GET data for Inward or Outward
  fetchInvoiceDetails() {
    if (this.sapType !== 'SAP') {
      alert('Please select "With SAP" first.');
      return;
    }

    const referenceNumber =
      this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;

    if (!referenceNumber || referenceNumber.trim() === '') {
      alert(`Please enter a valid ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} Number`);
      return;
    }

    const payload = {
      INV_GET: referenceNumber
    };

    console.log('Fetching SAP Data with payload:', payload);

    this.service.shipmentdetailsfetch(payload).subscribe({
      next: (res: any) => {
        console.log('GET Response:', res);
        if (res && Array.isArray(res) && res.length > 0) {
          this.items.clear();
          res.forEach((item: any) => {
            this.items.push(this.fb.group({
              Product: [item.ZPRODUCT],
              TypeOfMaterial: [item.MTART],
              MaterialDescription: [item.MTBEZ],
              Noofseats: [item.ZSETS, [Validators.min(1)]],
              AhLoadedInTruck: [item.ZAH, [Validators.min(0)]],
              ShipmentWeight: [item.ZSHIP_WT, [Validators.min(0.01)]],
              BatteryCondition: [item.ZBATCOND],
              Incoterms: [item.ZINCO],
              InsuranceScope: [item.ZINS_SCPOE || 'Buyer'],
              Kilometres: [item.ZKM]

            }));
          });
          this.showForm = true;
        } else {
          alert('No data found for this reference.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error fetching data.');
      }
    });
  }

  // Save data
  saveInvoice() {
    if (!this.ProductInfo.valid) {
      this.ProductInfo.markAllAsTouched();
      alert('Please fill all required fields.');
      return;
    }

    const payload = this.items.value.map((item: any) => ({
      ZPRODUCT: item.Product,
      MTART: item.TypeOfMaterial,
      MTBEZ: item.MaterialDescription,
      ZSETS: item.Noofseats,
      ZAH: item.AhLoadedInTruck,
      ZSHIP_WT: item.ShipmentWeight,
      ZBATCOND: item.BatteryCondition,
      ZINCO: item.Incoterms,
      ZINS_SCPOE: item.InsuranceScope,
      ZKM: item.Kilometres
    }));

    console.log('Saving payload:', payload);

    this.service.ShipmentOutwardSave(payload).subscribe({
      next: (res: any) => {
        console.log('Save Response:', res);
        if (res.NUMBER === '200' || res.status === 'success') {
          alert(res.MSG || 'Shipment saved successfully!');
          this.resetForm();
        } else {
          alert(res.MSG || 'Failed to save data.');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error saving data.');
      }
    });
  }
}
