import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { SharedModule } from '../saas/shared/shared.module';

@Component({
  selector: 'app-order-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './order-info.component.html',
  styleUrls: ['./order-info.component.css']
})
export class OrderInfoComponent implements OnInit {
  OrderInfo!: FormGroup;
  showForm = false;
  isEditMode = false;

  orderType: string = '';
  sapType: string = '';
  isProcessing: boolean = false;
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  plantList: any;
  divisionList: any;
  billintypeList: any;
  statesList: any;
  custList: any;
  customerGroup: string = '';
  showFiscalFields: boolean = false; // Add this at the top with other variables

  initialFormValues: any = {};

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService
  ) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      TaxInvoice: [''],
      DCReference: [''],
      InvoiceeDate: [''], 
      ReferenceDate: [''],
      ODN: [''],
      InvoiceDate: [''],
      BasicShipment: [''],
      InvoiceWithGst: [''],
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
      PhysicalDispatchDateTime: [''],
      
    });
    this.initialFormValues = this.OrderInfo.value;
    // this.setupDestinationZoneListener();
    this.setupPhysicalDispatch();
  }

  // Helper to check SAP mode
  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  toggleOrderType() {
  
  this.OrderInfo.reset(this.initialFormValues);
  this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isProcessing = false;
    this.previousOrderType = null;
    this.previousSapType = null;
  
 
}
//   setupDestinationZoneListener(): void {
//   this.OrderInfo.get('DestinationZone')?.valueChanges.subscribe((value) => {
//     if (value && value !== '') {
//       this.OrderInfo.get('DestinationZone')?.disable();
//     } else {
//       this.OrderInfo.get('DestinationZone')?.enable();
//     }
//     this.OrderInfo.get('DestinationZone')?.updateValueAndValidity();
//   });
// }

 setConditionalValidators(): void {
  console.log('🔧 Setting validators for sapType:', this.sapType);

  // Clear old validators
  Object.keys(this.OrderInfo.controls).forEach(key => {
    this.OrderInfo.get(key)?.clearValidators();
    this.OrderInfo.get(key)?.updateValueAndValidity({ emitEvent: false });
  });

  // Always required fields
  const alwaysRequired = [
    'ODN', 'BasicShipment', 'InvoiceWithGst', 'FiscalQuarter', 'Month',
    'BillingTransactionType', 'Plant', 'TransactionType', 'Division', 'SubDivision',
    'RefNumber', 'Customer', 'CustomerGroup', 'CNee', 'DestinationLocation',
    'DestinationState', 'DestinationZone', 'PhysicalDispatchDateTime'
  ];
  alwaysRequired.forEach(key => {
    this.OrderInfo.get(key)?.setValidators([Validators.required]);
  });

  // ✅ Conditional validation
  if (this.isSap()) {
    this.OrderInfo.get('TaxInvoice')?.setValidators([Validators.required]);
    this.OrderInfo.get('InvoiceeDate')?.setValidators([Validators.required]);
  } else {
    this.OrderInfo.get('DCReference')?.setValidators([Validators.required]);
    this.OrderInfo.get('ReferenceDate')?.setValidators([Validators.required]);
  }

  // Update all
  Object.keys(this.OrderInfo.controls).forEach(key => {
    this.OrderInfo.get(key)?.updateValueAndValidity({ emitEvent: false });
  });

  console.log('✅ Validators set successfully');
}


  onPlantChange(): void {
    const code = this.OrderInfo.get('Plant')?.value;
    console.log("Plant selected:", code);
  }

  onDivisionChange(): void {
    const code = this.OrderInfo.get('Division')?.value;
    console.log("Division selected:", code);
  }

  onBillingTypeChange(): void {
    const code = this.OrderInfo.get('BillingTransactionType')?.value;
    console.log("Billing Type selected:", code);
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
      this.isProcessing = true;
    }
    this.previousOrderType = this.orderType;
  }
 setupPhysicalDispatch(): void {
  this.OrderInfo.get('PhysicalDispatchDateTime')?.valueChanges.subscribe(value => {
    if (value) {
      const obj = { phys_dispatch: value };
      console.log("Fetching Fiscal Info for Dispatch Date:", obj);

      this.spinner.show();

      this.service.OrderInfoPhysicaldispatch(obj).subscribe(
        (res: any) => {
          console.log("Fiscal Info Response:", res);
          if (res) {
            // ✅ Just patch values - readonly in HTML handles the rest
            this.OrderInfo.patchValue({
              Month: res.FISCAL_MONTH || '',
              FiscalQuarter: res.FISCAL_QUARTER || '',
              FiscalYear: res.FISCAL_YEAR || ''
            });
            
            this.showFiscalFields = true;
          }
          this.spinner.hide();
        },
        error => {
          console.error("Error fetching fiscal info:", error);
          this.spinner.hide();
        }
      );
    } else {
      // Clear fields when date is removed
      this.OrderInfo.patchValue({
        Month: '',
        FiscalQuarter: '',
        FiscalYear: ''
      });
      
      this.showFiscalFields = false;
    }
  });
}


  onSapTypeChange(): void {
    this.fetchpdb();
    this.showForm = false;
    
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    
    this.previousSapType = this.sapType;
    this.setConditionalValidators();

    console.log("sapType", this.sapType);
    
    if (this.sapType === "Non-SAP") {
      this.showForm = true;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    
    if (!value || value.trim() === '') {
      this.showForm = false;
      return;
    }

    if (this.sapType === 'SAP') {
      this.fetchSAPData(type);
    } else if (this.sapType === 'Non-SAP') {
      this.fetchNonSAPData();
      this.showForm = true;
    }
  }

  fetchSAPData(type: 'purchase' | 'invoice'): void {
    const obj = { VBELN: this.invoicenumber };

    this.spinner.show();
    this.service.OrderinfoOutward(obj).subscribe(
      (res: any) => {
        console.log("✅ SAP Fetch Response:", res);
        
        if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
          this.spinner.hide();
        } else {
          this.showForm = false;
          this.spinner.hide();
          Swal.fire({
            text: 'No Data',
            icon: 'warning',
            
          });
        }
      },
      error => {
        this.showForm = false;
        this.spinner.hide();
        Swal.fire({
          text: 'Internal Server Error. Please try again later.',
          icon: 'error',
          
        });
      }
    );
  }

  fetchNonSAPData(): void {
    const obj = {
      orderType: this.orderType,
      sapType: this.sapType,
      RefNumber: this.OrderInfo.get('RefNumber')?.value || '',
      Customer: this.OrderInfo.get('Customer')?.value || ''
    };

    this.spinner.show();
    this.service.OrderInfoNonSap(obj).subscribe(
      (res: any) => {
        console.log("✅ Non-SAP Response:", res);
        
        if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
          this.spinner.hide();
        } else {
          this.resetExtraFields();
          this.showForm = false;
          this.spinner.hide();
        }
      },
      error => {
        this.showForm = false;
        this.spinner.hide();
      }
    );
  }

  private patchForm(data: any): void {
    console.log("📝 Patching form with data:", data);
    
    this.OrderInfo.patchValue({
      TaxInvoice: data.INV_VBELN || '',
      DCReference: data.DC_REF || '',
      ODN: data.INV_ODNO || '',
      InvoiceOrReferenceDate: this.formatToDDMMYYYY(data.INV_DATE) || '',
      BasicShipment: data.BASIC_SHIP_VALUE || '',
      InvoiceWithGst: data.INV_VALUE_GST || '',
      FiscalYear: data.FISCAL_YEAR || '',
      FiscalQuarter: data.FISCAL_QUARTER || '',
      Month: data.MONTH || '',
      PhysicalDispatchDateTime: data.PHYS_DISPATCH || '',
      Plant: data.PLANT_NAME || '',
      TransactionType: data.TRAN_TYPE || '',
      BillingTransactionType: data.TRAN_TEXT_BILL || '',
      Division: data.DIVISION_TEXT || data.DIVISION || '',
      SubDivision: data.SUB_DIVISION || '',
      RefNumber: data.SO_REF_NO || '',
      Customer: data.CUST_NAME || '',
      CustomerGroup: data.CUST_GROUP || '',
      CNee: data.CNEE_NAME || '',
      DestinationLocation: data.DEST_LOC || '',
      DestinationState: data.DEST_STATE || '',
      DestinationZone: data.DEST_ZONE || ''
    }, { emitEvent: false });

    console.log("📋 Form values after patch:", this.OrderInfo.value);
    
    // Set validators after patching
    this.setConditionalValidators();
    
    // Mark as touched to show any validation errors
    this.OrderInfo.markAllAsTouched();
    
    this.showForm = true;
  }

  saveOutwardInvoiceData(): void {
    this.OrderInfo.markAllAsTouched();
    
    // Debug: Check which fields are invalid
    console.log('📊 Form Status:', {
      valid: this.OrderInfo.valid,
      sapType: this.sapType,
      orderType: this.orderType
    });
    console.log('📝 Form Values:', this.OrderInfo.value);
    
    const invalidFields: string[] = [];
    const missingFields: string[] = [];
    
    Object.keys(this.OrderInfo.controls).forEach(key => {
      const control = this.OrderInfo.get(key);
      if (control?.invalid) {
        invalidFields.push(key);
        console.log(`❌ Invalid field: ${key}`, {
          value: control.value,
          errors: control.errors,
          hasValidator: control.hasValidator(Validators.required)
        });
        
        if (control.errors?.['required']) {
          missingFields.push(key);
        }
      }
    });

    // Stop if form is invalid
    if (this.OrderInfo.invalid) {
      const errorMessage = missingFields.length > 0 
        ? `Please fill all required fields before saving:`
        : 'Please fill all required fields before saving.';
      
      Swal.fire({
        title: 'Validation Error',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'Ok',
        timer: 6000
      });
      return;
    }

    const formValue = this.OrderInfo.value;
    const record = {
      INV_VBELN: this.isSap() ? formValue.TaxInvoice : formValue.DCReference,
      INV_ODNO: formValue.ODN,
      INV_DATE: formValue.InvoiceOrReferenceDate,
      BASIC_SHIP_VALUE: formValue.BasicShipment,
      INV_VALUE_GST: formValue.InvoiceWithGst,
      PHYS_DISPATCH: formValue.PhysicalDispatchDateTime,
      FISCAL_YEAR: formValue.FiscalYear,
      FISCAL_QUARTER: formValue.FiscalQuarter,
      MONTH: formValue.Month,
      PLANT_NAME: formValue.Plant,
      TRAN_TYPE: formValue.TransactionType,
      TRAN_TEXT_BILL: formValue.BillingTransactionType,
      DIVISION: formValue.Division,
      SUB_DIVISION: formValue.SubDivision,
      SO_REF_NO: formValue.RefNumber,
      CUST_NAME: formValue.Customer,
      CUST_GROUP: formValue.CustomerGroup,
      CNEE_NAME: formValue.CNee,
      DEST_LOC: formValue.DestinationLocation,
      DEST_STATE: formValue.DestinationState,
      DEST_ZONE: formValue.DestinationZone
    };

    console.log('💾 Saving record:', record);

    if (this.sapType === "SAP") {
      this.spinner.show();
      this.service.OrderInfoOutwardSave({ SAVE: [record] }).subscribe(
        (res: any) => {
          console.log("✅ SAP Save Response:", res);

          if (res.STATUS == "true" || res.NUMBER == "200") {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 5000
            });
            this.OrderInfo.reset();
            this.spinner.hide();
            this.showForm = false;
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
              timer: 5000
            });
            this.spinner.hide();
          }
        },
        error => {
          console.error('❌ SAP Save Error:', error);
          this.spinner.hide();
          Swal.fire({
            text: 'Internal Server Error. Please try again later.',
            icon: 'error',
            timer: 5000
          });
        }
      );
    } else {
      this.spinner.show();
      this.service.OrderInfoNonSap({ CREATE: [record] }).subscribe(
        (res: any) => {
          console.log("✅ Non-SAP Save Response:", res);
          
          if (res.STATUS == "true" || res.NUMBER == "200") {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 5000
            });
            this.OrderInfo.reset();
            this.spinner.hide();
            this.showForm = false;
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
              timer: 5000
            });
            this.spinner.hide();
          }
        },
        error => {
          console.error('❌ Non-SAP Save Error:', error);
          this.spinner.hide();
          Swal.fire({
            text: 'Internal Server Error. Please try again later.',
            icon: 'error',
            timer: 5000
          });
        }
      );
    }
  }

  private formatToDDMMYYYY(value: any): string {
    if (!value) return '';
    
    if (typeof value === 'string' && /^\d{8}$/.test(value)) {
      return `${value.substr(6, 2)}-${value.substr(4, 2)}-${value.substr(0, 4)}`;
    }
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    
    return String(value);
  }

  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.resetExtraFields();
    }
  }

  resetExtraFields(): void {
    this.OrderInfo.reset();
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.OrderInfo.reset();
  }

  fetchpdb(): void {
    this.spinner.show();
    this.service.getpdb().subscribe(
      (res: any) => {
        console.log("📦 PDB Data:", res);
        this.plantList = res[0].PLANT;
        this.divisionList = res[0].DIVISION;
        this.billintypeList = res[0].BILLING_TYPE;
        this.statesList = res[0].STATES;
        this.spinner.hide();
      },
      error => {
        console.error("❌ PDB Fetch Error:", error);
        this.spinner.hide();
      }
    );
  }

  fetchzonechange(): void {
    if (this.OrderInfo.value.DestinationState) {
      const obj = {
        "STATE": this.OrderInfo.value.DestinationState
      };
      
      this.spinner.show();
      this.service.fetchzone(obj).subscribe(
        (res: any) => {
          this.OrderInfo.patchValue({
            "DestinationZone": res.ZONE
          });
          this.spinner.hide();
        },
        error => {
          console.error("❌ Zone Fetch Error:", error);
          this.spinner.hide();
        }
      );
    }
  }
}