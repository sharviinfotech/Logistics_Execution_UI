import { Component, Input, Output, EventEmitter, ElementRef, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxPrintModule } from 'ngx-print';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageService } from 'src/app/image.service';
import { NumberToWordsService } from 'src/app/number-to-words.service';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
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

interface InvoiceHeader {
  invoiceHeader: string;
  invoiceImage: string;
  ProformaCustomerName: string;
  ProformaAddress: string;
  ProformaCity: string;
  ProformaState: string;
  ProformaPincode: string;
  ProformaGstNo: string;
  ProformaPanNO: string;
  ProformaInvoiceNumber: string;
  ProformaInvoiceDate: string;
  ProformaPan: string;
  ProformaGstNumber: string;
  ProformaTypeOfAircraft: string;
  ProformaSeatingCapasity: number;
  notes: string;
  BookingDateOfJourny: string;
  BookingSector: string;
  BookingBillingFlyingTime: string;
}


interface InvoiceItem {
  invoiceUniqueNumber: string;
  header: InvoiceHeader;
  _id: string;
  originalUniqueId: number;
  chargesList: ChargeItem[];
  taxList: TaxItem[];
  subtotal: number;
  grandTotal: number;
  amountInWords: string;
  status: string;
  proformaCardHeaderName: string
}

@Component({
  selector: 'app-global-review-edit',
  templateUrl: './global-review-edit.component.html',
  styleUrl: './global-review-edit.component.css',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BsDatepickerModule, NgxSpinnerModule, NgSelectModule],
  standalone: true,
})

export class GlobalReviewEditComponent {
  @Input() invoiceData: any; // Receive data from parent
  @Output() closeModal = new EventEmitter<void>(); // Notify parent to close
  newInvoiceCreation: any;
  invoiceService: any;
  activeModal: any;
  reviewedDescription: string;
  selectedInvoice: any;
  subtotal: number;
  grandTotal: number;
  amountInWords: string = '';
  chargeItems: ChargeItem[] = [];
  taxItems: TaxItem[] = [];
  logoUrl: string;
  InvoiceLogo: string;
  signature: string;
  originalUniqueId: number;
  reSubmitInvoice: boolean;
  reSubmitInvoiceStatus: any;
  reason: any;
  proformaCardHeaderName: any;
  proformaCardHeaderId: null;
  invoiceApprovedOrRejectedByUser: any;
  invoiceApprovedOrRejectedDateAndTime: any;
  statesList: any;
  loginData: any;
  bsConfig = {
    dateInputFormat: 'DD-MM-YYYY', // Set the date format
    containerClass: 'theme-blue', // Optional: Use a predefined theme
  };
  allCharges: any;

