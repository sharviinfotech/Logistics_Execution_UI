import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NumberToWordsService } from 'src/app/number-to-words.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ImageService } from 'src/app/image.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select';
import { object } from '@amcharts/amcharts5';
interface TaxItem {
  description: string;
  percentage: number;
  amount: number;
}
interface ChargeItem {
  description: string;
  units?: string | null;  // Adding 'units' property
  rate: number;
  amount: number;
}
interface Customer {
  _id: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  customerGstNo: string;
  customerPanNo: string;
}


@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BsDatepickerModule, NgxSpinnerModule, NgSelectModule],
  standalone: true
})
export class InvoiceComponent implements OnInit {
  statesList: any[] = [];
  allCharges: any[] = [];
  newInvoiceCreation!: FormGroup;
  showNewInvoice = false;
  panForm: FormGroup;
  isDropdownOpen = false;
  selectedInvoiceType: string | null = null;
  // selectedInvoiceType: string = '';
  activeTab: string = 'AllInvoice'; // Change this based on tab logic

  logoUrl: string | null = null;
  InvoiceLogo: string | null = null;
  isHoveringLogo: boolean = false;
  isHoveringRemove: boolean = false;
  StateName: string = '';
  showCGST_SGST = false;
  customerList: any[] = [];
  editRowGLobal: any;
  //    toTitleCase(str: string): string {
  //   return str
  //     .toLowerCase()
  //     .split(' ')
  //     .map(word => word.charAt(0) + word.slice(1))
  //     .join(' ');
  // }

  toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  showIGST = false;
  proformaCardHeaderName: any;
  proformaCardHeaderId: null;
  reviewedFlag: boolean;
  PQList: any;
  pqSameforTAX: number;
  selectedPQUniqueId: any;
  submited: boolean = false;
  rePQStatus: any;
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;

  }
  onAddCustomer(newTag: string) {
    const formatted = this.toTitleCase(newTag.trim());

    // Optional: Avoid duplicate entries
    if (!this.customerList.some(c => c.customerName === formatted)) {
      this.customerList.push({ customerName: formatted });
    }

    this.newInvoiceCreation.get('ProformaCustomerName')?.setValue(formatted);
  }

  selectInvoiceType(type) {
    this.resetAll()
    this.submited = false
    this.proformaCardHeaderId = null
    this.proformaCardHeaderName = null
    this.proformaCardHeaderId = type
    this.selectedPQUniqueId = 0
    if (this.proformaCardHeaderId == "PQ") {
      this.proformaCardHeaderName = "Proforma Invoice"
    } else {
      this.proformaCardHeaderName = "Tax Invoice"



    }
    this.activeTab = "NewInvoice";
    this.isDropdownOpen = false
    console.log("this.proformaCardHeaderId", this.proformaCardHeaderId, this.proformaCardHeaderName)
    // Update validation dynamically
    this.PQList = []
    if (this.proformaCardHeaderName === "Tax Invoice") {
      this.newInvoiceCreation.controls['PQInvoiceNumber'].setValidators(Validators.required);
      this.PQList = this.allInvoiceList.filter(invoice => invoice.pqStatus === "inComplete" && invoice.status === "Approved");
      console.log('this.PQList', this.PQList)

    } else {
      this.newInvoiceCreation.controls['PQInvoiceNumber'].clearValidators();
    }

    this.newInvoiceCreation.controls['PQInvoiceNumber'].updateValueAndValidity();

  }

  onCustomerSelectChange(selectedCustomer: Customer | string | null) {
    if (selectedCustomer) {
      if (typeof selectedCustomer === 'object' && '_id' in selectedCustomer) {
        console.log("Existing Customer Selected:", selectedCustomer);
        this.newInvoiceCreation.patchValue({
          ProformaCustomerName: selectedCustomer.customerName,
          ProformaAddress: selectedCustomer.customerAddress,
          ProformaCity: selectedCustomer.customerCity,
          ProformaState: selectedCustomer.customerState, // Patch state first
          ProformaPincode: selectedCustomer.customerPincode,
          ProformaGstNo: selectedCustomer.customerGstNo,
          ProformaPanNO: selectedCustomer.customerPanNo,
        });
        setTimeout(() => {
          this.onChangeState(); // Call onChangeState after patching the state
        }, 0);
        console.log("this.newInvoiceCreation", this.newInvoiceCreation.value, this.newInvoiceCreation.value.ProformaState)
      } else if (typeof selectedCustomer === 'string') {
        console.log("Manual Entry:", selectedCustomer);
        this.newInvoiceCreation.patchValue({
          ProformaCustomerName: selectedCustomer,
        });
        this.clearOtherCustomerFields();
      } else {
        console.log("Unknown Selection:", selectedCustomer);
        this.clearOtherCustomerFields();
      }
    } else {
      console.log("Selection Cleared");
      this.clearOtherCustomerFields();
    }
  }
  onSelectProformaNumber(event: any) {
    this.selectedPQUniqueId = 0
    this.pqSameforTAX = 0
    console.log("onSelectProformaNumber event", event);
    var extractedNumber
    // Extract numeric part from invoiceUniqueNumber
    if (event?.invoiceUniqueNumber) {
      const match = event.invoiceUniqueNumber.match(/PQ-(\d+)\//);
      extractedNumber = match ? parseInt(match[1], 10) : null;


    }
    console.log("Extracted Number:", extractedNumber);
    this.pqSameforTAX = extractedNumber,
      this.selectedPQUniqueId = event.originalUniqueId
    this.pathPQDataToTAX(event);
  }



  clearOtherCustomerFields() {
    this.newInvoiceCreation.patchValue({
      ProformaAddress: '',
      ProformaCity: '',
      ProformaState: '',
      ProformaPincode: '',
      ProformaGstNo: '',
      ProformaPanNO: ''
    });
  }







  hoveredIndex: number = -1;
  // chargeItems: ChargeItem[] = [
  //   {
  //     description: 'HYDERABAD-CHENNAI-HYDERABAD',
  //     units: '03.30 Hrs.',  // Only for the first item
  //     rate: 150000,
  //     amount: 525000
  //   },
  //   {
  //     description: 'GROUND HANDLING CHARGES',
  //     units: null,  // No units for this item
  //     rate: 120000,
  //     amount: 120000
  //   },
  //   {
  //     description: 'B.L.T CHARGES',
  //     units: null,  // No units
  //     rate: 0,
  //     amount: 0
  //   },
  //   {
  //     description: 'A.M.E CHARGES',
  //     units: null,  // No units
  //     rate: 0,
  //     amount: 0
  //   }
  // ];
  chargeItems: ChargeItem[] = [];
  // taxItems: TaxItem[] = [];
  taxItems: TaxItem[] = [
    {
      description: 'CGST @ 9%',
      percentage: 9,
      amount: 0
    },
    {
      description: 'SGST @ 9%',
      percentage: 9,
      amount: 0
    },
    {
      description: 'IGST @ 18%',
      percentage: 18,
      amount: 0
    }
  ];
  show: boolean = true
  subtotal: number;
  grandTotal: number;
  amountInWords: string = '';

  @ViewChild('logoInput') logoInput!: ElementRef;
  allInvoiceList: any;
  originalUniqueId: number;

  // getstateList: any;

  bsConfig = {
    dateInputFormat: 'DD-MM-YYYY', // Set the date format
    containerClass: 'theme-blue', // Optional: Use a predefined theme
  };
  invoiceItem: any;
  loginData: any;
  reSubmitInvoice: boolean;
  reSubmitInvoiceStatus: any;
  reason: any;
  invoiceApprovedOrRejectedByUser: any;
  invoiceApprovedOrRejectedDateAndTime: any;
  constructor(private fb: FormBuilder, private numberToWordsService: NumberToWordsService, private service: GeneralserviceService, private datePipe: DatePipe, private spinner: NgxSpinnerService, private imageService: ImageService, private toaster: ToastrService) {
    this.newInvoiceCreation = this.fb.group({
      PQInvoiceNumber: [''],
      invoiceHeader: [''],
      ProformaCustomerName: ['', Validators.required],
      ProformaAddress: ['', Validators.required],
      ProformaCity: ['', Validators.required],
      ProformaState: ['', Validators.required],
      ProformaPincode: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/)
        ]
      ],
      ProformaGstNo: ['', Validators.required],
      ProformaPanNO: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)  // Correct PAN format
        ]
      ],

      ProformaInvoiceNumber: [''],
      ProformaInvoiceDate: ['', Validators.required],
      ProformaPan: [
        'AAICS9057Q',
        [
          Validators.required,
          Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)  // PAN format validation: 4 capital letters, 4 digits, 1 capital letter
        ]
      ],

      ProformaGstNumber: ['36AAICS9057Q1ZD', Validators.required],
      proformatypeOfAircraft: ['', Validators.required],
      proformaseatingcapasity: ['', Validators.required],
      notes: [''],
      startBookingDateOfJourny: ['', Validators.required],
      endBookingDateOfJourny: ['', Validators.required],
      bookingsector: ['', Validators.required],
      bookingbillingflyingtime: ['', Validators.required],
      // accountName: [''],
      // bankname: [''],
      // accountNumber: [''],
      // branch:[''],
      // ifscCode: ['']
    });


  }

  ngOnInit(): void {
    this.loginData = null
    this.loginData = this.service.getLoginResponse()
    console.log("this.loginData", this.loginData);
    console.log("taxlist", this.taxItems)
    this.getAllCustomerList();
    this.getAllInvoice()
    this.getStates();
    this.getAllCharges();
    this.logoUrl = this.imageService.getBase64FlightLogo();
    this.InvoiceLogo = this.imageService.getBase64WorldLogo();


  }
  onChargeSelectionChange(item: any, selectedChargeName: string) {
    if (selectedChargeName) { // Check if a charge was actually selected
      const selectedCharge = this.allCharges.find(charge => charge.chargeName === selectedChargeName);
      if (selectedCharge) {
        item.rate = selectedCharge.rate;
        this.calculateTotals();
      } else {
        // Handle the case where the selected charge is not found.
        // This could happen if the data in allCharges is inconsistent.
        console.error(`Charge with name '${selectedChargeName}' not found.`);
        // Optionally, you might want to reset the rate or display an error message.
        item.rate = 0; // or item.rate = null;
        this.calculateTotals();
      }
    } else {
      // Handle the case where the selection was cleared (e.g., user selected the placeholder).
      item.rate = 0; // or item.rate = null;
      this.calculateTotals();
    }
  }
  getAllCustomerList() {
    this.customerList = [];
    this.spinner.show()
    this.service.getAllCustomerList().subscribe(
      (res: any) => {
        this.spinner.hide()
        this.customerList = res.data;
        console.log('this.customerList', this.customerList);
      },
      (error) => {
        this.spinner.hide()
        console.log('error', error);
      }
    );
  }

  formatTime(event: any) {
    let inputValue = event.target.value;
    // Remove non-numeric, : and .
    inputValue = inputValue.replace(/[^0-9:.]/g, '');

    // Split by : or .
    const parts = inputValue.split(/[:.]/);

    if (parts.length > 2) {
      // More than one : or .
      inputValue = parts.slice(0, 2).join(':'); // Or '.', depending on your preference
    }

    if (parts.length === 2) {
      // Limit minutes to 2 digits
      parts[1] = parts[1].slice(0, 2);
      inputValue = parts.join(inputValue.includes(':') ? ':' : '.');
    }

    // Limit hours to 2 digits
    if (parts[0]) {
      parts[0] = parts[0].slice(0, 2);
      inputValue = parts.join(inputValue.includes(':') ? ':' : '.');
    }

    this.newInvoiceCreation.get('bookingbillingflyingtime')?.setValue(inputValue);
    this.updateChargeItem(0, 'units', inputValue); // Update your charge item
  }

  validateTimeInput(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if ((charCode < 48 || charCode > 57) && charCode !== 58 && charCode !== 46) {
      event.preventDefault(); // Prevent non-numeric, : and . input
    }
  }

  // onCustomerChange(customerId: string) {
  //   if (customerId) {
  //     const selectedCustomer = this.customerList.find((customer) => customer.customerId === parseInt(customerId));
  //     if (selectedCustomer) {
  //       this.newInvoiceCreation.patchValue({
  //         ProformaAddress: selectedCustomer.ProformaAddress,
  //         ProformaCity: selectedCustomer.ProformaCity,
  //         ProformaState: selectedCustomer.ProformaState,
  //         ProformaPincode: selectedCustomer.ProformaPincode,
  //         ProformaGstNo: selectedCustomer.ProformaGstNo,
  //         ProformaPanNO: selectedCustomer.ProformaPanNO,
  //         ProformaPan: selectedCustomer.ProformaPan,
  //         ProformaGstNumber: selectedCustomer.ProformaGstNumber,
  //         customerId: selectedCustomer.customerId,
  //       });
  //     }
  //   } else {
  //     // Clear fields if no customer is selected
  //     this.newInvoiceCreation.patchValue({
  //       ProformaAddress: '',
  //       ProformaCity: '',
  //       ProformaState: '',
  //       ProformaPincode: '',
  //       ProformaGstNo: '',
  //       ProformaPanNO: '',
  //       ProformaPan: '',
  //       ProformaGstNumber: '',
  //       customerId: '',
  //     });
  //   }
  // }
  getStates() {
    this.spinner.show();
    this.service.getstateList().subscribe(
      (response: any) => {
        this.spinner.hide()
        if (response && response.responseData) {
          this.statesList = response.responseData.data;
        }
      },
      (error) => {
        this.spinner.hide()
        console.error('Error fetching statesList:', error);
      }
    );
  }

  onChangeState() {
    this.taxItems = [];
    const selectedState = this.newInvoiceCreation.value.ProformaState;
    const selectedObj = this.statesList.find(item => item.stateName === selectedState);
    console.log("selectedObj", selectedObj);

    if (selectedObj && selectedObj.stateName === 'TELANGANA') {
      this.taxItems = [
        {
          description: 'CGST @ 9%',
          percentage: 9,
          amount: 0
        },
        {
          description: 'SGST @ 9%',
          percentage: 9,
          amount: 0
        },
      ];
    } else {
      this.taxItems = [
        {
          description: 'IGST @ 18%',
          percentage: 18,
          amount: 0
        }
      ];
    }

    // Recalculate totals if needed
    if (this.activeTab === 'Edit' && this.subtotal) {
      this.calculateTotals();
    }
  }
  onChangAircraft() {

    console.log("onChangAircraft aircraft", this.newInvoiceCreation.value.proformatypeOfAircraft)
    if (this.newInvoiceCreation.value.proformatypeOfAircraft == 'B-250 GT (VT-VIN)') {
      this.newInvoiceCreation.patchValue({
        "proformaseatingcapasity": '07'
      })

    } else if (this.newInvoiceCreation.value.proformatypeOfAircraft == 'L-600 (VT-VIK)') {
      this.newInvoiceCreation.patchValue({
        "proformaseatingcapasity": '13'
      })
    } else {
      this.newInvoiceCreation.patchValue({
        "proformaseatingcapasity": ''
      })
    }
  }

  getAllInvoice() {
    this.allInvoiceList = []
    this.getAllCustomerList()
    this.spinner.show()
    let obj = {
      "userActivity": this.loginData.data.userActivity
    }
    this.service.getAllInvoice(obj).subscribe((res: any) => {
      console.log("getAllInvoice", res);
      this.spinner.hide()
      this.allInvoiceList = res.data;
    }, error => {
      this.spinner.hide()
    })
  }



  selectedInvoice: any = null; // Stores the selected invoice
  isEditing = false; // Determines whether edit mode is active


  // Field configurations for form rendering
  invoiceFields = [
    { label: 'Company Name', controlName: 'companyName', placeholder: 'Enter company name' },
    { label: 'Date', controlName: 'date', placeholder: 'Enter date' },
    { label: 'City', controlName: 'city', placeholder: 'Enter city' },
    { label: 'invoiceReferenceNo', controlName: 'invoiceReferenceNo', placeholder: 'Enter invoiceReferenceNo' },
  ];
  spinnerHideMethod() {
    this.spinner.show()
    setTimeout(() => {
      this.spinner.hide()
    }, 1000); // Delay of 2 seconds
  }
  capitalizeFirstLetter(event: any) {
    let input = event.target.value;
    if (input.length === 0) return;

    const formatted = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    event.target.value = formatted;

  }
  convertToLowercase(event: any): void {
    const input = event.target;
    const lowercaseValue = input.value.toLowerCase();
    input.value = lowercaseValue;
    this.newInvoiceCreation.get('bookingsector')?.setValue(lowercaseValue);
  }


  // Method to select and show an invoice
  selectInvoice(invoice: any) {

    if (invoice.proformaCardHeaderId == "PQ") {
      this.reSubmitInvoice = false
      this.invoiceItem = null
      this.invoiceItem = invoice
      console.log("invoice", invoice)
      console.log("this.invoiceItem", this.invoiceItem.invoiceReferenceNo);
      console.log("this.invoiceItem.header.status", this.invoiceItem.header.status)


      if (this.invoiceItem.status == "Approved" && this.invoiceItem.pqStatus == "inComplete") {
        console.log("If approved")
        Swal.fire({
          // title: 'question',
          text: 'The selected invoice has been approved,Still Do you want to Edit Invoice?',
          icon: 'question',
          showCancelButton: true,  // Cancel Button
          cancelButtonText: 'Cancel',
          showDenyButton: true,  // Preview Button
          denyButtonText: 'Preview',
          showConfirmButton: true,  // Edit Button
          confirmButtonText: 'Edit',
        }).then((result) => {
          if (result.isConfirmed) {
            // Edit action
            this.editRow(invoice);
            this.reSubmitInvoice = false
          } else if (result.isDenied) {
            // Preview action
            this.invoiceItem = invoice;
            console.log("this.invoiceItem", this.invoiceItem);
            this.activeTab = 'Preview';
            this.spinnerHideMethod()
            this.reSubmitInvoice = false
          } else {
            // Cancel action (Optional: You can add any logic if needed)
            console.log("Action Cancelled");
            this.getAllInvoice()
            this.invoiceItem = null
            this.reSubmitInvoice = false
            // this.spinnerHideMethod()
          }
        });
      }
      else if (this.invoiceItem.status == "Approved") {
        console.log("If approved")
        Swal.fire({
          // title: 'question',
          text: 'The selected invoice has been approved,Do you want to Preview Invoice?',
          icon: 'question',
          showCancelButton: true,
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            this.invoiceItem = invoice
            console.log("this.invoiceItem", this.invoiceItem)
            this.activeTab = 'Preview'
            this.spinnerHideMethod()

          } else {
            // this.spinnerHideMethod()
            this.getAllInvoice()
            this.invoiceItem = null
            this.reSubmitInvoice = false
          }
        });
      }
      else {

        if (this.invoiceItem.status == "Rejected") {
          console.log("If rejected")
          Swal.fire({
            text: 'The selected invoice has been rejected.Do you still want to edit it to make changes and resubmit, or just preview the invoice?',
            icon: 'info',
            showCancelButton: true,  // Cancel Button
            cancelButtonText: 'Cancel',
            showDenyButton: true,  // Preview Button
            denyButtonText: 'Preview',
            showConfirmButton: true,  // Edit Button
            confirmButtonText: 'Edit',
          }).then((result) => {
            if (result.isConfirmed) {
              // Edit action
              this.editRow(invoice);
              this.reSubmitInvoice = true
              this.reSubmitInvoiceStatus = "Rejected_Reversed"
            } else if (result.isDenied) {
              // Preview action
              this.invoiceItem = invoice;
              console.log("this.invoiceItem", this.invoiceItem);
              this.activeTab = 'Preview';
              this.spinnerHideMethod()
              this.reSubmitInvoice = false
            } else {
              // Cancel action (Optional: You can add any logic if needed)
              console.log("Action Cancelled");
              this.getAllInvoice()
              this.invoiceItem = null
              this.reSubmitInvoice = null
              // this.spinnerHideMethod()
            }
          });


          // Swal.fire({
          //   // title: 'question',
          //   text: 'The selected invoice has been rejected',
          //   icon: 'info',
          //   showCancelButton: true,
          //   showConfirmButton: true,
          // }).then((result) => {
          //   if (result.isConfirmed) {
          //     this.invoiceItem = invoice
          //     console.log("this.invoiceItem", this.invoiceItem)
          //     this.activeTab = 'Preview'
          //     this.spinnerHideMethod()
          //   } else {
          //     this.invoiceItem = invoice
          //     console.log("this.invoiceItem", this.invoiceItem)
          //     // this.spinnerHideMethod()
          //     this.getAllInvoice()
          //     this.invoiceItem = null
          //   }
          // });
        } else {
          console.log("If pending");
          Swal.fire({
            text: 'Do you want to Edit or Preview the Invoice?',
            icon: 'info',
            showCancelButton: true,  // Cancel Button
            cancelButtonText: 'Cancel',
            // showDenyButton: true,  // Preview Button
            // denyButtonText: 'Preview',
            showConfirmButton: true,  // Edit Button
            confirmButtonText: 'Edit',
          }).then((result) => {
            if (result.isConfirmed) {
              // Edit action
              this.editRow(invoice);
              this.reSubmitInvoice = false
            } else if (result.isDenied) {
              // Preview action
              this.invoiceItem = invoice;
              console.log("this.invoiceItem", this.invoiceItem);
              this.activeTab = 'Preview';
              this.spinnerHideMethod()
              this.reSubmitInvoice = false
            } else {
              // Cancel action (Optional: You can add any logic if needed)
              console.log("Action Cancelled");
              this.getAllInvoice()
              this.invoiceItem = null
              this.reSubmitInvoice = false
              // this.spinnerHideMethod()
            }
          });

        }

      }
    }



  }
  pathPQDataToTAX(invoice) {

    this.spinnerHideMethod()
    this.selectedInvoice = null
    this.selectedInvoice = invoice;
    console.log("this.selectedInvoice", this.selectedInvoice)
    this.newInvoiceCreation.patchValue({
      // invoiceHeader: this.selectedInvoice.header.invoiceHeader,
      ProformaCustomerName: this.selectedInvoice.header.ProformaCustomerName,
      ProformaAddress: this.selectedInvoice.header.ProformaAddress,
      ProformaCity: this.selectedInvoice.header.ProformaCity,
      ProformaState: this.selectedInvoice.header.ProformaState,
      ProformaPincode: this.selectedInvoice.header.ProformaPincode,
      ProformaGstNo: this.selectedInvoice.header.ProformaGstNo,
      ProformaPanNO: this.selectedInvoice.header.ProformaPanNO,
      // ProformaInvoiceNumber: this.selectedInvoice.invoiceUniqueNumber,
      ProformaInvoiceDate: this.selectedInvoice.header.ProformaInvoiceDate,
      ProformaPan: this.selectedInvoice.header.ProformaPan,
      ProformaGstNumber: this.selectedInvoice.header.ProformaGstNumber,
      proformatypeOfAircraft: this.selectedInvoice.header.ProformaTypeOfAircraft,
      proformaseatingcapasity: this.selectedInvoice.header.ProformaSeatingCapasity,
      notes: this.selectedInvoice.header.notes,
      startBookingDateOfJourny: this.selectedInvoice.header.startBookingDateOfJourny,
      endBookingDateOfJourny: this.selectedInvoice.header.endBookingDateOfJourny,
      bookingsector: this.selectedInvoice.header.BookingSector,
      bookingbillingflyingtime: this.selectedInvoice.header.BookingBillingFlyingTime,
      // accountName: this.selectedInvoice.bankDetails.accountName,
      // bankname: this.selectedInvoice.bankDetails.bank,
      // accountNumber: this.selectedInvoice.bankDetails.accountNumber,
      // branch:this.selectedInvoice.bankDetails.branch,
      // ifscCode:this.selectedInvoice.bankDetails.ifscCode

    })

    this.chargeItems = this.selectedInvoice.chargesList;
    this.taxItems = this.selectedInvoice.taxList;
    this.subtotal = this.selectedInvoice.subtotal;
    this.grandTotal = this.selectedInvoice.grandTotal
    this.amountInWords = this.selectedInvoice.amountInWords
    this.logoUrl = this.selectedInvoice.header.invoiceImage
    this.InvoiceLogo = this.selectedInvoice.header.invoiceHeader
    this.reSubmitInvoiceStatus = this.selectedInvoice.status
    this.reason = this.selectedInvoice.reason,
      this.invoiceApprovedOrRejectedByUser = this.selectedInvoice.invoiceApprovedOrRejectedByUser,
      this.invoiceApprovedOrRejectedDateAndTime = this.selectedInvoice.invoiceApprovedOrRejectedDateAndTime,
      // this.proformaCardHeaderId = this.selectedInvoice.proformaCardHeaderId,
      // this.proformaCardHeaderName  =this.selectedInvoice.proformaCardHeaderName
      this.reviewedFlag = this.selectedInvoice.reviewed
    if (this.logoUrl == '' || this.logoUrl == null) {
      this.logoUrl = this.imageService.getBase64FlightLogo();
    }
    if (this.InvoiceLogo == '' || this.InvoiceLogo == null) {
      this.InvoiceLogo = this.imageService.getBase64WorldLogo();

    }
    console.log("this.selectedInvoice.header.invoiceUniqueNumber", this.selectedInvoice.invoiceUniqueNumber)
    console.log("this.newInvoiceCreation", this.newInvoiceCreation.value.ProformaInvoiceNumber)
    // this.pqSameforTAX = this.selectedInvoice.pqSameforTAX
  }
  editRow(invoice) {
    this.editRowGLobal = null
    this.editRowGLobal = invoice
    this.reSubmitInvoiceStatus = null
    this.rePQStatus = null
    this.reason = null,
      this.invoiceApprovedOrRejectedByUser = null,
      this.invoiceApprovedOrRejectedDateAndTime = null,
      this.proformaCardHeaderId = null,
      this.proformaCardHeaderName = null
    this.spinnerHideMethod()
    this.chargeItems = [];
    this.taxItems = [];
    this.subtotal = 0;
    this.grandTotal = 0
    this.selectedInvoice = null
    this.selectedInvoice = invoice;
    console.log("this.selectedInvoice", this.selectedInvoice)
    this.originalUniqueId = null
    this.originalUniqueId = this.selectedInvoice.originalUniqueId
    console.log("this.originalUniqueId", this.originalUniqueId, this.selectedInvoice.invoiceUniqueNumber)
    this.isEditing = false;
    this.activeTab = "Edit"
    this.show = false;
    this.reviewedFlag = false
    this.newInvoiceCreation.patchValue({
      // invoiceHeader: this.selectedInvoice.header.invoiceHeader,
      ProformaCustomerName: this.selectedInvoice.header.ProformaCustomerName,
      ProformaAddress: this.selectedInvoice.header.ProformaAddress,
      ProformaCity: this.selectedInvoice.header.ProformaCity,
      ProformaState: this.selectedInvoice.header.ProformaState,
      ProformaPincode: this.selectedInvoice.header.ProformaPincode,
      ProformaGstNo: this.selectedInvoice.header.ProformaGstNo,
      ProformaPanNO: this.selectedInvoice.header.ProformaPanNO,
      ProformaInvoiceNumber: this.selectedInvoice.invoiceUniqueNumber,
      ProformaInvoiceDate: this.selectedInvoice.header.ProformaInvoiceDate,
      ProformaPan: this.selectedInvoice.header.ProformaPan,
      ProformaGstNumber: this.selectedInvoice.header.ProformaGstNumber,
      proformatypeOfAircraft: this.selectedInvoice.header.ProformaTypeOfAircraft,
      proformaseatingcapasity: this.selectedInvoice.header.ProformaSeatingCapasity,
      notes: this.selectedInvoice.header.notes,
      startBookingDateOfJourny: this.selectedInvoice.header.startBookingDateOfJourny,
      endBookingDateOfJourny: this.selectedInvoice.header.endBookingDateOfJourny,
      bookingsector: this.selectedInvoice.header.BookingSector,
      bookingbillingflyingtime: this.selectedInvoice.header.BookingBillingFlyingTime,
      // accountName: this.selectedInvoice.bankDetails.accountName,
      // bankname: this.selectedInvoice.bankDetails.bank,
      // accountNumber: this.selectedInvoice.bankDetails.accountNumber,
      // branch:this.selectedInvoice.bankDetails.branch,
      // ifscCode:this.selectedInvoice.bankDetails.ifscCode

    })

    this.chargeItems = this.selectedInvoice.chargesList;
    this.taxItems = this.selectedInvoice.taxList;
    this.subtotal = this.selectedInvoice.subtotal;
    this.grandTotal = this.selectedInvoice.grandTotal
    this.amountInWords = this.selectedInvoice.amountInWords
    this.logoUrl = this.selectedInvoice.header.invoiceImage
    this.InvoiceLogo = this.selectedInvoice.header.invoiceHeader
    this.reSubmitInvoiceStatus = this.selectedInvoice.status
    this.reason = this.selectedInvoice.reason,
      this.invoiceApprovedOrRejectedByUser = this.selectedInvoice.invoiceApprovedOrRejectedByUser,
      this.invoiceApprovedOrRejectedDateAndTime = this.selectedInvoice.invoiceApprovedOrRejectedDateAndTime,
      this.proformaCardHeaderId = this.selectedInvoice.proformaCardHeaderId,
      this.proformaCardHeaderName = this.selectedInvoice.proformaCardHeaderName
    this.reviewedFlag = this.selectedInvoice.reviewed
    if (this.logoUrl == '' || this.logoUrl == null) {
      this.logoUrl = this.imageService.getBase64FlightLogo();
    }
    if (this.InvoiceLogo == '' || this.InvoiceLogo == null) {
      this.InvoiceLogo = this.imageService.getBase64WorldLogo();

    }
    console.log("this.selectedInvoice.header.invoiceUniqueNumber", this.selectedInvoice.invoiceUniqueNumber)
    console.log("this.newInvoiceCreation", this.newInvoiceCreation.value.ProformaInvoiceNumber)
    this.pqSameforTAX = this.selectedInvoice.pqSameforTAX,
      this.rePQStatus = this.selectedInvoice.pqStatus
  }
  resetAll() {
    // this.logoUrl = ""
    this.amountInWords = ""
    this.chargeItems = [];
    this.taxItems = [];
    this.subtotal = 0;
    this.grandTotal = 0
    this.selectedInvoice = null
    this.newInvoiceCreation.patchValue({
      invoiceHeader: "",
      ProformaCustomerName: "",
      ProformaAddress: "",
      ProformaCity: "",
      ProformaState: "",
      ProformaPincode: "",
      ProformaGstNo: "",
      ProformaPanNO: "",
      ProformaInvoiceNumber: "",
      ProformaInvoiceDate: "",
      ProformaPan: "AAICS9057Q",
      ProformaGstNumber: "36AAICS9057Q1ZD",
      proformatypeOfAircraft: "",
      proformaseatingcapasity: "",
      // bookingdetailsdateofjourney:"" ,
      // bookingdetailssector: "",
      // bookingdetailsbillingflyingtime: "",
      notes: "",
      startBookingDateOfJourny: "",
      endBookingDateOfJourny: "",
      bookingsector: "",
      bookingbillingflyingtime: "",
      // accountName: "",
      // bankname: "",
      // accountNumber:"",
      // branch:"",
      // ifscCode:""
    })
    this.submited = false
    setTimeout(() => {
      this.spinner.hide()
      console.log("enter into new or all spinner")
    }, 1000); // Delay of 2 seconds
  }

  backButton() {
    this.show = true
    this.activeTab = "AllInvoice"
  }

  // Method to preview an invoice
  previewInvoice(invoice: any) {
    this.selectedInvoice = invoice;
    this.isEditing = false;
  }

  // Method to edit an invoice
  editInvoice(invoice: any) {
    this.selectedInvoice = invoice;
    this.isEditing = true;
  }
  setTab(tabName: string) {
    this.spinner.show()

    if (tabName == 'AllInvoice' || tabName == 'NewInvoice') {
      this.activeTab = tabName;
      this.invoiceItem = null
      console.log("this.activeTab", this.activeTab);
      this.resetAll()
      this.show = true

    } else {
      this.activeTab = tabName;
      setTimeout(() => {
        this.spinner.hide()
        console.log('setTab else this.invoiceItem', this.invoiceItem)
        console.log('newInvoiceCreation', this.newInvoiceCreation.value)
      }, 1000); // Delay of 2 seconds


    }


  }


  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = () => {
        this.logoUrl = reader.result as string; // Store the image URL
        console.log("Image logoUrl:", this.logoUrl);
      };

      reader.readAsDataURL(input.files[0]); // Convert file to base64 URL
    }
  }

  removeLogo(event: Event): void {
    event.preventDefault();
    this.logoUrl = 'assets/images/AircraftFlight.png';
  }

  addChargeItem() {
    if (this.newInvoiceCreation.value.ProformaState) {
      const newChargeItem = {
        description: this.chargeItems.length === 0 ? this.newInvoiceCreation.value.bookingsector : '', // Only add sector to the first row
        units: this.chargeItems.length === 0 ? this.newInvoiceCreation.value.bookingbillingflyingtime : '', // Only add billing flying time to the first row
        rate: 0,
        amount: 0
      };

      this.chargeItems.push(newChargeItem);
      console.log("this.chargeItems addChargeItem", this.chargeItems);
    } else {
      Swal.fire(`Please select State and Add Charges`);
    }
  }

  updateChargeItem(index: number, field: string, value: any) {
    if (this.chargeItems.length > index) {
      this.chargeItems[index][field] = value; // Convert to uppercase
    }
    this.calculateTotals()
  }

  deleteChargeItem(index: number) {
    this.chargeItems.splice(index, 1); // Remove the selected item
    this.calculateTotals(); // Recalculate totals
    console.log("this.chargeItems", this.chargeItems)
  }


  addTaxItem(): void {
    this.taxItems.push({ description: '', percentage: 0, amount: 0 });
  }

  calculateTotals() {
    this.subtotal = 0;
    this.grandTotal = 0;

    this.chargeItems.forEach(item => {
      if (item.units) {
        const unitsInHours = this.convertUnitsToHours(item.units);
        item.amount = unitsInHours * item.rate;
      } else if (item.rate) {
        item.amount = item.rate;
      } else {
        item.amount = 0;
      }
    });

    this.subtotal = this.chargeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    this.taxItems.forEach(tax => {
      tax.amount = Math.round(this.subtotal * (Number(tax.percentage) / 100));
    });

    this.grandTotal = Math.round(this.subtotal + this.taxItems.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0));

    this.amountInWords = this.toTitleCase(this.numberToWordsService.convert(this.grandTotal));
    console.log("chargeItems", this.chargeItems);
    console.log("taxItems", this.taxItems);
    console.log("subtotal", this.subtotal);
    console.log("grandTotal", this.grandTotal);
    console.log("amountInWords", this.amountInWords);
  }

  convertUnitsToHours(units: string | null): number {
    if (!units || units.trim() === '') return 0;

    let cleanUnits = units.trim().toLowerCase();
    cleanUnits = cleanUnits.replace(/ hrs?$/, '');

    const dotParts = cleanUnits.split('.');
    const colonParts = cleanUnits.split(':');

    let hours = 0;
    let minutes = 0;

    if (dotParts.length === 2) {
      hours = Number(dotParts[0]);
      minutes = Number(dotParts[1]);
    } else if (colonParts.length === 2) {
      hours = Number(colonParts[0]);
      minutes = Number(colonParts[1]);
    } else {
      // Check if it's just whole hours (e.g., "6")
      const wholeHours = Number(cleanUnits);
      if (!isNaN(wholeHours)) {
        return wholeHours;
      }
      return 0; // Invalid format
    }

    if (isNaN(hours) || isNaN(minutes)) return 0;

    if (hours > 24) hours = 24;
    if (minutes >= 60) return 0; // Reject minutes >= 60

    return hours + minutes / 60;
  }
  formatDate(proformaInvoiceDate: string): string {
    const date = new Date(proformaInvoiceDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  CreateInvoice(): void {


    console.log('this.newInvoiceCreation', this.newInvoiceCreation.invalid);
    if (this.newInvoiceCreation.invalid) {
      console.log('this.newInvoiceCreation', this.newInvoiceCreation);
      this.submited = true; // Ensure it's set before checking invalid fields
      this.newInvoiceCreation.markAllAsTouched();

      // Find the first invalid control and focus on it
      for (const key of Object.keys(this.newInvoiceCreation.controls)) {
        if (this.newInvoiceCreation.controls[key].invalid) {
          setTimeout(() => {
            let invalidControl = document.querySelector(`[formControlName="${key}"]`);

            if (invalidControl) {
              const ngSelectInput = invalidControl.querySelector('input'); // Get the input inside ng-select
              if (ngSelectInput) {
                ngSelectInput.focus(); // Focus the input inside ng-select
              } else {
                (invalidControl as HTMLElement).focus(); // Default focus for normal fields
              }
            }
          }, 0); // Small delay to ensure the DOM updates
          break; // Stop after focusing on the first invalid field
        }
      }
    }
    else if (this.chargeItems.length == 0) {
      console.log("this.chargeItems.length", this.chargeItems.length)
      //  this.toaster.warning("Please Add Charges In Table")
      Swal.fire({
        text: "Please Add Charges In Table",
        icon: 'warning',
        showConfirmButton: true
      });
      return
    }
    else {
      console.log('Invoice Saved', this.newInvoiceCreation.value);
      let invoiceDate = this.newInvoiceCreation.value.ProformaInvoiceDate;
      let startBookingDate = this.newInvoiceCreation.value.startBookingDateOfJourny;
      let endBbookingDate = this.newInvoiceCreation.value.endBookingDateOfJourny;

      // ✅ Check if the date is already in 'DD-MM-YYYY' format
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

      if (!dateRegex.test(invoiceDate)) {
        invoiceDate = this.formatDate(invoiceDate);
      }

      if (!dateRegex.test(startBookingDate)) {
        startBookingDate = this.formatDate(startBookingDate);
      }
      if (!dateRegex.test(endBbookingDate)) {
        endBbookingDate = this.formatDate(endBbookingDate);
      }
      console.log("invoiceDateSplit", invoiceDate, "startBookingDate", startBookingDate, "endBbookingDate", endBbookingDate);
      console.log("this.newInvoiceCreation.value.ProformaCustomerName", this.newInvoiceCreation.value.ProformaCustomerName);

      let customerNameObj;


      if (
        this.newInvoiceCreation.value.ProformaCustomerName &&
        typeof this.newInvoiceCreation.value.ProformaCustomerName === "object" &&
        "customerName" in this.newInvoiceCreation.value.ProformaCustomerName
      ) {
        customerNameObj = this.newInvoiceCreation.value.ProformaCustomerName.customerName;
      } else {
        customerNameObj = this.newInvoiceCreation.value.ProformaCustomerName;
      }
      var statusUpdate
      var pqStatus
      var pqUniqueId
      if (this.proformaCardHeaderId == "PQ") {
        statusUpdate = "Pending",
          pqStatus = "inComplete"
        pqUniqueId = 0

      } else {
        statusUpdate = "Amount Received"
        pqStatus = "Completed",
          pqUniqueId = this.selectedPQUniqueId
      }
      let createobj = {
        "header": {
          //  "invoiceHeader": this.InvoiceLogo,
          //   "invoiceImage": this.logoUrl,
          "invoiceHeader": null,
          "invoiceImage": null,
          "ProformaCustomerName": customerNameObj,
          "ProformaAddress": this.newInvoiceCreation.value.ProformaAddress,
          "ProformaCity": this.newInvoiceCreation.value.ProformaCity,
          "ProformaState": this.newInvoiceCreation.value.ProformaState,
          "ProformaPincode": this.newInvoiceCreation.value.ProformaPincode,
          "ProformaGstNo": this.newInvoiceCreation.value.ProformaGstNo,
          "ProformaPanNO": this.newInvoiceCreation.value.ProformaPanNO,
          "ProformaInvoiceNumber": this.newInvoiceCreation.value.ProformaInvoiceNumber,
          "ProformaInvoiceDate": invoiceDate,
          "ProformaPan": this.newInvoiceCreation.value.ProformaPan,
          "ProformaGstNumber": this.newInvoiceCreation.value.ProformaGstNumber,
          "ProformaTypeOfAircraft": this.newInvoiceCreation.value.proformatypeOfAircraft,
          "ProformaSeatingCapasity": this.newInvoiceCreation.value.proformaseatingcapasity,
          "notes": this.newInvoiceCreation.value.notes,
          "startBookingDateOfJourny": startBookingDate,
          "endBookingDateOfJourny": endBbookingDate,
          "BookingSector": this.newInvoiceCreation.value.bookingsector,
          "BookingBillingFlyingTime": this.newInvoiceCreation.value.bookingbillingflyingtime
        },
        "chargesList": this.chargeItems,
        "taxList": this.taxItems,
        "subtotal": this.subtotal,
        "grandTotal": this.grandTotal,
        "amountInWords": this.amountInWords,
        "reason": '',
        "invoiceApprovedOrRejectedByUser": "",
        "invoiceApprovedOrRejectedDateAndTime": "",
        "loggedInUser": this.loginData.data.userName,
        "createdByUser": this.loginData.data.userName,
        "status": statusUpdate,
        "proformaCardHeaderId": this.proformaCardHeaderId,
        "proformaCardHeaderName": this.proformaCardHeaderName,
        "reviewed": false,
        "reviewedReSubmited": false,
        "pqSameforTAX": this.pqSameforTAX ? this.pqSameforTAX : 0,
        "pqStatus": pqStatus,
        "pqUniqueId": pqUniqueId,
        "groundHandlingAmount": "",
        "groundHandlingFile": "",
        "landingParkingAmount": "",
        "landingParkingFile": "",
        "GATerminalOthersAmount": "",
        "GATerminalOthersFile": "",
        "onboardCateringAmount": "",
        "onboardCateringFile": "",
        "crewExpensesAmount": "",
        "crewExpensesFile": "",
        "fuelexpensesAmount": "",
        "fuelexpensesFile": "",
        "otherexpensesAmount": "",
        "otherexpensesFile": "",
        "totalExpensesAmount":""
        // "bankDetails":{
        //     "accountName":this.newInvoiceCreation.value.accountName,
        //     "bank":this.newInvoiceCreation.value.bank,
        //     "accountNumber":this.newInvoiceCreation.value.accountNumber,
        //     "branch":this.newInvoiceCreation.value.branch,
        //     "ifscCode":this.newInvoiceCreation.value.ifscCode
        // }
      };
      console.log('Payload sent to backend:', createobj);
      this.spinner.show()
      this.service.CreateInvoice(createobj).subscribe((response: any) => {
        console.log("CreateInvoice", response);

        const resp = response.data;
        if (response.status === 200 && resp) {

          this.getAllInvoice()
          this.getAllCharges();

          this.activeTab = 'AllInvoice'
          // Reset form and related data
          this.newInvoiceCreation.reset();
          // this.logoUrl = '';
          this.chargeItems = [];
          this.taxItems = [];
          this.subtotal = 0;
          this.grandTotal = 0;
          this.amountInWords = '';
          this.resetAll()
          Swal.fire({
            text: response.message + ' with Invoice Number ' + resp.invoiceUniqueNumber,
            icon: 'success',
            showConfirmButton: true
          });
          this.spinner.hide()

        } else {
          this.spinner.hide()
          Swal.fire({
            text: 'failed to fetch data ',
            icon: 'error',
            showConfirmButton: true
          });
        }
      }, (error) => {
        // Handle error'
        this.spinner.hide()
        console.log('Error creating invoice:', error);
        Swal.fire({
          text: error,
          icon: 'error',
          showConfirmButton: true
        });
      });
    }
  }

  numbersOnly(event: any) {
    const charCode = event.charCode;
    if (!(charCode >= 48 && charCode <= 57) && ![8, 9, 37, 39, 46].includes(charCode)) {
      event.preventDefault();
    }
  }

  UpdateInvoice(): void {


    if (this.newInvoiceCreation.valid) {
      console.log('Invoice Updated', this.newInvoiceCreation.value);


      let invoiceDate = this.newInvoiceCreation.value.ProformaInvoiceDate;
      let startBookingDate = this.newInvoiceCreation.value.startBookingDateOfJourny;
      let endBbookingDate = this.newInvoiceCreation.value.endBookingDateOfJourny;

      // ✅ Check if the date is already in 'DD-MM-YYYY' format
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

      if (!dateRegex.test(invoiceDate)) {
        invoiceDate = this.formatDate(invoiceDate);
      }

      if (!dateRegex.test(startBookingDate)) {
        startBookingDate = this.formatDate(startBookingDate);
      }
      if (!dateRegex.test(endBbookingDate)) {
        endBbookingDate = this.formatDate(endBbookingDate);
      }
      console.log("invoiceDateSplit update", invoiceDate, "startBookingDate", startBookingDate, "endBbookingDate", endBbookingDate);
      var pqStatus
      var statusUpdate
      var rePQStatus
      console.log("this.reSubmitInvoiceStatus", this.reSubmitInvoiceStatus, "this.rePQStatus", this.rePQStatus)
      if (this.reSubmitInvoiceStatus == "Approved" && this.rePQStatus == 'inComplete') {
        statusUpdate = "Pending",
          rePQStatus = 'inComplete'

      } else {
        statusUpdate = this.reSubmitInvoiceStatus,
          rePQStatus = 'inComplete'
      }

      // Implement update logic here
      let updateobj = {

        "originalUniqueId": this.originalUniqueId,
        "header": {
          // "invoiceHeader": this.InvoiceLogo,
          // "invoiceImage": this.logoUrl,
          "invoiceHeader": null,
          "invoiceImage": null,
          "ProformaCustomerName": this.newInvoiceCreation.value.ProformaCustomerName,
          "ProformaAddress": this.newInvoiceCreation.value.ProformaAddress,
          "ProformaCity": this.newInvoiceCreation.value.ProformaCity,
          "ProformaState": this.newInvoiceCreation.value.ProformaState,
          "ProformaPincode": this.newInvoiceCreation.value.ProformaPincode,
          "ProformaGstNo": this.newInvoiceCreation.value.ProformaGstNo,
          "ProformaPanNO": this.newInvoiceCreation.value.ProformaPanNO,
          "ProformaInvoiceNumber": this.newInvoiceCreation.value.ProformaInvoiceNumber,
          "ProformaInvoiceDate": invoiceDate,
          "ProformaPan": this.newInvoiceCreation.value.ProformaPan,
          "ProformaGstNumber": this.newInvoiceCreation.value.ProformaGstNumber,
          "ProformaTypeOfAircraft": this.newInvoiceCreation.value.proformatypeOfAircraft,
          "ProformaSeatingCapasity": this.newInvoiceCreation.value.proformaseatingcapasity,
          "notes": this.newInvoiceCreation.value.notes,
          "startBookingDateOfJourny": startBookingDate,
          "endBookingDateOfJourny": endBbookingDate,
          "BookingSector": this.newInvoiceCreation.value.bookingsector,
          "BookingBillingFlyingTime": this.newInvoiceCreation.value.bookingbillingflyingtime
        },
        "chargesList": this.chargeItems,
        "taxList": this.taxItems,
        "subtotal": this.subtotal,
        "grandTotal": this.grandTotal,
        "amountInWords": this.amountInWords,
        "reason": this.reason,
        "invoiceApprovedOrRejectedByUser": this.invoiceApprovedOrRejectedByUser,
        "invoiceApprovedOrRejectedDateAndTime": this.invoiceApprovedOrRejectedDateAndTime,
        "loggedInUser": this.loginData.data.userName,
        "createdByUser": this.loginData.data.userName,
        "status": statusUpdate,
        "proformaCardHeaderId": this.proformaCardHeaderId,
        "proformaCardHeaderName": this.proformaCardHeaderName,
        "reviewed": this.reviewedFlag,
        "reviewedReSubmited": false,
        "pqSameforTAX": this.pqSameforTAX ? this.pqSameforTAX : 0,
        "pqStatus": rePQStatus,
        "groundHandlingAmount": this.editRowGLobal.groundHandlingAmount,
        "groundHandlingFile": this.editRowGLobal.groundHandlingFile,
        "landingParkingAmount": this.editRowGLobal.landingParkingAmount,
        "landingParkingFile": this.editRowGLobal.landingParkingFile,
        "GATerminalOthersAmount": this.editRowGLobal.GATerminalOthersAmount,
        "GATerminalOthersFile": this.editRowGLobal.GATerminalOthersFile,
        "onboardCateringAmount": this.editRowGLobal.onboardCateringAmount,
        "onboardCateringFile": this.editRowGLobal.onboardCateringFile,
        "crewExpensesAmount": this.editRowGLobal.crewExpensesAmount,
        "crewExpensesFile": this.editRowGLobal.crewExpensesFile,
        "fuelexpensesAmount": this.editRowGLobal.fuelexpensesAmount,
        "fuelexpensesFile": this.editRowGLobal.fuelexpensesFile,
        "otherexpensesAmount": this.editRowGLobal.otherexpensesAmount,
        "otherexpensesFile": this.editRowGLobal.otherexpensesFile,
        "totalExpensesAmount":this.editRowGLobal.totalExpensesAmount
        // "bankDetails":{
        //     "accountName":this.newInvoiceCreation.value.accountName,
        //     "bank":this.newInvoiceCreation.value.bank,
        //     "accountNumber":this.newInvoiceCreation.value.accountNumber,
        //     "branch":this.newInvoiceCreation.value.branch,
        //     "ifscCode":this.newInvoiceCreation.value.ifscCode
      };
      console.log('Payload sent to backend:', updateobj);
      this.spinner.show()
      this.service.UpdateInvoice(updateobj, this.originalUniqueId).subscribe((response: any) => {
        console.log("updateInvoice", response);
        this.spinner.hide()
        const resp = response.updatedInvoice;
        if (response.status === 200 && resp) {
          this.getAllInvoice()
          this.getAllCharges();
          // Reset form and related data
          this.newInvoiceCreation.reset();
          // this.logoUrl = '';
          this.chargeItems = [];
          this.taxItems = [];
          this.subtotal = 0;
          this.grandTotal = 0;
          this.amountInWords = '';
          this.activeTab = "AllInvoice"
          this.resetAll()
          this.show = true
          Swal.fire({
            text: response.message,
            icon: 'success',
            showConfirmButton: true
          });
          this.invoiceItem = null

        } else {
          this.spinner.hide()
          Swal.fire({
            text: 'Failed to Update data ',
            icon: 'error',
            showConfirmButton: true
          });
        }
      }, (error) => {
        // Handle error
        this.spinner.hide()
        console.log('Error updating invoice:', error);
        Swal.fire({
          text: 'An error occurred while updating the invoice',
          icon: 'error',
          showConfirmButton: true
        });
      });
    } else {
      this.spinner.hide()
      console.log('Form is invalid');
      Swal.fire({
        text: 'Please fill out the form correctly.',
        icon: 'warning',
        showConfirmButton: true
      });
    }
  }
  convertToUppercase(event: any) {
    event.target.value = event.target.value.toUpperCase();
  }

  restrictToNumbers(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = event.key;

    if (!pattern.test(inputChar)) {
      event.preventDefault(); // Prevent non-numeric input
    }
  }
  getAllCharges() {
    this.service.getAllCharges().subscribe((res: any) => {
      this.allCharges = res.data; // Update the allCharges array with the fetched data
      console.log('allCharges:', this.allCharges);

    }, error => {
      console.error("Error fetching charges:", error);
    });
  }





}
