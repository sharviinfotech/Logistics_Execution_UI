import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NumberToWordsService } from 'src/app/number-to-words.service';
import Swal from 'sweetalert2';
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


@Component({
  selector: 'app-invoice-layout',
  templateUrl: './invoice-layout.component.html',
  styleUrl: './invoice-layout.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  standalone: true
})
export class InvoiceLayoutComponent {
 creationInvoiceLayout!: FormGroup;
   showNewInvoice = false;
   panForm: FormGroup;
   showImage1: boolean = false;     
   showImage2: boolean = false;  
   activeTab: string = '';  // This will hold the name of the active tab
   logoUrl: string | null = null;
   isHoveringLogo: boolean = false;
   isHoveringRemove: boolean = false;
   
 
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
   chargeItems: ChargeItem[] = [
    {
          description: '',
          units: '',  // Only for the first item
          rate: null,
          amount: null
        },
   ];
  //  taxItems: TaxItem[] = [];
   taxItems: TaxItem[] = [
     {
       description: 'CGST @ 9%',
       percentage: 9,
       amount: 0
     },
     {
       description: 'SGST/UDST @ 9%',
       percentage: 9,
       amount: 0
     },
     {
       description: 'IGST @ 18%',
       percentage: 0,
       amount: 0
     }
   ];
   show:boolean=true
   subtotal: number;
   grandTotal: number;
   amountInWords: string = '';
 
   @ViewChild('logoInput') logoInput!: ElementRef;
   allInvoiceList: any;
  loginData: any;
  
 
   constructor(private fb: FormBuilder, private numberToWordsService:NumberToWordsService,private service:GeneralserviceService,private spinner: NgxSpinnerService) {
    this.creationInvoiceLayout = this.fb.group({
      invoiceHeader: [''],
      ProformaCustomerName: [''],
      ProformaAddress: [''],
      ProformaCity: [''],
      ProformaSate: [''],
      ProformaPincode: [''], 
      ProformaGstNo: [''],
      ProformaPanNO: ['',],
      ProformaInvoiceNumber: [''],
      ProformaInvoiceDate: [''],
      ProformaPanNumber: [''],
      ProformaGstNumber: [''],
      proformatypeOfAircraft: [''],
      proformaseatingcapasity: [''],
      bookingdetailsdateofjourney: [''],
      bookingdetailssector: [''],
      bookingdetailsbillingflyingtime: [''],
      notes: [''],
      bookingdateOfjourny: [''],
      bookingsector: [''],
      bookingbillingflyingtime: [''],
      // accountName: [''],
      // bankname: [''],
      // accountNumber: [''],
      // branch:[''],
      // ifscCode: ['']
    });
   }
   ngOnInit(): void {
    this.loginData = this.service.getLoginResponse()
    console.log("this.loginData ", this.loginData)
 this.getAllInvoice()
 
   }
 
