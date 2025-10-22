import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';

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
  // materialTypeOptions = ['Raw Material', 'Semi Finished', 'Finished Goods', 'Consumables', 'Spare Parts'];
  batteryConditionOptions = ['Dry and discharge with solid electrolyte', 'Dry and discharge with Liquid electrolyte', 'Filled and discharges', 'Filled and charges', 'Filled and formed no free Acid', 'Lead acid batteries (Dry)', 'Lead acid batteries (Filled)'];
  // incotermOptions = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP', 'FCA', 'CPT'];
  insuranceScopeOptions = ['Buyer', 'Supplier'];

  // Form and variables
  ProductInfo!: FormGroup;
  isEditMode = false;
  showForm = false;
  orderType: string = '';     // Inward / Outward
  sapType: string = '';       // SAP / Non-SAP
  ponumber: string = '';      // For Inward SAP
  invoicenumber: string = ''; // For Outward SAP

  constructor(private fb: FormBuilder, private service: GeneralserviceService , private spinner: NgxSpinnerService,public spinnerService: SpinnerService) { }

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
      ShipmentWeight: [null, [Validators.required, Validators.min(0)]],
      BatteryCondition: [''],
      Incoterms: ['', Validators.required],
      InsuranceScope: ['Buyer'],
      Kilometres: [null, [Validators.required, Validators.min(0)]]
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

  const referenceNumber = this.orderType === 'Inward' ? this.ponumber : this.invoicenumber;
  if (!referenceNumber?.trim()) {
    alert(`Please enter a valid ${this.orderType === 'Inward' ? 'PO' : 'Invoice'} Number`);
    return;
  }

  const payload = { INV_GET: referenceNumber.trim() };
  console.log('Fetching SAP Data with payload:', payload);

  this.service.shipmentdetailsfetch(payload).subscribe({
    next: (res: any) => {
      console.log('Raw response from service:', res);
      const result = Array.isArray(res) ? res : (res?.data || []);

      if (result.length > 0) {
        this.items.clear();
        result.forEach((item: any) => {
          this.items.push(this.fb.group({
            Product: [item.ZPRODUCT || ''],
            TypeOfMaterial: [item.MTBEZ || ''],
            MaterialDescription: [item.MAKTX ||  ''],
            Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
            AhLoadedInTruck: [item.ZAH || 0, [Validators.min(0)]],
            ShipmentWeight: [item.ZSHIP_WT || 0, [Validators.min(0)]],
            BatteryCondition: [item.ZBATCOND || ''],
            Incoterms: [item.ZINCO || ''],
            InsuranceScope: [item.ZINS_SCPOE || 'Buyer'],
            Kilometres: [item.ZKM || 0]
          }));
        });
        this.showForm = true;
      } else {
        alert('No data found for this reference.');
      }
    },
    error: (err) => {
      console.error('Error fetching data:', err);
      alert('Error fetching data from SAP.');
    }
  });
}



  // Save data
 saveShipmentOutward(): void {

  this.ProductInfo.markAllAsTouched();

  if (this.ProductInfo.invalid) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill all required fields before saving.',
      icon: 'warning',
      confirmButtonText: 'Ok',
      timer: 4000
    });
    return;
  }

  // Get all items from FormArray
  const itemsData = this.items.value.map((item: any, index: number) => ({
    MANDT: "234",                         // static or from your environment if needed
    VBELN: this.invoicenumber || '',       // Invoice number from parent form
    POSNR: (index + 1) * 10,               // Line number 10, 20, etc.
    ZPRODUCT: item.Product || '',
    MTART: item.TypeOfMaterial || '',
    MTBEZ: item.MaterialDescription || '',
    MAKTX: item.MaterialDescription || '',
    ZSETS: item.Noofseats || 0,
    ZAH: item.AhLoadedInTruck || 0,
    ZSHIP_WT: item.ShipmentWeight || 0,
    ZBATCOND: item.BatteryCondition || '',
    ZINCO: item.Incoterms || '',
    ZINS_SCPOE: item.InsuranceScope || '',
    // ZPIN_PLT: this.plantCode || '',        // Add these if available
    // ZPIN_STP: this.storageLoc || '',
    ZKM: item.Kilometres || 0
  }));

  console.log("Final payload for Save:", itemsData);

  this.spinner.show();

  this.service.ShipmentOutwardSave(itemsData).subscribe({
    next: (res: any) => {
      console.log("Save Response:", res);

      if (res.NUMBER == "200" ) {
        Swal.fire({
          title: '',
          text: res.MSG || 'Record(s) Saved Successfully',
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 4000
        });
        this.ProductInfo.reset();
        this.items.clear();
        this.showForm = false;
      } else {
        Swal.fire({
          title: '',
          text: res.MSG || 'Save Failed',
          icon: 'error',
          confirmButtonText: 'Ok',
          timer: 4000
        });
      }

      this.spinner.hide();
    },
    error: (err) => {
      console.error("Save Error:", err);
      Swal.fire({
        title: 'Error',
        text: 'Something went wrong while saving shipment details.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      this.spinner.hide();
    }
  });
}


}
