import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.css']
})
export class ShipmentDetailsComponent implements OnInit {

  // Dropdown options
  productOptions = ['Batteries', 'Electronics', 'Fuze', 'Cement Poles and Piles', 'Raw Materials', 'Job Work Material', 'Machinery', 'Others'];
  batteryConditionOptions = ['Dry and discharge with solid electrolyte', 'Dry and discharge with Liquid electrolyte', 'Filled and discharged', 'Filled and charged', 'Filled and formed no free Acid', 'Lead acid batteries (Dry)', 'Lead acid batteries (Filled)'];
  insuranceScopeOptions = ['Buyer', 'Supplier'];

  // Form and variables
  ProductInfo!: FormGroup;
  isEditMode = false;
  showForm = false;
  orderType: string = '';     // Inward / Outward
  sapType: string = '';       // SAP / Non-SAP
  ponumber: string = '';      // For Inward SAP
  invoicenumber: string = '';
  TypeofmaterialList: any = [];
  IncotermsList: any[] = [];
  Incoterms: string = '';     // For Outward SAP
  isAllSelected: boolean = false; // For header checkbox

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
       Incoterms: ['', Validators.required],
      InsuranceScope: ['',Validators.required],
      Kilometres: [null, [Validators.required, Validators.min(0)]],
      items: this.fb.array([])
      
    });
    this.addRow();
    this.fetchTypeofmaterial();
    this.fetchIncoterms();
  }

  // Getter for FormArray
  get items(): FormArray {
    return this.ProductInfo.get('items') as FormArray;
  }

  // Create one item row
  createItemRow(): FormGroup {
    return this.fb.group({
      selected: [false], // ✅ added for checkbox support
      Product: ['', Validators.required],
      TypeOfMaterial: ['', Validators.required],
      MaterialDescription: ['', Validators.required],
      Noofseats: [null, [Validators.required, Validators.min(1)]],
      AhLoadedInTruck: [null, [Validators.required, Validators.min(0)]],
      ShipmentWeight: [null, [Validators.required, Validators.min(0)]],
      BatteryCondition: [''],
    });
  }

  // Add / Remove rows
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

  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  onSapTypeSelection() {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    if (this.sapType === 'SAP') {
      this.showForm = false;
      this.ponumber = '';
      this.invoicenumber = '';
    } else {
      this.showForm = true;
    }
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.ProductInfo.reset();
    this.items.clear();
    this.addRow();
  }

  // ✅ Checkbox methods start (work for both SAP & Non-SAP)
  allSelected(): boolean {
    return this.items.controls.length > 0 &&
           this.items.controls.every(ctrl => ctrl.get('selected')?.value === true);
  }

  toggleAllSelection(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    this.items.controls.forEach(ctrl => ctrl.get('selected')?.setValue(isChecked));
  }

  onRowCheckboxChange(): void {
    this.isAllSelected = this.allSelected();
  }

  getSelectedRows() {
    return this.items.controls
      .map(ctrl => ctrl.value)
      .filter(row => row.selected);
  }
  // ✅ Checkbox methods end

  // ✅ Fetch SAP invoice details
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
  this.spinner.show();
  
  this.service.shipmentdetailsfetch(payload).subscribe({
    next: (res: any) => {
      const result = Array.isArray(res) ? res : (res?.data || []);

      if (result.length > 0) {
        const firstItem = result[0];
        
        // ✅ Check if the Incoterm exists in the list
        const incoExists = this.IncotermsList.find(i => i.INCO1 === firstItem.ZINCO);
        console.log("Incoterm from API:", firstItem.ZINCO);
        console.log("Incoterm exists in list:", incoExists);
        console.log("Full IncotermsList:", this.IncotermsList);
        
        this.items.clear();
        
        // ✅ Set the values
        this.ProductInfo.patchValue({
          Incoterms: firstItem.ZINCO || '',
          InsuranceScope: firstItem.ZINS_SCPOE || 'Buyer',
          Kilometres: firstItem.ZKM !== null && firstItem.ZKM !== undefined ? firstItem.ZKM : null
        });
        
        console.log("Form values after patch:", {
          Incoterms: this.ProductInfo.get('Incoterms')?.value,
          InsuranceScope: this.ProductInfo.get('InsuranceScope')?.value,
          Kilometres: this.ProductInfo.get('Kilometres')?.value
        });

        result.forEach((item: any) => {
          this.items.push(this.fb.group({
            selected: [false],
            Product: [item.ZPRODUCT || ''],
            TypeOfMaterial: [item.MTBEZ || ''],
            MaterialDescription: [item.MAKTX || ''],
            Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
            AhLoadedInTruck: [item.ZAH || 0],
            ShipmentWeight: [item.ZSHIP_WT || 0],
            BatteryCondition: [item.ZBATCOND || '']
          }));
        });
        
        this.showForm = true;
        this.spinner.hide();
      } else {
        alert('No data found for this reference.');
        this.spinner.hide();
      }
    },
    error: (err) => {
      console.error('Error fetching data:', err);
      alert('Error fetching data from SAP.');
      this.spinner.hide();
    }
  });
}

  // ✅ Save only selected rows
  saveShipmentOutward(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select at least one row to save.',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    const commonFields = {
      Incoterms: this.ProductInfo.get('Incoterms')?.value,
      InsuranceScope: this.ProductInfo.get('InsuranceScope')?.value,
      Kilometres: this.ProductInfo.get('Kilometres')?.value
    };

    // ✅ Remove 'selected' before sending
    const cleanedRows = selectedRows.map(({ selected, ...rest }) => ({
  ...rest,
  ...commonFields
}));

    console.log("Saving selected rows:", cleanedRows);
    this.spinner.show();

    // ✅ Use cleanedRows for both SAP & Non-SAP
    const saveOperation = this.sapType === 'SAP'
      ? this.service.ShipmentOutwardSave(cleanedRows)
      : this.service.shipmentdetailsNonSapSave(cleanedRows);

    saveOperation.subscribe({
      next: (res: any) => {
        if (res.NUMBER == "200") {
          Swal.fire({
            title: '',
            text: res.MSG || 'Selected rows saved successfully!',
            icon: 'success',
            confirmButtonText: 'Ok',
            timer: 4000
          });
          this.resetForm();
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

  fetchTypeofmaterial() {
    this.spinner.show();
    this.service.getTypeofmaterial().subscribe({
      next: (res: any) => {
        this.TypeofmaterialList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Type of Material:", err);
        this.spinner.hide();
      }
    });
  }

  fetchIncoterms() {
    this.spinner.show();
    const payload = { INCO1: "", BEZEI: "" };
    this.service.Incoterms(payload).subscribe({
      next: (res: any) => {
        this.IncotermsList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Incoterms:", err);
        this.spinner.hide();
      }
    });
  }

  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onTypeOfMaterialChange() {
    console.log('Type of Material changed');
  }

  // ✅ Fetch Non-SAP reports (with checkbox support)
  fetchNonSapReports(): void {
    const payload = { REPORT: "X" };
    this.spinner.show();

    this.service.shipmentdetailsNonSapReports(payload).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.items.clear();
          const firstItem = res[0];
          this.ProductInfo.patchValue({
            Incoterms: firstItem.ZINCO || '',
            InsuranceScope: firstItem.ZINS_SCPOE || '',
            Kilometres: firstItem.ZKM || 0
          });
          res.forEach((item: any) => {
            this.items.push(this.fb.group({
              selected: [false],
              Product: [item.ZPRODUCT || ''],
              TypeOfMaterial: [item.MTART || ''],
              MaterialDescription: [item.MAKTX || ''],
              Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
              AhLoadedInTruck: [item.ZAH || 0],
              ShipmentWeight: [item.ZSHIP_WT || 0],
              BatteryCondition: [item.ZBATCOND || ''],
              
            }));
          });
          this.showForm = true;
        } else {
          Swal.fire({
            title: 'Warning',
            text: 'No report data found',
            icon: 'warning',
            confirmButtonText: 'Ok',
            timer: 4000
          });
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Non-SAP Reports:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch Non-SAP reports',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        this.spinner.hide();
      }
    });
  }
}
