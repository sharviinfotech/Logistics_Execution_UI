import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { SharedModule } from '../saas/shared/shared.module';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-order-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule,NgSelectModule],
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
  customerList: any;
  customerGroup: string = '';
  showFiscalFields: boolean = false;

  initialFormValues: any = {};
  selectedItems: any[] = [];
  searchReference: string = '';
  searchOptions = [
    { key: 'ref_no', label: 'Reference No' },
    { key: 'inv_no', label: 'Invoice No' },
    { key: 'odn_no', label: 'ODN No' },
    { key: 'so_no', label: 'SO No' },
    { key: 'lr_no', label: 'LR NO' }
  ];
  selectedType: any = '';
  searchOptionsList: any[] = [];
  dropdownOpen = false;

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      TaxInvoice: [''],
      DCReference: [''],
      InvoiceDate: [''],
      ReferenceDate: [''],
      ODN: [''],
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
      items: this.fb.array([this.createItemRow()])
    });

    this.initialFormValues = this.OrderInfo.value;
    this.setupPhysicalDispatch();
    this.fetchCustomers();
  }

  createItemRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: ['']
    });
  }

  addItem(): void {
    this.items.push(this.createItemRow());
  }

  get items(): FormArray {
    return this.OrderInfo.get('items') as FormArray;
  }

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
  updateSearchOptionLabels(): void {
        const isSapMode = this.isSap(); // uses this.sapType === 'SAP'

        // Find the 'INV_NO' object in the searchOptions array (index 1)
        const invoiceOption = this.searchOptions.find(option => option.key === 'INV_NO');

        if (invoiceOption) {
            if (isSapMode) {
                // With SAP: Display 'Invoice Number'
                invoiceOption.label = 'Invoice Number'; 
            } else {
                // Without SAP: Display 'DC Reference Number'
                invoiceOption.label = 'DC Reference Number';
            }
            console.log(`🔍 Updated INV_NO label to: ${invoiceOption.label}`);
        }
    }

  setConditionalValidators(): void {
    console.log('🔧 Setting validators for sapType:', this.sapType);

    Object.keys(this.OrderInfo.controls).forEach(key => {
      this.OrderInfo.get(key)?.clearValidators();
      this.OrderInfo.get(key)?.updateValueAndValidity({ emitEvent: false });
    });

    const alwaysRequired = [
      'ODN', 'BasicShipment', 'InvoiceWithGst', 'FiscalQuarter', 'Month',
      'BillingTransactionType', 'Plant', 'TransactionType', 'Division', 'SubDivision',
      'RefNumber', 'Customer', 'CustomerGroup', 'CNee', 'DestinationLocation',
      'DestinationState', 'DestinationZone', 'PhysicalDispatchDateTime'
    ];
    alwaysRequired.forEach(key => {
      this.OrderInfo.get(key)?.setValidators([Validators.required]);
    });

    if (this.isSap()) {
      this.OrderInfo.get('TaxInvoice')?.setValidators([Validators.required]);
      this.OrderInfo.get('InvoiceDate')?.setValidators([Validators.required]);
    } else {
      this.OrderInfo.get('DCReference')?.setValidators([Validators.required]);
      this.OrderInfo.get('ReferenceDate')?.setValidators([Validators.required]);
    }

    Object.keys(this.OrderInfo.controls).forEach(key => {
      this.OrderInfo.get(key)?.updateValueAndValidity({ emitEvent: false });
    });

    console.log('✅ Validators set successfully');
  }

  onPlantChange(): void {
  const selectedPlant = this.OrderInfo.get('Plant')?.value;
  console.log("🌱 Plant selected:", selectedPlant);

  // Only fetch division for Non-SAP mode
  if (!this.isSap() && selectedPlant) {
    // Find the selected plant object from plantList
    const plantObj = this.plantList?.find(
      (p: any) => p.PLANT_DESC === selectedPlant
    );

    if (plantObj && plantObj.PLANT) {
      const payload = {
        WERKS: plantObj.PLANT
      };

      console.log("📤 Fetching division for plant code:", plantObj.PLANT);
      this.spinner.show();

      this.service.PlantBasedDivison(payload).subscribe(
        (res: any) => {
          console.log("✅ Division Response:", res);
          this.spinner.hide();

          if (res && res.DIVISION) {
            // Find matching division from divisionList
            const divisionObj = this.divisionList?.find(
              (d: any) => d.DIVISION === res.DIVISION
            );

            if (divisionObj) {
              // Set the full division description (same as dropdown shows)
              this.OrderInfo.patchValue({
                Division: divisionObj.DIVISION_DESC
              });
              console.log("✅ Division set to:", divisionObj.DIVISION_DESC);
            } else {
              // Fallback: set just the division code if no match found
              this.OrderInfo.patchValue({
                Division: res.DIVISION
              });
              console.log("⚠️ Division set to code:", res.DIVISION);
            }
          } else {
            console.warn("⚠️ No DIVISION in response");
          }
        },
        (error) => {
          console.error("❌ Error fetching division:", error);
          this.spinner.hide();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch division for selected plant',
            timer: 2000
          });
        }
      );
    } else {
      console.warn("⚠️ Plant object not found for:", selectedPlant);
      // Clear division if plant is invalid
      this.OrderInfo.patchValue({
        Division: ''
      });
    }
  } else {
    console.log("ℹ️ Skipping division fetch - SAP mode or no plant selected");
  }
}
  

  onDivisionChange(): void {
    const code = this.OrderInfo.get('Division')?.value;
    console.log("Division selected:", code);
  }

  onBillingTypeChange(): void {
    const code = this.OrderInfo.get('BillingTransactionType')?.value;
    console.log("Billing Type selected:", code);
  }
  onCustomerChange(): void {
    const code = this.OrderInfo.get('Customer')?.value;
    console.log("Customer selected:", code);
  }
  onCneeeChange(): void {
    const code = this.OrderInfo.get('CNee')?.value;
    console.log("Cnee selected:", code);
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
              this.OrderInfo.patchValue({
                Month: res.FISCAL_MONTH || '',
                FiscalQuarter: res.FISCAL_QUARTER || '',
                FiscalYear: res.FISCAL_YEAR || ''
              }, { emitEvent: false });

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
        this.OrderInfo.patchValue({
          Month: '',
          FiscalQuarter: '',
          FiscalYear: ''
        }, { emitEvent: false });

        this.showFiscalFields = false;
      }
    });
  }

  onSapTypeChange(): void {
    this.fetchpdb();
    this.showForm = false;

    if (this.previousSapType !== null && this.previousSapType !== this.sapType) {
      this.ponumber = '';
      this.invoicenumber = '';
      this.resetConditionalFields();
    }
    this.updateSearchOptionLabels();

    this.previousSapType = this.sapType;
    this.setConditionalValidators();

    console.log("sapType", this.sapType);

    if (this.sapType === "Non-SAP") {
      this.showForm = true;
    }
  }

  resetConditionalFields(): void {
    this.showForm = false;
    this.searchOptionsList = [];
    this.selectedItems = [];
    this.OrderInfo.reset(this.initialFormValues);

    const itemsArray = this.OrderInfo.get('items') as FormArray;
    itemsArray.clear();
    itemsArray.push(this.createItemRow());
  }

  getForm(type: 'purchase' | 'invoice'): void {
    this.searchOptionsList = [];
    this.searchReference = '';
    this.selectedType = '';
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

    let formattedPhysDispatch = '';
    if (data.PHYS_DISPATCH) {
      formattedPhysDispatch = this.convertPhysDispatchFormat(data.PHYS_DISPATCH);
    }

    let formattedInvoiceDate = '';
    if (data.INV_DATE) {
      formattedInvoiceDate = this.convertToDateFormat(data.INV_DATE);
      console.log("📝 Formatted INV_DATE:", formattedInvoiceDate);
    }
     console.log("📝 isSap():", this.isSap());
    console.log("📝 Will set InvoiceDate to:", this.isSap() ? formattedInvoiceDate : '');
    console.log("📝 Will set ReferenceDate to:", !this.isSap() ? formattedInvoiceDate : '');

    this.OrderInfo.patchValue({
      TaxInvoice: data.INV_VBELN || '',
      DCReference: data.DC_REF || '',
      InvoiceDate: this.isSap() ? formattedInvoiceDate : '',
      ReferenceDate: !this.isSap() ? formattedInvoiceDate : '',
      ODN: data.INV_ODNO || '',
      BasicShipment: data.BASIC_SHIP_VALUE || '',
      InvoiceWithGst: data.INV_VALUE_GST || '',
      FiscalYear: data.FISCAL_YEAR || '',
      FiscalQuarter: data.FISCAL_QUARTER || '',
      Month: data.MONTH || '',
      PhysicalDispatchDateTime: formattedPhysDispatch,
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

    console.log("📋 Form values after patch:", this.OrderInfo.value);

    this.setConditionalValidators();
    this.OrderInfo.markAllAsTouched();
    this.showForm = true;
  }

  saveOutwardInvoiceData(action: 'stay' | 'next' | 'previous' = 'stay'): void {
    this.OrderInfo.markAllAsTouched();

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

    if (this.OrderInfo.invalid) {
      const errorMessage = missingFields.length > 0
        ? `Please fill all required fields before saving:`
        : 'Please fill all required fields before saving.';

      Swal.fire({
        title: 'Validation Error',
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    const selectedRows = this.items.controls
      .filter((_, idx) => this.isItemSelected(idx))
      .map(item => item.value);

    if (selectedRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select at least one row before saving'
      });
      return;
    }

    const formValue = this.OrderInfo.value;

    const record = selectedRows.map(row => ({
      REF_NO: row.referenceNumber || "",
      WORK_ORDER_NO: row.workOrderNumber || "",
      LR_NO: row.lrNumber || "",
      TRANSPORTER: row.transporter || "",
      INV_VBELN: this.isSap() ? formValue.TaxInvoice : '',
      DC_REF: this.isSap() ? '' : formValue.DCReference,
      INV_ODNO: formValue.ODN,
      INV_DATE: this.isSap()
        ? formValue.InvoiceDate
        : formValue.ReferenceDate,
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
    }));

    console.log("💾 Final SAVE Payload:", record);

    if (this.sapType === "SAP") {
      this.spinner.show();
      this.service.OrderInfoOutwardSave({ SAVE: record }).subscribe(
        (res: any) => {
          console.log("✅ SAP Save Response:", res);

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              if (action === 'next') {
                this.router.navigate(['/shipment-details']);
              } else if (action === 'previous') {
                this.router.navigate(['/dispatch']);
              } else {
                this.OrderInfo.reset();
                this.showForm = false;
              }
            });
            this.spinner.hide();
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
            this.spinner.hide();
          }
        },
        error => {
          console.error('❌ SAP Save Error:', error);
          this.spinner.hide();
          Swal.fire({
            text: 'Internal Server Error. Please try again later.',
          });
        }
      );
    } else {
      this.spinner.show();
      this.service.OrderInfoNonSap({ CREATE: record }).subscribe(
        (res: any) => {
          console.log("✅ Non-SAP Save Response:", res);
          this.spinner.hide();

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Data saved successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              if (action === 'next') {
                this.router.navigate(['/shipment-details']);
              } else if (action === 'previous') {
                this.router.navigate(['/dispatch']);
              } else {
                this.OrderInfo.reset();
                this.showForm = false;
              }
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Failed to save data',
              icon: 'error',
              confirmButtonText: 'Ok',
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

  // ✅ Helper method to convert "20151214T14:47:21" to "2015-12-14T14:47"
  private convertPhysDispatchFormat(physDispatch: string): string {
    if (!physDispatch) return '';

    const match = physDispatch.match(/^(\d{4})(\d{2})(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);

    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    return '';
  }

  // ✅ Helper method to convert "2015-12-14" to "2015-12-14T00:00"
 private convertToDateFormat(date: string): string {
    if (!date) return '';

    if (date.includes('T')) {
    return date.split('T')[0]; 
  }
  if (/^\d{8}$/.test(date)) {
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  // Already in correct format "2015-12-14"
  return date;
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

  fetchpdb(): void {
    this.spinner.show();
    this.service.getpdb().subscribe(
      (res: any) => {
        console.log("📦 PDB Data:", res);
        this.plantList = res[0].PLANT;
        this.divisionList = res[0].DIVISION;
        this.billintypeList = res[0].BILLING_TYPE;
        this.customerList = res[0].CUSTOMER || [];
        this.statesList = res[0].STATES;
        this.spinner.hide();
      },
      error => {
        console.error("❌ PDB Fetch Error:", error);
        this.spinner.hide();
      }
    );
  }

    fetchCustomers(): void {
      this.spinner.show();
      this.service.getAllCustomerList().subscribe(
        (res: any) => {
          console.log('📥 Customer list fetched:', res);
          // normalize to expected structure if needed
          this.customerList = Array.isArray(res) ? res : (res?.data || []);
          this.spinner.hide();
        },
        (error) => {
          console.error('❌ Customer fetch error:', error);
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

  onFieldBlur(index: number, fieldKey: string): void {
    if (index !== 0) return;

    const firstRow = this.items.at(0) as FormGroup;
    const values = firstRow.value;

    if (
      !values.referenceNumber &&
      !values.workOrderNumber &&
      !values.lrNumber &&
      !values.transporter
    ) {
      this.items.clear();
      this.items.push(this.createItemRow());
      return;
    }

    const obj = {
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : ''
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();
    this.service.GlobalReferenceNoFetch(obj).subscribe({
      next: (res: any) => {
        console.log('✅ GlobalRefSearch Response:', res);
        this.spinner.hide();
        this.populateRows(res);
      },
      error: err => {
        console.error('❌ Ref Fetch Error:', err);
        this.spinner.hide();
      }
    });
  }

  populateRows(data: any[]): void {
    this.items.clear();

    if (data && data.length > 0) {
      data.forEach(d => {
        this.items.push(
          this.fb.group({
            referenceNumber: [d.REF_NO || ''],
            workOrderNumber: [d.WORK_ORDER_NO || ''],
            lrNumber: [d.LR_NO || ''],
            transporter: [d.TRANSPORTER || '']
          })
        );
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'No Records Found',
        text: 'No matching reference details were found.',
        timer: 1500,
        showConfirmButton: false,
        width: '300px'
      });
      this.items.push(this.createItemRow());
    }
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.items.at(index) as FormGroup).value;

    if (checkbox.checked) {
      const exists = this.selectedItems.some(
        (item) =>
          item.referenceNumber === rowValue.referenceNumber &&
          item.workOrderNumber === rowValue.workOrderNumber &&
          item.lrNumber === rowValue.lrNumber &&
          item.transporter === rowValue.transporter
      );
      if (!exists) {
        this.selectedItems.push(rowValue);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (item) =>
          !(
            item.referenceNumber === rowValue.referenceNumber &&
            item.workOrderNumber === rowValue.workOrderNumber &&
            item.lrNumber === rowValue.lrNumber &&
            item.transporter === rowValue.transporter
          )
      );
    }

    console.log('✅ Selected Items:', this.selectedItems);
  }

  isItemSelected(index: number): boolean {
    const rowValue = (this.items.at(index) as FormGroup).value;

    return this.selectedItems.some(
      (item) =>
        item.referenceNumber === rowValue.referenceNumber &&
        item.workOrderNumber === rowValue.workOrderNumber &&
        item.lrNumber === rowValue.lrNumber &&
        item.transporter === rowValue.transporter
    );
  }

  openSearchTypePopup() {
    this.ponumber = '';
    this.invoicenumber = '';
    this.showForm = false;

    if (!this.searchReference?.trim()) {
      Swal.fire('Please enter a value before searching', '', 'warning');
      return;
    }

    Swal.fire({
      title: 'Select Search Type',
      html: this.generateSearchOptionsHTML(),
      showCancelButton: false,
      confirmButtonText: 'Search',
      width: 400,
      focusConfirm: false,
      showCloseButton: true,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn'
      },
      didOpen: () => {
        const radios = document.querySelectorAll('input[name="searchType"]');
        radios.forEach((radio) => {
          radio.addEventListener('change', () => {
            document
              .querySelectorAll('.radio-option')
              .forEach((el) => el.classList.remove('selected'));
            (radio.parentElement as HTMLElement).classList.add('selected');
          });
        });
      },
      preConfirm: () => {
        const selected = (document.querySelector(
          'input[name="searchType"]:checked'
        ) as HTMLInputElement)?.value;
        if (!selected) {
          Swal.showValidationMessage('Please select a search type');
          return false;
        }
        return selected;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.selectedType = result.value;
        this.onSearchReference();
      }
    });
  }

  generateSearchOptionsHTML(): string {
    return this.searchOptions
      .map(
        (opt) => `
      <div class="radio-option">
        <label>
          <input type="radio" name="searchType" value="${opt.key}">
          ${opt.label}
          <span class="tick-mark">✔</span>
        </label>
      </div>`
      )
      .join('');
  }

  onSearchTypeChange(): void {
    // Reset data when search type changes
    this.searchReference = '';
    this.searchOptionsList = [];
    this.showForm = false;
    console.log('🔄 Search type changed. Data reset.');
  }

  onSearchReference() {
    if (!this.searchReference?.trim()) {
      Swal.fire('Please enter a value', '', 'warning');
      return;
    }

    if (!this.selectedType) {
      Swal.fire('Please select a search type', '', 'info');
      return;
    }
    let payload1: any = {
     
    "global": "ORDER INFO",
    "data": {
        "ref_no": "",
        "inv_no": "",
        "so_no": "",
        "transporter": "",
        "lr_no": "",
        "workorder_no": "",
        "sales_person": "",
        "location": "",
        "odn_no": "",
        "vehicle_no": "",
        "freight_billno": "",
        "nature_damage": "",
        "claim_status": ""
   
    }
    };
    payload1.data[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload1:', payload1);
    this.spinner.show();
    this.service.global_Fields_SearchOption(payload1).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          console.log('✅ Search Response:', res);
          if (res.NUMBER == "100" && res.STATUS == "FALSE") {
            this.searchOptionsList = [];
           
           
            Swal.fire('', res.MESSAGE, 'warning');
          } else {
            Swal.fire('No records found', '', 'info');
             this.searchOptionsList = res.HEADER;
            this.showForm = false;
           
            Swal.fire('Data fetched successfully!', '', 'success');
          }
        },
        error: (err) => {
          this.spinner.hide();
          console.error('❌ Error:', err);
          Swal.fire('Error fetching data', '', 'error');
        }
      });
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  selectSearchType(option: any) {
    this.selectedType = option;
    this.dropdownOpen = false;
  } 
}