   getAllInvoice(){
    this.spinner.show()
    let obj={
      "userActivity":this.loginData.data.userActivity
  }
     this.service.getAllInvoice(obj).subscribe((res:any)=>{
       console.log("getAllInvoice",res);
       this.spinner.hide()
       this.allInvoiceList = res.invoices;
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
 
   // Method to select and show an invoice
   selectInvoice(invoice: any) {
     this.chargeItems = [];
     this.taxItems = [];
     this.subtotal = 0;
     this.grandTotal = 0
     this.selectedInvoice = null
     this.selectedInvoice = invoice;
     console.log("this.selectedInvoice",this.selectedInvoice)
     this.isEditing = false;
     this.activeTab = "Edit"
     this.show = false;
     this.creationInvoiceLayout.patchValue({
       invoiceHeader: this.selectedInvoice.header.invoiceHeader,
       ProformaCustomerName: this.selectedInvoice.header.ProformaCustomerName,
       ProformaAddress: this.selectedInvoice.header.ProformaAddress ,
       ProformaCity: this.selectedInvoice.header.ProformaCity,
       ProformaSate: this.selectedInvoice.header.ProformaSate,
       ProformaPincode: this.selectedInvoice.header.ProformaPincode,
       ProformaGstNo: this.selectedInvoice.header.ProformaGstNo,
       ProformaPanNO: this.selectedInvoice.header.ProformaPan,
       ProformaInvoiceNumber: this.selectedInvoice.header.ProformaInvoiceNumber,
       ProformaInvoiceDate: this.selectedInvoice.header.ProformaInvoiceDate,
       proformaPanNumber:this.selectedInvoice.header.ProformaPanNO,
       ProformaGstNumber: this.selectedInvoice.header.ProformaGstNumber,
       proformatypeOfAircraft: this.selectedInvoice.header.ProformaTypeOfAircraft,
       proformaseatingcapasity: this.selectedInvoice.header.ProformaSeatingCapasity,
       bookingdetailsdateofjourney:this.selectedInvoice.header.BookingDateOfJourny ,
       bookingdetailssector: this.selectedInvoice.header.bookingdetailssector,
       bookingdetailsbillingflyingtime: this.selectedInvoice.header.BookingBillingFlyingTime,
       notes: this.selectedInvoice.header.notes,
       bookingdateOfjourny:this.selectedInvoice.header.BookingDateOfJourny ,
       bookingsector: this.selectedInvoice.header.BookingSector,
       bookingbillingflyingtime: this.selectedInvoice.header.BookingBillingFlyingTime,
       accountName: this.selectedInvoice.bankDetails.accountName,
       bankname: this.selectedInvoice.bankDetails.bank,
       accountNumber: this.selectedInvoice.bankDetails.accountNumber,
       branch:this.selectedInvoice.bankDetails.branch,
       ifscCode:this.selectedInvoice.bankDetails.ifscCode 
     })
 
     this.chargeItems = this.selectedInvoice .chargesList;
     this.taxItems = this.selectedInvoice.taxList;
     this.subtotal = this.selectedInvoice.subtotal;
     this.grandTotal = this.selectedInvoice.grandTotal
     this.amountInWords = this.selectedInvoice.amountInWords
     this.logoUrl = this.selectedInvoice.header.invoiceImage
 
 
   }
   resetAll(){
     this.amountInWords =  ""
     this.chargeItems = [];
     this.taxItems = [];
     this.subtotal = 0;
     this.grandTotal = 0
     this.selectedInvoice = null
     this.creationInvoiceLayout.patchValue({
       invoiceHeader: "",
       ProformaCustomerName: "",
       ProformaAddress: "",
       ProformaCity: "",
       ProformaSate: "",
       ProformaPincode: "",
       ProformaGstNo: "",
       ProformaPanNO: "",
       ProformaInvoiceNumber: "",
       ProformaInvoiceDate: "",
       proformaPanNumber:"",
       ProformaGstNumber: "",
       proformatypeOfAircraft: "",
       proformaseatingcapasity: "",
       bookingdetailsdateofjourney:"" ,
       bookingdetailssector: "",
       bookingdetailsbillingflyingtime: "",
       notes: "",
       bookingdateOfjourny:"" ,
       bookingsector: "",
       bookingbillingflyingtime: "",
       accountName: "",
       bankname: "",
       accountNumber:"",
       branch:"",
       ifscCode:"" 
     })
   }
   backButton(){
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
     this.activeTab = tabName;
     console.log("this.activeTab",this.activeTab);
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
    this.logoUrl = null;
  }

 
   addChargeItem() {
     this.chargeItems.push({
       description: '',
       rate: 0,
       amount: 0
     });
   }
 
   addTaxItem(): void {
     this.taxItems.push({ description: '', percentage: 0, amount: 0 });
   }
 
   calculateTotals() {
     this.subtotal =0
     this.grandTotal=0
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
 
 // Convert amount to words
 this.amountInWords = this.numberToWordsService.convert(this.grandTotal);
 
 // Debugging logs
 console.log("chargeItems", this.chargeItems);
 console.log("taxItems", this.taxItems);
 console.log("subtotal", this.subtotal);
 console.log("grandTotal", this.grandTotal);
 console.log("amountInWords", this.amountInWords);
 
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
 
   createLayout(): void {
    console.log("this.activeTab",this.activeTab)
     if (this.creationInvoiceLayout.valid) {
      
      let obj = {
        "invoiceLayoutId":Number(this.activeTab),
        "header": {
            "invoiceHeader": this.creationInvoiceLayout.value.invoiceHeader,
            "invoiceImage": this.logoUrl,
            "ProformaCustomerName": this.creationInvoiceLayout.value.ProformaCustomerName,
            "ProformaAddress": this.creationInvoiceLayout.value.ProformaAddress,
            "ProformaCity": this.creationInvoiceLayout.value.ProformaCity,
            "ProformaSate": this.creationInvoiceLayout.value.ProformaSate,
            "ProformaPincode": this.creationInvoiceLayout.value.ProformaPincode,
            "ProformaGstNo": this.creationInvoiceLayout.value.ProformaGstNo,
            "ProformaPanNO": this.creationInvoiceLayout.value.ProformaPanNO,
            "ProformaInvoiceNumber": this.creationInvoiceLayout.value.ProformaInvoiceNumber,
            "ProformaInvoiceDate": this.creationInvoiceLayout.value.ProformaInvoiceDate,
            "ProformaPan": this.creationInvoiceLayout.value.ProformaPan,
            "ProformaGstNumber": this.creationInvoiceLayout.value.ProformaGstNumber,
            "ProformaTypeOfAircraft": this.creationInvoiceLayout.value.proformatypeOfAircraft,
            "ProformaSeatingCapasity": this.creationInvoiceLayout.value.proformaseatingcapasity,
            "notes": this.creationInvoiceLayout.value.notes,
            "BookingDateOfJourny": this.creationInvoiceLayout.value.bookingdateofjourney,
            "BookingSector": this.creationInvoiceLayout.value.bookingsector,
            "BookingBillingFlyingTime": this.creationInvoiceLayout.value.bookingbillingflyingtime
        },
        "chargesList": this.chargeItems,
        "taxList": this.taxItems,
        "subtotal": this.subtotal,
        "grandTotal": this.grandTotal,
        "amountInWords":this.amountInWords,
        // "bankDetails":{
        //     "accountName":this.creationInvoiceLayout.value.accountName,
        //     "bank":this.creationInvoiceLayout.value.bank,
        //     "accountNumber":this.creationInvoiceLayout.value.accountNumber,
        //     "branch":this.creationInvoiceLayout.value.branch,
        //     "ifscCode":this.creationInvoiceLayout.value.ifscCode
        // }
    }
    this.spinner.show()
      this.service.invoiceTemplate(obj).subscribe((res:any)=>{
        this.spinner.hide()
        console.log("res",res)
         Swal.fire({
            text: res.message,
            icon: 'success',
            showConfirmButton: true
          });


      },error =>{
        this.spinner.hide()
      })
     } else {
      this.spinner.hide()
       console.log('Form is invalid');
     }
   }
        
   numbersOnly(event:any) {
     const charCode = event.charCode;
     if (!(charCode >= 48 && charCode <= 57) && ![8, 9, 37, 39, 46].includes(charCode)) {
       event.preventDefault();
     }
   }
 
   Update(): void {
     if (this.creationInvoiceLayout.valid) {
       console.log('Invoice Updated', this.creationInvoiceLayout.value);
       // Implement update logic here
     } else {
       console.log('Form is invalid');
     }
   }
 
 
 

  
  // Function to set active tab
  setActiveTab(tab: string) {
   this.activeTab = tab;
   console.log("this.activeTab",this.activeTab)
 }
openDialog(arg0: string) {
throw new Error('Method not implemented.');
}
  
 
  
    
}
