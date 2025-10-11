import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-order-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './order-info.component.html',
  styleUrls: ['./order-info.component.css']
})
export class OrderInfoComponent implements OnInit {
  OrderInfo!: FormGroup;
  showForm = false;
  isEditMode = false;

  // ngModel properties
  orderType: string = '';   // 'Inward' or 'Outward'
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;

  constructor(private fb: FormBuilder, private service: GeneralserviceService) {}

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      // reactive fields (kept reactive for the rest of form)
      TaxInvoice: [''],
      ODN: [''],
      InvoiceData: [''],
      BasicShipment: [''],
      Itemnumber: [''],
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
      status: [''],
      PhysicalDispatchDateTime: ['']
    });
  }

  // called when user changes the radio Order Type
  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  // called when sapType changes
  onSapTypeChange(): void {
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;
  }

  // GET handler (uses ngModel values, not reactive controls)
  getForm(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;

    // simple client-side validation
    if (!value || value.trim() === '') {
      this.showForm = false;
      console.log(`${type} is required.`);
      return;
    }

    // enable validators on remaining fields (if you want to make them required after GET)
    this.setValidatorsOnFormFields();

    // call API
    this.fetchOutwardInvoicenumberdata(type);
  }

  // Calls the outward API (your service has only OrderinfoOutward)
  fetchOutwardInvoicenumberdata(type: 'purchase' | 'invoice'): void {
    const vb = type === 'purchase' ? this.ponumber : this.invoicenumber;
    const obj = { VBELN: this.invoicenumber };

    this.showForm = true;
    console.log('Calling API with:', obj);
    this.service.OrderinfoOutward(obj).subscribe(
      (res: any) => {
        console.log('API response:', res);
       
        if (res) {
          this.OrderInfo.patchValue({
            TaxInvoice: res[0].INV_VBELN || '',
            ODN: res[0].INV_ODNO || '',
            InvoiceData: this.formatToDDMMYYYY(res[0].INV_DATE) || '',
            BasicShipment: res[0].BASIC_SHIP_VALUE || '',
            Itemnumber: res[0].POSNR || '',
            InvoiceWithGst: res[0].INV_VALUE_GST || '',
            FinanceYear: res[0].FISCAL_YEAR || '',
            FiscalQuarter: res[0].FISCAL_QUARTER || '',
            Month: res[0].MONTH || '',     
            PhysicalDispatchDateTime: res[0]. PHYS_DISPATCH || '',
            Plant: res[0].PLANT_NAME || '',
            TransactionType: res[0].TRAN_TYPE || '',
            BillingTransactionType: res[0].TRAN_TEXT_BILL || '', 
            Division: res[0].DIVISION_TEXT || '',
            SubDivision: res[0].SUB_DIVISION || '',
            RefNumber: res[0].SO_REF_NO || '',
            Customer: res[0].CUST_NAME || '',
            CustomerGroup: res[0].CUST_GROUP || '',
            CNee: res[0].CNEE_NAME || '',
            DestinationLocation: res[0].DEST_LOC || '',
            DestinationState: res[0].DEST_STATE || '',
            DestinationZone: res[0].DEST_ZONE || '',
            // status: res[0].INV_STATUS || ''


            // map other fields you need...
          });
        }
      },
      (err) => {
        console.error('API error', err);
        this.showForm = false;
      }
    );
  }
  saveOutwardInvoiceData(): void {
  console.log('Save button clicked');

  // Prepare mapped payload
  const formValue = this.OrderInfo.value;

  const record = {
    INV_VBELN: formValue.TaxInvoice,
    INV_ODNO: formValue.ODN,
    INV_DATE: formValue.InvoiceData,
    BASIC_SHIP_VALUE: formValue.BasicShipment,
    POSNR: formValue.Itemnumber,
    INV_VALUE_GST: formValue.InvoiceWithGst,
    PHYS_DISPATCH: formValue.PhysicalDispatchDateTime,
    FISCAL_YEAR: formValue.FinanceYear,
    FISCAL_QUARTER: formValue.FiscalQuarter,
    MONTH: formValue.Month,
    PLANT_NAME: formValue.Plant,
    TRAN_TYPE: formValue.TransactionType,
    TRAN_TEXT_BILL: formValue.BillingTransactionType,
    DIVISION: formValue.Division,               // ✅ changed from DIVISION_TEXT to DIVISION
    SUB_DIVISION: formValue.SubDivision,
    SO_REF_NO: formValue.RefNumber,
    CUST_NAME: formValue.Customer,
    CUST_GROUP: formValue.CustomerGroup,
    CNEE_NAME: formValue.CNee,
    DEST_LOC: formValue.DestinationLocation,
    DEST_STATE: formValue.DestinationState,
    DEST_ZONE: formValue.DestinationZone
  };

  // Final payload matches backend
  const payload = {
    SAVE: [record]
  };

  console.log('Final Save Payload:', payload);

  this.service.OrderInfoOutwardSave(payload).subscribe({
    next: (res: any) => {
      console.log('Save API Response:', res);
      // Handle success or confirmation
      if (res && (res.status === 'Success' || res.message?.toLowerCase().includes('success'))) {
        alert('Outward Invoice saved successfully!');
      } else {
        alert('Save API executed — check backend to confirm.');
      }
    },
    error: (err) => {
      console.error('Save API Error:', err);
      alert('Failed to save Outward Invoice data.');
    },
  });
}



  // helper to format many possible date representations into DD-MM-YYYY
  private formatToDDMMYYYY(value: any): string {
    if (!value && value !== 0) return '';

    // If value already looks like DD-MM-YYYY, return as-is
    if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value)) return value;

    // If value is in YYYYMMDD (common in SAP e.g. 20251009)
    if (typeof value === 'string' && /^\d{8}$/.test(value)) {
      const y = value.substr(0,4);
      const m = value.substr(4,2);
      const d = value.substr(6,2);
      return `${d}-${m}-${y}`;
    }

    // If value is a number like 20251009
    if (typeof value === 'number') {
      const s = value.toString();
      if (/^\d{8}$/.test(s)) return `${s.substr(6,2)}-${s.substr(4,2)}-${s.substr(0,4)}`;
    }

    // Try Date parsing for ISO or timestamp
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

    // fallback: return original value as string
    return String(value);
  }

  // hide form / clear fields when input cleared
  onInputChange(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.clearValidatorsOnFormFields();
      this.resetExtraFields();
    }
  }

  // reset everything
  resetForm(): void {
    this.OrderInfo.reset();
    this.orderType = '';
    this.sapType = '';
    this.previousOrderType = null;
    this.previousSapType = null;
    this.ponumber = '';
    this.invoicenumber = '';
    this.showForm = false;
    this.isEditMode = false;
    this.clearValidatorsOnFormFields();
  }

  // reset conditional fields and hide form
  private resetConditionalFields(): void {
    this.showForm = false;
    this.clearValidatorsOnFormFields();
    this.OrderInfo.patchValue({
      TaxInvoice: '',
      ODN: '',
      InvoiceData: '',
      BasicShipment: '',
      Itemnumber: '',
      InvoiceWithGst: '',
      FinanceYear: '',
      SystemGeneratedDate: '',
      FiscalYear: '',
      FiscalQuarter: '',
      Month: '',
      BillingTransactionType: '',
      PhysicalDispatchDateTime: '',
      Plant: '',
      TransactionType: '',
      Division: '',
      SubDivision: '',
      RefNumber: '',
      Customer: '',
      CustomerGroup: '',
      CNee: '',
      DestinationLocation: '',
      DestinationState: '',
      DestinationZone: '',
      status: ''
    });
  }

  // reset only the extra fields when input cleared
  private resetExtraFields(): void {
    this.OrderInfo.patchValue({
      TaxInvoice: '',
      ODN: '',
      InvoiceData: '',
      BasicShipment: '',
      Itemnumber: '',
      InvoiceWithGst: '',
      FinanceYear: '',
      SystemGeneratedDate: '',
      FiscalYear: '',
      FiscalQuarter: '',
      Month: '',
      BillingTransactionType: '',
      PhysicalDispatchDateTime: '',
      Plant: '',
      TransactionType: '',
      Division: '',
      SubDivision: '',
      RefNumber: '',
      Customer: '',
      CustomerGroup: '',
      CNee: '',
      DestinationLocation: '',
      DestinationState: '',
      DestinationZone: '',
      status: ''
    });
  }

  // set required validators on the rest of the form fields after successful GET
  private setValidatorsOnFormFields(): void {
    const controls = [
      'TaxInvoice','ODN','InvoiceData','BasicShipment','InvoiceWithGst','FinanceYear','SystemGeneratedDate',
      'FiscalYear','FiscalQuarter','Month','BillingTransactionType','Plant','TransactionType','Division',
      'SubDivision','RefNumber','Customer','CustomerGroup','CNee','DestinationLocation','DestinationState',
      'DestinationZone','status','PhysicalDispatchDateTime', 'Itemnumber'
    ];
    controls.forEach(controlName => {
      this.OrderInfo.get(controlName)?.setValidators(Validators.required);
      this.OrderInfo.get(controlName)?.updateValueAndValidity();
    });
  }

  // clear validators
  private clearValidatorsOnFormFields(): void {
    const controls = [
      'TaxInvoice','ODN','InvoiceData','BasicShipment','InvoiceWithGst','FinanceYear','SystemGeneratedDate',
      'FiscalYear','FiscalQuarter','Month','BillingTransactionType','Plant','TransactionType','Division',
      'SubDivision','RefNumber','Customer','CustomerGroup','CNee','DestinationLocation','DestinationState',
      'DestinationZone','status','PhysicalDispatchDateTime', 'Itemnumber'
    ];
    controls.forEach(controlName => {
      this.OrderInfo.get(controlName)?.clearValidators();
      this.OrderInfo.get(controlName)?.updateValueAndValidity();
    });
  }

  // Save (submit) handler
  savePlan(): void {
    if (this.OrderInfo.valid) {
      const formData = {
        ...this.OrderInfo.value,
        orderType: this.orderType,
        sapType: this.sapType
      };
      console.log('Order Info Data:', formData);
      this.resetForm();
    } else {
      Object.keys(this.OrderInfo.controls).forEach(key => {
        this.OrderInfo.get(key)?.markAsTouched();
      });
      console.log('Form is invalid. Please fill out all required fields.');
    }
  }

  // Cancel edit
  cancelEdit(): void {
    this.resetForm();
  }
  
}
