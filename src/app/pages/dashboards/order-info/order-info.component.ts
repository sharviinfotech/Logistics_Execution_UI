import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';

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
  statesList: any;
  custList: any;
  customerGroup: string = '';

  constructor(private fb: FormBuilder, private service: GeneralserviceService, private spinner: NgxSpinnerService,public spinnerService: SpinnerService) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      TaxInvoice: ['',Validators.required],
      ODN: ['',Validators.required],
      InvoiceData: ['',Validators.required],
      BasicShipment: ['',Validators.required],
      // Itemnumber: [''],
      InvoiceWithGst: ['',Validators.required],
      FinanceYear: [''],
      // SystemGeneratedDate: [''],
      FiscalYear: ['',Validators.required],
      FiscalQuarter: ['',Validators.required],
      Month: ['',Validators.required],
      BillingTransactionType: ['',Validators.required],
      // Billingdescription: [''],
      Plant: ['',Validators.required],
      // Plantdescription: [''],
      TransactionType: ['',Validators.required],
      Division: ['',Validators.required],
      // Divisiondescription: [''],
      SubDivision: ['',Validators.required],
      RefNumber: ['',Validators.required],
      Customer: ['',Validators.required],
      CustomerGroup: ['',Validators.required],
      CNee: ['',Validators.required],
      DestinationLocation: ['',Validators.required],
      DestinationState: ['',Validators.required],
      DestinationZone: ['',Validators.required],
      // status: [''],
      PhysicalDispatchDateTime: ['',Validators.required]
    });
    
  }

  // Helper to check SAP mode
  isSap(): boolean {
    return this.sapType === 'SAP';
  }

  onPlantChange(): void {
    const code = this.OrderInfo.get('Plant')?.value;
    console.log("code", code)
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
    this.fetchpdb();
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

    this.spinner.show()
    this.service.OrderinfoOutward(obj).subscribe((res: any) => {
      console.log("res Fetch", res)
      if (res && res.length > 0) {
        this.patchForm(res[0]);
        this.showForm = true;
        this.spinner.hide()
        // setTimeout(() => {
        // this.spinner.show('success', 'right');
        // setTimeout(() => this.spinner.hide(), 900);
      // }, 50); 
      } else {
        this.showForm = false;
        this.spinner.hide()
      //    setTimeout(() => {
      //   this.spinner.show('error', 'left');
      //   setTimeout(() => this.spinner.hide(), 900);
      // }, 50);
      }
    }, error => {
        this.showForm = false;
        this.spinner.hide()
    // this.spinnerErrorMsg = 'Internal Server Error. Please try again later.';
    // setTimeout(() => {
    //     this.spinner.show('error', 'left');
    //     setTimeout(() => this.spinner.hide(), 900);
    //   }, 50);
    });
  }

  fetchNonSAPData(): void {
    const obj = {
      orderType: this.orderType,
      sapType: this.sapType,
      RefNumber: this.OrderInfo.get('RefNumber')?.value || '',
      Customer: this.OrderInfo.get('Customer')?.value || ''
    };
    
    this.service.OrderInfoNonSap(obj).subscribe((res:any)=>{

      console.log("non sap save ",res)
      if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
        } else {
          this.resetExtraFields();
          this.showForm = false;
        }
    },error =>{
      this.showForm = false;
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
    this.OrderInfo.markAllAsTouched();
  }

  saveOutwardInvoiceData(): void {


    this.OrderInfo.markAllAsTouched();

  // Stop if form is invalid
  if (this.OrderInfo.invalid) {
    Swal.fire({
      title: 'Validation Error',
      text: 'Please fill all required fields before saving.',
      icon: 'warning',
      confirmButtonText: 'Ok',
      timer: 4000
    });
    return;
  }
    const formValue = this.OrderInfo.value;
    const record = {
      INV_VBELN: formValue.TaxInvoice,
      INV_ODNO: formValue.ODN,
      INV_DATE: formValue.InvoiceData,
      BASIC_SHIP_VALUE: formValue.BasicShipment,

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
      this.spinner.show()
      this.service.OrderInfoOutwardSave({ SAVE: [record] }).subscribe((res: any) => {
        console.log("res SAP", res)

        if (res.STATUS == "true" || res.NUMBER == "200") {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
          this.OrderInfo.reset()
          this.spinner.hide()
          this.showForm = false;
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
            this.spinner.hide()
          });
          this.spinner.hide()
        }


      }, error => {
        this.spinner.hide()
      });
    } else {
      this.service.OrderInfoNonSap({ CREATE: [record] }).subscribe((res: any) => {
        console.log("res non SAP", res)
        if (res.STATUS == "true" || res.NUMBER == "200") {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
          this.OrderInfo.reset()
          this.spinner.hide()
          this.showForm = true;
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
          this.spinner.hide()
        }
      },error=>{
        this.spinner.hide()
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

    this.spinner.show()
    this.service.getpdb().subscribe((res: any) => {
      console.log("PDB Data:", res);
      this.plantList = res[0].PLANT;
      this.divisionList = res[0].DIVISION;
      this.billintypeList = res[0].BILLING_TYPE;
      this.statesList = res[0].STATES;
      this.spinner.hide()
    }, error => {
      this.spinner.hide()
    });
  }
  fetchzonechange() {
    if (this.OrderInfo.value.DestinationState) {
      let obj = {
        "STATE": this.OrderInfo.value.DestinationState
      }
      this.spinner.show()
      this.service.fetchzone(obj).subscribe((res: any) => {
        this.OrderInfo.patchValue({
          "DestinationZone": res.ZONE
        })
        this.spinner.hide()
      }, error => {
        this.spinner.hide()
      });
    }

  }
  // custgroupchange() {
  //   if (this.OrderInfo.value.Customer) {
  //     let obj = {
  //       "CUST": {
  //         "customer": this.OrderInfo.value.Customer
  //       }
  //     }
  //     this.service.custgroup(obj).subscribe((res: any) => {
  //       this.OrderInfo.patchValue({
  //         "CustomerGroup": res.CUSTOMER_GRP
  //       })
  //     });
  //   }

  // }

  // custgroupchange() {
  //   const customer = this.OrderInfo.value.Customer;

  //   if (customer) {
  //     // ✅ Properly wrap payload for your service
  //     const payload = {
  //       CUST: {
  //         customer: customer
  //       }
  //     };

  //     console.log('➡️ Sending Payload:', payload);

  //     this.service.custgroup(payload).subscribe({
  //       next: (res: any) => {
  //         console.log('✅ API Response:', res);

  //         if (res && res.CUSTOMER_GRP) {
  //           this.OrderInfo.patchValue({
  //             CustomerGroup: res.CUSTOMER_GRP
  //           });
  //         } else {
  //           console.warn('⚠️ CUSTOMER_GRP missing in response:', res);
  //           this.OrderInfo.patchValue({ CustomerGroup: '' });
  //         }
  //       },
  //       error: (err) => {
  //         console.error('❌ API Error:', err);
  //         this.OrderInfo.patchValue({ CustomerGroup: '' });
  //       }
  //     });
  //   } else {
  //     console.warn('⚠️ No customer selected');
  //     this.OrderInfo.patchValue({ CustomerGroup: '' });
  //   }
  // }






}