  constructor(private fb: FormBuilder, private numberToWordsService: NumberToWordsService, private service: GeneralserviceService, private spinner: NgxSpinnerService, private modalService: NgbModal, private imageService: ImageService,private router: Router) {


  }
  ngOnInit() {
    this.newInvoiceCreation = this.fb.group({
      PQInvoiceNumber:[''],
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
      notes: ['',Validators.required],
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
    this.loginData = this.service.getLoginResponse()
    console.log("this.loginData", this.loginData);
    console.log("childMessage", this.invoiceData)
    this.openEditPopup(this.invoiceData)
    this.getStates()
    this.getAllCharges()
  }
  getAllCharges() {
    this.service.getAllCharges().subscribe((res: any) => {
      this.allCharges = res.data; // Update the allCharges array with the fetched data
      console.log('allCharges:', this.allCharges);
      
    }, error => {
      console.error("Error fetching charges:", error);
    });
  }
  close() {
    this.closeModal.emit(); // Emit event when closing
  }
  closeInvoice() {
    this.modalService.dismissAll();
  }
  onChangeState() {
    this.taxItems = []
    const selectedState = this.newInvoiceCreation.value.ProformaState
    const seletedObj = this.statesList.find(item => item.stateName == selectedState);
    console.log("seletedObj", seletedObj)
    if (seletedObj.stateName == 'Telangana') {
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

    console.log("this.subtotal", this.subtotal)
    this.calculateTotals()

  }
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

        console.error('Error fetching statesList:', error);
      }
    );
  }
  customDateValidator(control: any): { [key: string]: boolean } | null {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    return dateRegex.test(control.value) ? null : { invalidDate: true };
  }
  convertUnitsToHours(units: string | null): number {
    if (!units || units.trim() === '') return 0;

    // Clean up the 'Hrs.' part from the input
    const cleanUnits = units.replace(' Hrs.', '').trim();

    // Split the units by '.'
    const parts = cleanUnits.split('.');
    if (parts.length !== 2) return 0;  // Ensure there are exactly 2 parts (hours and minutes)

    let hours = Number(parts[0]);  // Use 'let' instead of 'const' for reassignment
    let minutes = Number(parts[1]); // Use 'let' instead of 'const' for reassignment

    // Validate the parsed values to avoid NaN issues
    if (isNaN(hours) || isNaN(minutes)) return 0; // Return 0 if any value is NaN

    // Ensure hours and minutes are within valid ranges
    if (hours > 24) hours = 24; // Max hours can be 24
    if (minutes >= 60) minutes = 59; // Max minutes can be 59

    return hours + minutes / 60; // Convert units to decimal hours
  }
  calculateTotals() {
    this.subtotal = 0
    this.grandTotal = 0
    // Loop through each charge item and calculate the amount
    this.chargeItems.forEach(item => {
      // If there are units, convert to hours and calculate the amount
      if (item.units) {
        const unitsInHours = this.convertUnitsToHours(item.units);
        item.amount = unitsInHours * item.rate; // Calculate amount based on rate and hours
      } else if (item.rate) {
        // If no units are provided, calculate amount based only on rate (assuming 1 unit)
        item.amount = item.rate; // If no units, assume 1 unit for calculation
      } else {
        // If no rate or units, set amount to 0
        item.amount = 0;
      }
    });

    this.subtotal = this.chargeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Calculate tax amounts based on subtotal
    this.taxItems.forEach(tax => {
      tax.amount = Math.round(this.subtotal * (Number(tax.percentage) / 100));
    });

    // Calculate grand total (subtotal + tax amounts)
    this.grandTotal = this.subtotal + this.taxItems.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);

    this.amountInWords = this.numberToWordsService.convert(Math.round(this.grandTotal)).toUpperCase();

