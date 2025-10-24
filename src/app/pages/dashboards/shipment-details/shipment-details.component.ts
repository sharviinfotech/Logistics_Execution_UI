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
  batteryConditionOptions = ['Dry and discharge with solid electrolyte', 'Dry and discharge with Liquid electrolyte', 'Filled and discharges', 'Filled and charges', 'Filled and formed no free Acid', 'Lead acid batteries (Dry)', 'Lead acid batteries (Filled)'];
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

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.ProductInfo = this.fb.group({
      items: this.fb.array([])
    });
    this.addRow();
    this.fetchTypeofmaterial();
    this.fetchIncoterms(); // ✅ Fetch Incoterms on init
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

  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  // SAP type change (enhanced behavior like OrderInfo)
  onSapTypeSelection() {
    // Reset visibility and conditional fields when switching sap type
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    if (this.sapType === 'SAP') {
      // For SAP: require user to enter PO/Invoice and click GET
      this.showForm = false;
      // clear any local ref numbers
      this.ponumber = '';
      this.invoicenumber = '';
    } else {
      // For Non-SAP: show form directly
      this.showForm = true;
    }
  }

  // When Order Type changes, clear SAP selection and reset conditional fields
  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  // Reset conditional fields when switching modes
  resetConditionalFields(): void {
    this.showForm = false;
    this.ProductInfo.reset();
    this.items.clear();
    this.addRow();
  }

  // Apply required validators to product item fields
  setValidatorsOnProductFields(): void {
    this.items.controls.forEach((ctrl) => {
      const group = ctrl as FormGroup;
      Object.keys(group.controls).forEach((c) => {
        const control = group.get(c);
        if (control) {
          control.setValidators(Validators.required);
          control.updateValueAndValidity();
        }
      });
    });
  }

  // GET data for Inward or Outward (SAP)
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
              MaterialDescription: [item.MAKTX || ''],
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

    // Prepare the data based on SAP type
    const itemsData = this.items.value.map((item: any, index: number) => {
      const baseData = {
        MANDT: "234",
        VBELN: this.invoicenumber || '',
        POSNR: (index + 1) * 10,
        ZPRODUCT: item.Product || '',
        MTART: item.TypeOfMaterial || '',
        MAKTX: item.MaterialDescription || '',
        ZSETS: parseFloat(item.Noofseats) || 0,
        ZAH: parseFloat(item.AhLoadedInTruck) || 0,
        ZSHIP_WT: parseFloat(item.ShipmentWeight) || 0,
        ZBATCOND: item.BatteryCondition || '',
        ZINCO: item.Incoterms || '',
        ZINS_SCPOE: item.InsuranceScope || 'Supplier',
        ZKM: parseFloat(item.Kilometres) || 0
      };

      // For SAP, include MTBEZ field
      if (this.sapType === 'SAP') {
        return {
          ...baseData,
          MTBEZ: item.MaterialDescription || ''
        };
      }

      return baseData;
    });

    console.log("Final payload for Save:", itemsData);
    this.spinner.show();

    // Choose the appropriate service method based on SAP type
    console.log('SAP Type:', this.sapType);
    console.log('Using endpoint:', this.sapType === 'SAP' ? 'ShipmentOutwardSave' : 'shipmentdetailsNonSapSave');

    // Log the request payload for debugging
    if (this.sapType !== 'SAP') {
      console.log('[DEBUG] Non-SAP Save Payload:', itemsData);
    }

    const saveOperation = this.sapType === 'SAP' 
      ? this.service.ShipmentOutwardSave(itemsData)
      : this.service.shipmentdetailsNonSapSave(itemsData);

    // Log the request being made
    console.log('Making request with payload:', {
      endpoint: this.sapType === 'SAP' ? 'ShipmentOutwardSave' : 'shipmentdetailsNonSapSave',
      data: itemsData
    });

    saveOperation.subscribe({
      next: (res: any) => {
        // Log the response for debugging
        if (this.sapType !== 'SAP') {
          console.log('[DEBUG] Non-SAP Save Response:', res);
        } else {
          console.log('Save Response:', res);
        }

        if (res.NUMBER == "200") {
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
          this.sapType = '';
          this.invoicenumber = '';
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
        console.error("Error details:", {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message
        });
        
        let errorMessage = 'Something went wrong while saving shipment details.';
        if (err.error && err.error.MSG) {
          errorMessage = err.error.MSG;
        } else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.message) {
          errorMessage = err.message;
        }

        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        this.spinner.hide();
      }
    });
  }

  // Fetch Type of Material (GET)
  fetchTypeofmaterial() {
  this.spinner.show();
  this.service.getTypeofmaterial().subscribe({
    next: (res: any) => {
      console.log("Type of Material Response:", res);
      this.TypeofmaterialList = Array.isArray(res) ? res : (res?.data || []);
      this.spinner.hide();
    },
    error: (err) => {
      console.error("Error fetching Type of Material:", err);
      this.spinner.hide();
    }
  });
}


  // ✅ Fetch Incoterms (PUT)
 fetchIncoterms() {
  this.spinner.show();

  const payload = {
    INCO1: "",
    BEZEI: ""
  };

  this.service.Incoterms(payload).subscribe({
    next: (res: any) => {
      console.log("Incoterms Response:", res);
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

  // Fetch Non-SAP Reports
 fetchNonSapReports(): void {
  const payload = { REPORT: "X" };
  this.spinner.show();

  this.service.shipmentdetailsNonSapReports(payload).subscribe({
    next: (res: any) => {
      console.log("Non-SAP Reports Response:", res);
      if (Array.isArray(res)) {
        this.items.clear();
        res.forEach((item: any) => {
          this.items.push(this.fb.group({
            Product: [item.ZPRODUCT || ''],
            TypeOfMaterial: [item.MTART || ''],
            MaterialDescription: [item.MAKTX || ''],
            Noofseats: [item.ZSETS || 0, [Validators.min(1)]],
            AhLoadedInTruck: [item.ZAH || 0, [Validators.min(0)]],
            ShipmentWeight: [item.ZSHIP_WT || 0, [Validators.min(0)]],
            BatteryCondition: [item.ZBATCOND || ''],
            Incoterms: [item.ZINCO || ''],
            InsuranceScope: [item.ZINS_SCPOE || 'Supplier'],
            Kilometres: [item.ZKM || 0]
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
