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

  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;
  previousSapType: string | null = null;
  plantList: any;
  divisionList: any;
  billintypeList: any;

  constructor(private fb: FormBuilder, private service: GeneralserviceService) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
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
      Billingdescription: [''],
      Plant: [''],
      Plantdescription: [''],
      TransactionType: [''],
      Division: [''],
      Divisiondescription: [''],
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
    this.fetchpdb();
  }

  // Helper to check SAP mode
  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onPlantChange(): void {
    const code = this.OrderInfo.get('Plant')?.value;
    const selected = this.plantList.find((p: any) => p.PLANT === code);
    this.OrderInfo.patchValue({ Plantdescription: selected?.PLANT_DESC || '' });
  }

  onDivisionChange(): void {
    const code = this.OrderInfo.get('Division')?.value;
    const selected = this.divisionList.find((d: any) => d.DIVISION === code);
    this.OrderInfo.patchValue({ Divisiondescription: selected?.DIVISION_DESC || '' });
  }

  onBillingTypeChange(): void {
    const code = this.OrderInfo.get('BillingTransactionType')?.value;
    const selected = this.billintypeList.find((b: any) => b.BILL_TYPE === code);
    this.OrderInfo.patchValue({ Billingdescription: selected?.BILL_TYPE_DESC || '' });
  }

  onOrderTypeChange(): void {
    if (this.previousOrderType !== null && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.previousSapType = null;
      this.resetConditionalFields();
    }
    this.previousOrderType = this.orderType;
  }

  onSapTypeChange(): void {
    this.showForm = false;
    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.resetConditionalFields();
    }
    this.previousSapType = this.sapType;

    console.log("sapType", this.sapType);
    if (this.sapType === "SAP") {
      this.fetchNonSAPData(); // can be replaced with SAP master fetch if available
    } else {
      this.showForm = true;
    }
  }

  getForm(type: 'purchase' | 'invoice'): void {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      return;
    }
    this.setValidatorsOnFormFields();

    if (this.sapType === 'SAP') {
      this.fetchSAPData(type);
    } else if (this.sapType === 'Non-SAP') {
      this.fetchNonSAPData();
    }
  }

  fetchSAPData(type: 'purchase' | 'invoice'): void {
    const obj = { VBELN: this.invoicenumber };
    this.showForm = true;
    this.service.OrderinfoOutward(obj).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.patchForm(res[0]);
        }
      },
      error: (err) => {
        console.error('SAP API error:', err);
        this.showForm = false;
      }
    });
  }

  fetchNonSAPData(): void {
    const obj = {
      orderType: this.orderType,
      sapType: this.sapType,
      RefNumber: this.OrderInfo.get('RefNumber')?.value || '',
      Customer: this.OrderInfo.get('Customer')?.value || ''
    };
    this.showForm = true;
    this.service.OrderInfoNonSap(obj).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.patchForm(res[0]);
        } else {
          this.resetExtraFields();
        }
      },
      error: (err) => {
        console.error('Non-SAP API error:', err);
        this.showForm = false;
      }
    });
  }

  private patchForm(data: any): void {
    this.OrderInfo.patchValue({
      TaxInvoice: data.INV_VBELN || '',
      ODN: data.INV_ODNO || '',
      InvoiceData: this.formatToDDMMYYYY(data.INV_DATE) || '',
      BasicShipment: data.BASIC_SHIP_VALUE || '',
      Itemnumber: data.POSNR || '',
      InvoiceWithGst: data.INV_VALUE_GST || '',
      FinanceYear: data.FISCAL_YEAR || '',
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
    });
    this.showForm = true;
  }

  saveOutwardInvoiceData(): void {
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

    if (this.sapType === "SAP") {
      this.service.OrderInfoOutwardSave({ SAVE: [record] }).subscribe({
        next: () => alert('Saved successfully!'),
        error: () => alert('Failed to save data.')
      });
    } else {
      this.service.OrderInfoNonSap({ CREATE: [record] }).subscribe({
        next: () => alert('Saved successfully!'),
        error: () => alert('Failed to save data.')
      });
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

  setValidatorsOnFormFields(): void {
    Object.keys(this.OrderInfo.controls).forEach(c => {
      this.OrderInfo.get(c)?.setValidators(Validators.required);
      this.OrderInfo.get(c)?.updateValueAndValidity();
    });
  }

  fetchpdb() {
    this.service.getpdb().subscribe((res: any) => {
      console.log("PDB Data:", res);
      this.plantList = res[0].PLANT;
      this.divisionList = res[0].DIVISION;
      this.billintypeList = res[0].BILLING_TYPE;
    });
  }
}