    console.log("chargeItems", this.chargeItems);
    console.log("taxItems", this.taxItems);
    console.log("subtotal", this.subtotal);
    console.log("grandTotal", this.grandTotal);
    console.log("amountInWords", this.amountInWords);

  }
  formatDate(proformaInvoiceDate: string): string {
    const date = new Date(proformaInvoiceDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
  numbersOnly(event: any) {
    const charCode = event.charCode;
    if (!(charCode >= 48 && charCode <= 57) && ![8, 9, 37, 39, 46].includes(charCode)) {
      event.preventDefault();
    }
  }
  updateChargeItem(index: number, field: string, value: any) {
    if (this.chargeItems.length > index) {
      this.chargeItems[index][field] = value.toUpperCase(); // Convert to uppercase
    }
    this.calculateTotals()
  }

  deleteChargeItem(index: number) {
    this.chargeItems.splice(index, 1); // Remove the selected item
    this.calculateTotals(); // Recalculate totals
    console.log("this.chargeItems", this.chargeItems)
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

  addTaxItem(): void {
    this.taxItems.push({ description: '', percentage: 0, amount: 0 });
  }
  openEditPopup(invoice: any) {
    this.selectedInvoice = null
    this.selectedInvoice = invoice;
    console.log('Invoice data:', invoice);
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
      reviewedDescriptionEdit: this.selectedInvoice.reviewedDescription,
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

    if (this.logoUrl == '' || this.logoUrl == null) {
      this.logoUrl = this.imageService.getBase64FlightLogo();
    }
    if (this.InvoiceLogo == '' || this.InvoiceLogo == null) {
      this.InvoiceLogo = this.imageService.getBase64WorldLogo();

    }
    console.log("this.selectedInvoice.header.invoiceUniqueNumber", this.selectedInvoice.invoiceUniqueNumber)
    console.log("this.newInvoiceCreation", this.newInvoiceCreation.value.ProformaInvoiceNumber)
    // this.modalService.open(this.editForm, { size: 'xl' }); 
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
      bookingdateOfjourny: "",
      bookingsector: "",
      bookingbillingflyingtime: "",
      reviewedDescriptionEdit: "",
      // accountName: "",
      // bankname: "",
      // accountNumber:"",
      // branch:"",
      // ifscCode:"" 
    })
    setTimeout(() => {
      this.spinner.hide()
      console.log("enter into new or all spinner")
    }, 1000); // Delay of 2 seconds
  }
  UpdateInvoice(): void {
    this.newInvoiceCreation.markAllAsTouched();

    if (this.newInvoiceCreation.valid) {
      console.log('Invoice Updated', this.newInvoiceCreation.value);

      let invoiceDate = this.newInvoiceCreation.value.ProformaInvoiceDate;
      // let bookingDate = this.newInvoiceCreation.value.bookingdateOfjourny;

      // ✅ Check if the date is already in 'DD-MM-YYYY' format
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

      if (!dateRegex.test(invoiceDate)) {
        invoiceDate = this.formatDate(invoiceDate);
      }

      // if (!dateRegex.test(bookingDate)) {
      //   bookingDate = this.formatDate(bookingDate);
      // }
      let startBookingDate = this.newInvoiceCreation.value.startBookingDateOfJourny;
      let endBbookingDate = this.newInvoiceCreation.value.endBookingDateOfJourny;

      // Implement update logic here
      let updateobj = {

        "originalUniqueId": this.selectedInvoice.originalUniqueId,
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
          "BookingBillingFlyingTime": this.newInvoiceCreation.value.bookingbillingflyingtime,
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
        "status": this.reSubmitInvoiceStatus,
        "proformaCardHeaderId": this.proformaCardHeaderId,
        "proformaCardHeaderName": this.proformaCardHeaderName,
        "reviewedReSubmited": false,
        "reviewed": false,
        "reviewedDescription": this.newInvoiceCreation.value.reviewedDescriptionEdit,

        // "bankDetails":{
        //     "accountName":this.newInvoiceCreation.value.accountName,
        //     "bank":this.newInvoiceCreation.value.bank,
        //     "accountNumber":this.newInvoiceCreation.value.accountNumber,
        //     "branch":this.newInvoiceCreation.value.branch,
        //     "ifscCode":this.newInvoiceCreation.value.ifscCode
      };
      console.log('Payload sent to backend:', updateobj);
      this.spinner.show()
      this.service.UpdateInvoice(updateobj, this.selectedInvoice.originalUniqueId).subscribe((response: any) => {
        console.log("updateInvoice", response);
        this.spinner.hide()
        const resp = response.updatedInvoice;
        if (resp) {

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
            text: response.message,
            icon: 'success',
            showConfirmButton: true
          });

          this.modalService.dismissAll();
          this.verifyedInvoice(this.invoiceData)

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
  verifyedInvoice(invoice) {
    console.log("invoice", invoice)
    let obj = {
      "originalUniqueId": invoice.originalUniqueId,
      "reviewed": false,
      "reviewedReSubmited": true
    }
    this.spinner.show()
    this.service.verifyedAndUpdated(obj).subscribe(
      (response: any) => {
        console.log('Response:', response);
        this.spinner.hide()
        this.modalService.dismissAll();
        // Reload the route
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['InvoiceDecision']); // Replace 'parent' with your actual route
    });
      },
      (error) => {
        // Handle API errors
        Swal.fire('Error!', 'Failed to update status. Please try again.', 'error');
        console.error('Approval error:', error);
        this.spinner.hide()
      }
    );



  }
  convertToUpperCase(event: any) {
    event.target.value = event.target.value.toUpperCase();
  }

}
