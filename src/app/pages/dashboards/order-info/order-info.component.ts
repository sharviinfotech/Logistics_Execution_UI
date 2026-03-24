import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { SharedModule } from '../saas/shared/shared.module';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-order-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, NgSelectModule],
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
  mainMode: string = 'creation';
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
  pendingCount: number = 0;
  completedCount: number = 0;

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
  // Filter mode properties
  filterFromDate: string = '';
  filterToDate: string = '';
  filterPlant: string = '';
  filterDivision: string = '';
  filterTransporter: string = '';
  filterVehicleType: string = '';
  filterStatus: string = '';
  filteredData: any[] = [];
  filterApplied: boolean = false;
  isUpdateMode: boolean;
  searchValue: string;
  VendorCodeList: any[] = [];
  orderInfoData: any[] = [];
  dispatchData: any[] = [];
   loggedInUser: string = '';
   filteredDivisions:any[]=[];
 

  filterSapType: string = '';
  showOrderInfoTable = false;
  showDispatchTable = false;
  formArray: any;
 

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,
    private router: Router,
    private cd: ChangeDetectorRef
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
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
this.loggedInUser = userData.USER || '';
console.log("Logged in user:", this.loggedInUser);
   this.plantList = userData.PLANTS || [];

  // ✅ Divisions from login response
  this.divisionList = userData.DIV || [];

  console.log("Plants:", this.plantList);
  console.log("Divisions:", this.divisionList);




    // this.fetchCustomers();  //Due to 404 error pradeep comment this line this one cant use in this screen any where
    this.fetchTransporter();
  }

  // Main mode change handler
  onMainModeChange(): void {
    // Reset everything when switching modes
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isUpdateMode = false;

    // Reset filter values
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filterSapType = '';
    this.filteredData = [];
    this.filterApplied = false;

    // Reset search values
    this.selectedType = '';
    this.searchValue = '';


    if (this.mainMode === 'filter') {
      this.fetchpdb();
    }

    this.cd.detectChanges();
  }


  createItemRow(): FormGroup {
    return this.fb.group({
      referenceNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      lineNumber: ['']
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

  editRow(row: any) {
    row._backup = { ...row }; 
    row.isEdit = true;
  }

  cancelEdit(row: any) {
    Object.assign(row, row._backup);
    row.isEdit = false;
    delete row._backup;
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

  // onPlantChange(): void {
  //   const selectedPlant = this.OrderInfo.get('Plant')?.value;
  //   console.log("🌱 Plant selected:", selectedPlant);

  //   // Only fetch division for Non-SAP mode
  //   if (!this.isSap() && selectedPlant) {
  //     // Find the selected plant object from plantList
  //     const plantObj = this.plantList?.find(
  //       (p: any) => p.PLANT_DESC === selectedPlant
  //     );

  //     if (plantObj && plantObj.PLANT) {
  //       const payload = {
  //         WERKS: plantObj.PLANT
  //       };

  //       console.log("📤 Fetching division for plant code:", plantObj.PLANT);
  //       this.spinner.show();

  //       this.service.PlantBasedDivison(payload).subscribe(
  //         (res: any) => {
  //           console.log("✅ Division Response:", res);
  //           this.spinner.hide();

  //           if (res && res.DIVISION) {
  //             // Find matching division from divisionList
  //             const divisionObj = this.divisionList?.find(
  //               (d: any) => d.DIVISION === res.DIVISION
  //             );

  //             if (divisionObj) {
  //               // Set the full division description (same as dropdown shows)
  //               this.OrderInfo.patchValue({
  //                 Division: divisionObj.DIVISION_DESC
  //               });
  //               console.log("✅ Division set to:", divisionObj.DIVISION_DESC);
  //             } else {
  //               // Fallback: set just the division code if no match found
  //               this.OrderInfo.patchValue({
  //                 Division: res.DIVISION
  //               });
  //               console.log("⚠️ Division set to code:", res.DIVISION);
  //             }
  //           } else {
  //             console.warn("⚠️ No DIVISION in response");
  //           }
  //         },
  //         (error) => {
  //           console.error("❌ Error fetching division:", error);
  //           this.spinner.hide();
  //           Swal.fire({
  //             icon: 'error',
  //             title: 'Error',
  //             text: 'Failed to fetch division for selected plant',
  //             timer: 2000
  //           });
  //         }
  //       );
  //     } else {
  //       console.warn("⚠️ Plant object not found for:", selectedPlant);
  //       // Clear division if plant is invalid
  //       this.OrderInfo.patchValue({
  //         Division: ''
  //       });
  //     }
  //   } else {
  //     console.log("ℹ️ Skipping division fetch - SAP mode or no plant selected");
  //   }
  // }


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
    this.selectedType = '';
    this.searchValue = '';
    this.searchReference = '';      
    this.searchOptionsList = [];


    this.previousSapType = this.sapType;
    this.setConditionalValidators();
    if (this.orderType === 'Outward' && this.sapType) {
      this.fetchPendingAndCompletedCounts();
    }


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
      const ZDATA = this.selectedItems.map(item => ({
      ZREFNO: item.referenceNumber,
      LINENO: item.lineNumber
    }));
    const obj = { VBELN: this.invoicenumber,ZDATA: ZDATA};

    this.spinner.show();
    this.service.OrderinfoOutward(obj).subscribe(
      (res: any) => {
        console.log("✅ SAP Fetch Response:", res);

        if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
          Swal.fire('Success', 'Invoice details loaded', 'success');
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
      DCReference: data.INV_VBELN || '',
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

    const formValue = this.OrderInfo.getRawValue();

    const record = selectedRows.map(row => ({
      REF_NO: row.referenceNumber || "",
      WORK_ORDER_NO: row.workOrderNumber || "",
      LR_NO: row.lrNumber || "",
      TRANSPORTER: row.transporter || "",
      LINE_NO: row.lineNumber || "",
      INV_VBELN: this.isSap() ? formValue.TaxInvoice : formValue.DCReference,
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
      DEST_ZONE: formValue.DestinationZone,
      ZUSER: this.loggedInUser,
      ZUSER_CH:'',
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
                this.resetConditionalFields();
                this.OrderInfo.reset();
                this.items.clear();
                this.items.push(this.createItemRow());
                this.selectedItems = [];
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
                this.resetConditionalFields();
                this.OrderInfo.reset();
                this.items.clear();
                this.items.push(this.createItemRow());
                this.selectedItems = [];
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






  // Method to enable edit mode for a row
  editSearchRow(row: any): void {
    // Backup original data
    row._backup = { ...row };
    row.isEdit = true;
  }

  cancelSearchEdit(row: any): void {
    if (row._backup) {
      Object.assign(row, row._backup); // Restore original values
      delete row._backup;
    }
    row.isEdit = false;
  }



  updateSearchRow(row: any, index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;


      const updatePayload = {
        REF_NO: row.ZREFNO || "",
        WORK_ORDER_NO: row.ZWORK_ORDER || "",
        LR_NO: row.ZLRNO || "",
        TRANSPORTER: row.ZTRANSPORTER || "",
        INV_VBELN: row.ZINV_NO || "",
        INV_ODNO: row.ZODN_NO || "",
        INV_DATE: row.ZINV_DATE || "",
        BASIC_SHIP_VALUE: row.ZBASIC_VALUE || "",
        INV_VALUE_GST: row.ZINV_VALUE_GST || "",
        PHYS_DISPATCH: row.ZPHY_DISPATCH || "",
        FISCAL_YEAR: row.ZFYEAR || "",
        FISCAL_QUARTER: row.ZFIS_QUARTER || "",
        MONTH: row.ZFIS_MONTH || "",
        PLANT_NAME: row.ZPLANT || "",
        TRAN_TYPE: row.ZTRX_TYPE || "",
        TRAN_TEXT_BILL: row.ZBILL_TRX_TEXT || "",
        DIVISION: row.ZDIVISION || "",
        SUB_DIVISION: row.ZSUB_DIVISION || "",
        SO_REF_NO: row.ZSO_NO || "",
        CUST_NAME: row.ZCUST_NAME || "",
        LINE_NO: row.ZLINE_NO || "",
        CUST_GROUP: row.ZCUST_GRP || "",
        CNEE_NAME: row.ZCONSIGN_NAME || "",
        DEST_LOC: row.ZDES_LOC || "",
        DEST_STATE: row.ZSTATE || "",
        DEST_ZONE: row.ZZONE || "",
        ZUSER: row.ZUSER,
        ZUSER_CH: this.loggedInUser
      };

      console.log("🛠 UPDATE RECORD:", updatePayload);

      this.spinner.show();


      let apiCall =
        this.sapType === "SAP"
          ? this.service.OrderInfoOutwardSave({
            SAVE: [updatePayload]
          })
          : this.service.OrderInfoNonSap({
            CREATE: [updatePayload]
          });

      apiCall.subscribe(
        (res: any) => {
          this.spinner.hide();

          if (res.STATUS === 'true' || res.NUMBER === '200') {
            Swal.fire({
              title: 'Success',
              text: res.MESSAGE || 'Record updated successfully',
              icon: 'success',
              confirmButtonText: 'Ok',
            }).then(() => {
              row.isEdit = false;
              delete row._backup;
              this.onSearchReference();
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: res.MESSAGE || 'Failed to update record',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          }
        },
        (error) => {
          this.spinner.hide();
          console.error('❌ Update Error:', error);
          Swal.fire({
            text: 'Internal Server Error. Please try again later.',
            icon: 'error',
          });
        }
      );
    });
  }

  deleteRow(row: any, index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this record? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 🔹 Prepare request payload
      const payload = {
        DELETE: [
          {
            ZREFNO: row.ZREFNO,
            ZINV_NO: row.ZINV_NO,
            ZLINE_NO: row.ZLINE_NO
          }
        ]
      };

      // 🔹 Choose API based on sapType
      const apiCall = this.sapType === 'SAP'
        ? this.service.OrderInfoDeleteWithSap(payload)
        : this.service.OrderInfoDeleteWithoutSap(payload);

      // 🔹 Call API
      apiCall.subscribe({
        next: (res: any) => {
          if (res?.STATUS === 'TRUE' || res?.STATUS === true) {
            // 🔹 Remove row from table only after success
            this.searchOptionsList.splice(index, 1);

            Swal.fire({
              title: 'Deleted',
              text: res.MESSAGE || 'Record deleted successfully',
              icon: 'success',
              confirmButtonText: 'Ok'
            });
          } else {
            Swal.fire({
              title: 'Failed',
              text: res?.MESSAGE || 'Delete failed',
              icon: 'error'
            });
          }
        },
        error: (err) => {
          console.error('Delete Error:', err);
          Swal.fire({
            title: 'Error',
            text: err?.error?.MESSAGE || 'Something went wrong while deleting',
            icon: 'error'
          });
        }
      });
    });
  }


  // deleteRow(row: any, index: number): void {
  //   if (row.sapType === 'SAP') {
  //     this.DeleteWithSap(row, index);
  //   } else {
  //     this.DeleteWithoutSap(row, index);
  //   }
  // }

  // DeleteWithSap(row: any, index: number): void {
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: 'Do you want to delete this record? This action cannot be undone.',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, Delete',
  //     cancelButtonText: 'Cancel',
  //     confirmButtonColor: '#d33'
  //   }).then((result) => {
  //     if (!result.isConfirmed) return;


  //     const payload = {
  //       DELETE: [
  //         {
  //           ZREFNO: row.ZREFNO,
  //           ZINV_NO: row.ZINV_NO,
  //           ZLINE_NO: row.ZLINE_NO
  //         }
  //       ]
  //     };

  //     // 🔹 Call API
  //     this.service.OrderInfoDeleteWithSap(payload).subscribe({
  //       next: (res: any) => {
  //         if (res?.STATUS === 'TRUE') {

  //           this.searchOptionsList.splice(index, 1);

  //           Swal.fire({
  //             title: 'Deleted',
  //             text: res.MESSAGE || 'Record deleted successfully',
  //             icon: 'success',
  //             confirmButtonText: 'Ok'
  //           });
  //         } else {
  //           Swal.fire({
  //             title: 'Failed',
  //             text: res?.MESSAGE || 'Delete failed',
  //             icon: 'error'
  //           });
  //         }
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         Swal.fire({
  //           title: 'Error',
  //           text: 'Something went wrong while deleting',
  //           icon: 'error'
  //         });
  //       }
  //     });
  //   });
  // }
  // DeleteWithoutSap(row: any, index: number): void {
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: 'Do you want to delete this record? This action cannot be undone.',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, Delete',
  //     cancelButtonText: 'Cancel',
  //     confirmButtonColor: '#d33'
  //   }).then((result) => {
  //     if (!result.isConfirmed) return;


  //     const payload = {
  //       DELETE: [
  //         {
  //           ZREFNO: row.ZREFNO,
  //           ZINV_NO: row.ZINV_NO,
  //           ZLINE_NO: row.ZLINE_NO
  //         }
  //       ]
  //     };


  //     this.service.OrderInfoDeleteWithoutSap(payload).subscribe({
  //       next: (res: any) => {
  //         if (res?.STATUS === 'TRUE') {

  //           this.searchOptionsList.splice(index, 1);

  //           Swal.fire({
  //             title: 'Deleted',
  //             text: res.MESSAGE || 'Record deleted successfully',
  //             icon: 'success',
  //             confirmButtonText: 'Ok'
  //           });
  //         } else {
  //           Swal.fire({
  //             title: 'Failed',
  //             text: res?.MESSAGE || 'Delete failed',
  //             icon: 'error'
  //           });
  //         }
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         Swal.fire({
  //           title: 'Error',
  //           text: 'Something went wrong while deleting',
  //           icon: 'error'
  //         });
  //       }
  //     });
  //   });
  // }




  // Convert from other formats if needed

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

      // ❌ Remove these
      // this.plantList = res[0].PLANT;
      // this.divisionList = res[0].DIVISION;

      // ✅ Keep other dropdowns
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
  // fetchpdb(): void {
  //   this.spinner.show();
  //   this.service.getpdb().subscribe(
  //     (res: any) => {
  //       console.log("📦 PDB Data:", res);
  //       this.plantList = res[0].PLANT;
  //       this.divisionList = res[0].DIVISION;
  //       this.billintypeList = res[0].BILLING_TYPE;
  //       this.customerList = res[0].CUSTOMER || [];
  //       this.statesList = res[0].STATES;
  //       this.spinner.hide();
  //     },
  //     error => {
  //       console.error("❌ PDB Fetch Error:", error);
  //       this.spinner.hide();
  //     }
  //   );
  // }
  //Due to 404 error pradeep comment this line this one cant use in this screen any where
  // fetchCustomers(): void {
  //   this.spinner.show();
  //   this.service.getAllCustomerList().subscribe(
  //     (res: any) => {
  //       console.log('📥 Customer list fetched:', res);
  //       // normalize to expected structure if needed
  //       this.customerList = Array.isArray(res) ? res : (res?.data || []);
  //       this.spinner.hide();
  //     },
  //     (error) => {
  //       console.error('❌ Customer fetch error:', error);
  //       this.spinner.hide();
  //     }
  //   );
  // }

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

    if (!this.items || this.items.length === 0) return;
    if (index !== 0) return;

    const firstRow = this.items.at(0) as FormGroup;
    const values = firstRow.value || {};

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
      global_scr: 'ORDER INFO',
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : '',
      LINE_NO: values.lineNumber || '',
      ZUSER: this.loggedInUser
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();

    let apiCall;

    // 🎯 CONDITION BASED API CALL
    if (this.sapType === 'SAP') {
      apiCall = this.service.GlobalReferenceNoFetch(obj); // POST
    } else {
      apiCall = this.service.GlobalReferenceNoFetchwithoutsap(obj); // PUT
    }

    apiCall.subscribe({
      next: (res: any) => {
        console.log('✅ Response:', res);
        this.spinner.hide();
        this.populateRows(res);
      },
      error: err => {
        console.error('❌ Error:', err);
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
            transporter: [d.TRANSPORTER || ''],
            lineNumber: [d.LINE_NO || '']
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

  removeRow(index: number): void {
    const rowValue = (this.items.at(index) as FormGroup).value;
    this.items.removeAt(index);

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
        "ZUSER": this.loggedInUser,
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
        "claim_status": "",

      }
    };
    payload1.data[this.selectedType] = this.searchReference.trim();

    console.log('🔍 Payload1:', payload1);
    console.log('🔍 SAP Type:', this.sapType);
    this.spinner.show();
    let apiCall;

    if (this.sapType === 'SAP') {
      apiCall = this.service.global_Fields_SearchOption(payload1); // POST
    } else {
      apiCall = this.service.global_Fields_SearchOption_WithoutSap(payload1); // PUT
    }

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();
        console.log('✅ Search Response:', res);

        if (res.NUMBER === '100' && res.STATUS === 'FALSE') {
          this.searchOptionsList = [];
          Swal.fire('', res.MESSAGE, 'warning');
        } else if (!res.HEADER || res.HEADER.length === 0) {
          this.searchOptionsList = [];
          Swal.fire('No records found', '', 'info');
        } else {
          this.searchOptionsList = res.HEADER.map((item: any) => ({
            ...item,
            isEdit: false
          }));

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

  // onFilterPlantChange(): void {
  //   if (!this.filterPlant) {
  //     this.filterDivision = '';
  //     return;
  //   }

  //   const plantObj = this.plantList?.find(
  //     (p: any) => p.PLANT_DESC === this.filterPlant
  //   );

  //   if (plantObj?.PLANT) {
  //     const payload = { WERKS: plantObj.PLANT };

  //     this.spinner.show();
  //     this.service.PlantBasedDivison(payload).subscribe(

  //       (res: any) => {
  //         this.spinner.hide();
  //         if (res?.DIVISION) {
  //           console.log("✅ Filter Division Response:", res);
  //           const divisionObj = this.divisionList?.find(
  //             (d: any) => d.DIVISION === res.DIVISION
  //           );
  //           this.filterDivision = divisionObj
  //             ? divisionObj.DIVISION_DESC
  //             : res.DIVISION;

  //           console.log("✅ Filter Division set to:", this.filterDivision);
  //         }
  //       },
  //       (error) => {
  //         console.error("❌ Error fetching division for filter:", error);
  //         this.spinner.hide();
  //       }
  //     );
  //   }
  // }





  fetchTransporter(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res && res.length > 0 && res[0].VEND_CODE) {
          console.log("✅ Transporter Data Fetched:", res[0].VEND_CODE);

          // ONLY transporter list
          this.VendorCodeList = res[0].VEND_CODE;

          this.spinner.hide();
        } else {
          Swal.fire("No Transporter Found", "", "warning");
          this.spinner.hide();
        }
      },
      error => {
        console.error("❌ Transporter Fetch Error:", error);
        this.spinner.hide();
      }
    );
  }

  onFilterDivisionChange(): void {
    const code = this.filterDivision;
    console.log("Filter Division selected:", code);
  }

  onFilterSapTypeChange(): void {

    // Reset filters
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';


    this.orderInfoData = [];
    this.dispatchData = [];


    this.filterApplied = false;

    this.cd.detectChanges();
  }

  applyFilter() {
    if (!this.filterFromDate || !this.filterToDate) {
      Swal.fire('Warning', 'Please select From Date and To Date', 'warning');
      return;
    }

    this.filterApplied = false;

    const payload = {
      GLOBAL: 'ORDER INFO',
      ZUSER: this.loggedInUser,
      DATE_FROM: this.filterFromDate,
      DATE_TO: this.filterToDate,
      PLANT: this.filterPlant || '',
      DIVISION: this.filterDivision || '',
      TRANSPORTER: this.filterTransporter || '',
      VEHICLE_TYPE: this.filterVehicleType || '',
      STATUS: this.filterStatus || ''
    };

    this.spinner.show();

    let apiCall;

    // if (this.filterSapType === 'SAP') {
    //   apiCall = this.service.fetchOrderInfoFiltered(payload); 
    // } else {

    //   apiCall = this.service.fetchGlobalFilteredNonSap(payload);
    // }

    if (this.filterSapType === 'SAP') {
      apiCall = this.service.fetchOrderInfoFiltered(payload);
    } else if (this.filterSapType === 'Non-SAP') {
      apiCall = this.service.fetchGlobalFilteredNonSap(payload);
    } else {
      this.spinner.hide();
      Swal.fire('Error', 'Invalid SAP Type selected', 'error');
      return;
    }

    apiCall.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        let records: any[] = [];
        if (Array.isArray(res)) records = res;
        else if (res?.HEADER) records = res.HEADER;
        else if (res?.DATA) records = res.DATA;

        this.filterApplied = true;

        if (this.filterStatus === 'Completed') {
          this.orderInfoData = records;
          this.dispatchData = [];
          Swal.fire('Success', `Order Info records: ${records.length}`, 'success');
        } else if (this.filterStatus === 'Pending') {
          this.dispatchData = records;
          this.orderInfoData = [];
          Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
        } else {
          this.orderInfoData = [];
          this.dispatchData = [];
          Swal.fire('Info', 'Please select valid status', 'info');
        }
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to fetch filtered data', 'error');
        console.error(err);
      }
    });
  }



  clearFilter() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filteredData = [];
    this.filterApplied = false;

  }

  downloadExcel() {
    // 1️⃣ Determine data source based on status
    let exportSource: any[] = [];
    let fileName = '';

    if (this.filterStatus === 'Completed') {
      exportSource = this.orderInfoData;
      fileName = this.sapType === 'SAP' ? 'Order_Info_Completed_SAP.xlsx' : 'Order_Info_Completed_NonSAP.xlsx';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP' ? 'Dispatch_Pending_SAP.xlsx' : 'Dispatch_Pending_NonSAP.xlsx';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ Check if data is available
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    // 3️⃣ Map data for Excel
    let exportData: any[] = [];

    if (this.filterStatus === 'Completed') {
      exportData = exportSource.map(record => ({
        'Reference No': record.ZREFNO || '',
        'Invoice No': record.ZINV_NO || '',
        'Line No': record.ZLINE_NO || '',
        'ODN No': record.ZODN_NO || '',

        'Invoice Date': record.ZINV_DATE ? new Date(record.ZINV_DATE).toLocaleDateString('en-GB') : '',
        'Basic Value': record.ZBASIC_VALUE || '',
        'Invoice Value (GST)': record.ZINV_VALUE_GST || '',
        'Physical Dispatch': record.ZPHY_DISPATCH || '',
        'Fiscal Year': record.ZFYEAR || '',
        'Fiscal Quarter': record.ZFIS_QUARTER || '',
        'Fiscal Month': record.ZFIS_MONTH || '',
        'Plant': record.ZPLANT || '',
        'Transaction Type': record.ZTRX_TYPE || '',
        'Billing Text': record.ZBILL_TRX_TEXT || '',
        'Division': record.ZDIVISION || '',
        'Sub Division': record.ZSUB_DIVISION || '',
        'SO Ref No': record.ZSO_NO || '',
        'Customer Name': record.ZCUST_NAME || '',
        'Customer Group': record.ZCUST_GRP || '',
        'Consignee Name': record.ZCONSIGN_NAME || '',
        'Destination Location': record.ZDES_LOC || '',
        'State': record.ZSTATE || '',
        'Zone': record.ZZONE || '',
        'Work Order': record.ZWORK_ORDER || '',
        'LR No': record.ZLRNO || '',
        'Transporter': record.ZTRANSPORTER || '',
        'Vehicle Type': record.ZVEH_TYPE || '',
        'Created Date': record.ZCREATED_DT || ''
      }));
    } else if (this.filterStatus === 'Pending') {
      exportData = exportSource.map(record => ({
        'Reference No': record.ZREFNO || '',
        'Line No': record.ZLINE_NO || '',
        'Date': record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        'Plant': record.ZWERKS || '',
        'Division': record.ZDIVISION || '',
        'Vehicle Type': record.ZVEH_TYPE || '',
        'No. of Trucks': record.ZNO_TRUCKS || '',
        'Work Order': record.ZWORK_ORDER || '',
        'Vendor Code': record.ZVENDOR_CD || '',
        'Transporter': record.ZTRANSPORTER || '',
        'No. of LRs': record.ZNO_LRS || '',
        'LR Number': record.ZLR_NO || '',
        'Loading Point': record.ZLOAD_PT || '',
        'Unloading Point': record.ZUNLOAD_PT || '',
        'No Of Invoices': record.ZNO_INVOICES || ''
      }));
    }

    // 4️⃣ Create Excel sheet and workbook
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');

    // 5️⃣ Set auto column width
    const colWidths = Object.keys(exportData[0]).map(key => ({ wch: Math.max(key.length + 5, 18) }));
    ws['!cols'] = colWidths;

    // 6️⃣ Write file
    XLSX.writeFile(wb, fileName);

    Swal.fire('Success', `Excel file downloaded: ${fileName}`, 'success');
  }

  downloadPDF() {
    // 1️⃣ Determine data source based on status
    let exportSource: any[] = [];
    let fileName = '';
    let reportTitle = '';

    if (this.filterStatus === 'Completed') {
      exportSource = this.orderInfoData;
      fileName = this.sapType === 'SAP' ? 'Order_Info_Completed_SAP.pdf' : 'Order_Info_Completed_NonSAP.pdf';
      reportTitle = 'Order Info Records (Completed)';
    } else if (this.filterStatus === 'Pending') {
      exportSource = this.dispatchData;
      fileName = this.sapType === 'SAP' ? 'Dispatch_Pending_SAP.pdf' : 'Dispatch_Pending_NonSAP.pdf';
      reportTitle = 'Dispatch Records (Pending)';
    } else {
      Swal.fire('Warning', 'Please select valid status before download', 'warning');
      return;
    }

    // 2️⃣ Check if data is available
    if (!exportSource || exportSource.length === 0) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }

    const doc = new (jsPDF as any).default({
      orientation: 'landscape',
      unit: 'mm',
      format: [420, 297] // ✅ A2 Landscape (WIDE)
    });



    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, {
      align: 'center'
    });


    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      18,
      { align: 'center' }
    );

    let headers: any[] = [];
    let data: any[] = [];

    // 3️⃣ Generate headers and data based on status
    if (this.filterStatus === 'Completed') {
      headers = [[
        'SI.No',
        'REFNO',
        'Invoice No',
        'Line No',
        'ODN No',
        'Invoice Date',
        'Basic Value',
        'Invoice Value (GST)',
        'Physical Dispatch',
        'Fiscal Year',
        'System Date',
        'Fiscal Quarter',
        'Fiscal Month',
        'Plant',
        'Transaction Type',
        'Bill Text',
        'Division',
        'Sub Division',
        'SO Ref No',
        'Customer Name',
        'Customer Group',
        'Consignee Name',
        'Destination Location',
        'State',
        'Zone',
        'Work Order',
        'LR No',
        'Transporter',
        'Created date',
        'Vehicle Type'
      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.ZINV_NO || '',
        record.ZLINE_NO || '',
        record.ZODN_NO || '',
        record.ZINV_DATE ? new Date(record.ZINV_DATE).toLocaleDateString('en-GB') : '',
        record.ZBASIC_VALUE || '',
        record.ZINV_VALUE_GST || '',
        record.ZPHY_DISPATCH || '',
        record.ZFYEAR || '',
        record.ZSYS_DATE ? new Date(record.ZSYS_DATE).toLocaleDateString('en-GB') : '',
        record.ZFIS_QUARTER || '',
        record.ZFIS_MONTH || '',
        record.ZPLANT || '',
        record.ZTRX_TYPE || '',
        record.ZBILL_TRX_TEXT || '',
        record.ZDIVISION || '',
        record.ZSUB_DIVISION || '',
        record.ZSO_NO || '',
        record.ZCUST_NAME || '',
        record.ZCUST_GRP || '',
        record.ZCONSIGN_NAME || '',
        record.ZDES_LOC || '',
        record.ZSTATE || '',
        record.ZZONE || '',
        record.ZWORK_ORDER || '',
        record.ZLRNO || '',
        record.ZTRANSPORTER || '',
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        record.ZVEH_TYPE || ''
      ]));
    } else if (this.filterStatus === 'Pending') {
      headers = [[
        'SI.No',
        'Reference No',
        'Line No',
        'Date',
        'Plant',
        'Division',
        'Vehicle Type',
        'No. of Trucks',
        'Work Order',
        'Vendor Code',
        'Transporter',
        'No. of LRs',
        'LR Number',
        'Loading Point',
        'Unloading Point',
        'No Of Invoices'
      ]];

      data = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || '',
        record.ZLINE_NO || '',
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString('en-GB') : '',
        record.ZWERKS || '',
        record.ZDIVISION || '',
        record.ZVEH_TYPE || '',
        record.ZNO_TRUCKS || '',
        record.ZWORK_ORDER || '',
        record.ZVENDOR_CD || '',
        record.ZTRANSPORTER || '',
        record.ZNO_LRS || '',
        record.ZLR_NO || '',
        record.ZLOAD_PT || '',
        record.ZUNLOAD_PT || '',
        record.ZNO_INVOICES || ''
      ]));
    }

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: {
        fontSize: 6,
        cellPadding: 1.5
      },
      headStyles: {
        fillColor: [52, 152, 219],
        fontStyle: 'bold',
        fontSize: 6
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      // columnStyles: {
      //   0: { cellWidth: 8 },  
      //   1: { cellWidth: 12 }, 
      //   2: { cellWidth: 12 }, 
      //   3: { cellWidth: 10 }, 
      //   4: { cellWidth: 12 }, 
      // },
      theme: 'grid'
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  }
  fetchPendingAndCompletedCounts() {
    const payload = {
      INOUT: 'OUTWARD',
      TRANS_TYPE: this.sapType === 'SAP' ? 'WITHSAP' : 'WITHOUTSAP',
      SCREEN: 'ORDER INFO'
    };

    this.service.OutwardCountGlobalWithSap(payload).subscribe(
      (response: any) => {
        this.pendingCount = response.ZPEND_CNT || 0;
        this.completedCount = response.ZCONF_CNT || 0;
      },
      (error) => {
        console.error('Error fetching counts:', error);
        this.pendingCount = 0;
        this.completedCount = 0;

      }
    );
  }

  refreshScreen() {


    // Reset order type and SAP type
    this.orderType = '';
    this.sapType = '';
    this.showForm = false;
    this.isUpdateMode = false;
    this.isEditMode = false;
    this.isProcessing = false;

    // Reset previous state trackers
    this.previousOrderType = null;
    this.previousSapType = null;

    // Reset invoice/PO numbers
    this.ponumber = '';
    this.invoicenumber = '';

    // Reset search fields
    this.searchReference = '';
    this.selectedType = '';
    this.searchValue = '';
    this.searchOptionsList = [];
    this.dropdownOpen = false;

    // Reset table display flags
    this.showOrderInfoTable = false;
    this.showDispatchTable = false;

    // Reset filter fields
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPlant = '';
    this.filterDivision = '';
    this.filterTransporter = '';
    this.filterSapType = '';
    this.filterVehicleType = '';
    this.filterStatus = '';
    this.filteredData = [];
    this.filterApplied = false;

    // Reset data arrays
    this.orderInfoData = [];
    this.dispatchData = [];
    this.selectedItems = [];

    // Reset customer/fiscal fields
    this.customerGroup = '';
    this.showFiscalFields = false;

    // Reset counts
    this.pendingCount = 0;
    this.completedCount = 0;

    // Reset Order Info Form
    this.OrderInfo.reset(this.initialFormValues);

    // Clear and reset the items FormArray to have one empty row
    this.items.clear();
    this.items.push(this.createItemRow());





    // Show success message
    Swal.fire({
      text: 'Screen refreshed successfully',
      icon: 'success',
      confirmButtonText: 'Ok',
      timer: 4000,

    });

    // Trigger change detection
    this.cd.detectChanges();
  }






}