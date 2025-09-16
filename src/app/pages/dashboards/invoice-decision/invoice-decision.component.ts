import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxPrintModule } from 'ngx-print';
import Swal from 'sweetalert2';
import { Component, ElementRef, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ImageService } from 'src/app/image.service';
import { GlobalReviewEditComponent } from '../../dashboards/global-review-edit/global-review-edit.component';
import { NumberToWordsService } from 'src/app/number-to-words.service';

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
  proformaCardHeaderName:string
}

@Component({
  selector: 'app-invoice-decision',
  templateUrl: './invoice-decision.component.html',
  styleUrl: './invoice-decision.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPrintModule],
  standalone: true,
})
export class InvoiceDecisionComponent {
  activeTab: 'View' | 'Edit' = 'View';
  @ViewChild('approveModal') approveModal: TemplateRef<any>;
  @ViewChild('afterDecision') afterDecision: TemplateRef<any>;
  @ViewChild('reviewedInvoice') reviewedInvoice: TemplateRef<any>;
  @ViewChild('reviewedOpen') reviewedOpen: TemplateRef<any>;
  @ViewChild('editForm') editForm: TemplateRef<any>;
  loginData: any; // Example login data  reviewedOpen
  approveForm!: FormGroup;
  submit: boolean = false;
  statesList: any[] = [];
  invoiceItem: any;
  show: boolean = true
  selectedAction: string = '';
  subtotal: number;
  grandTotal: number;
  amountInWords: string = '';
  allInvoiceList: any;
  originalUniqueId: number;
  reSubmitInvoice: boolean;
  reSubmitInvoiceStatus: any;
  reason: any;
  proformaCardHeaderName: any;
  proformaCardHeaderId: null;
  invoiceApprovedOrRejectedByUser: any;
  invoiceApprovedOrRejectedDateAndTime: any;
  selectedInvoice: any;
  chargeItems: ChargeItem[] = [];
   taxItems: TaxItem[] = [];


 

  remark: string = '';
  invoice = {
    invoiceNumber: 'INV-5678',
    invoiceDate: '2025-01-25',
    header: {
      toName: 'John Doe'
    },
    amount: '$500'
  };
  itemsPerPage: number = 10;
  pageSize = 10; 
  currentPage = 1;
  totalItems = 0; 
totalPages: number;
paginatedInvoices: any[] = [];
 
  pages: number[] = []; 
  pagedInvoiceList: any[] = [];
  decisionTaking: any;
  showSharePopup: boolean = false;
  logoUrl: string;
  InvoiceLogo: string;
   modalRef: NgbModalRef;
  signature: string;
  // reviewedDescription:any
  enableDescription: boolean=true;
  invoices: any;
  newInvoiceCreation: any;
  invoiceService: any;
  activeModal: any;
  reviewedDescription: string;
  // paginatedInvoices: any;
  
  constructor(private fb: FormBuilder,  private numberToWordsService: NumberToWordsService,public service: GeneralserviceService, private spinner: NgxSpinnerService, private modalService: NgbModal,private imageService: ImageService,) {
    this.createForm();
    this.service = service;

  }
  createForm() {
    this.approveForm = this.fb.group({
      remark: [''], // Default empty, validation added dynamically
      invoiceApprovedOrRejectedByUser: [''],
      invoiceApprovedOrRejectedDateAndTime:['']
    });
  }
  get f() {
    return this.approveForm.controls;
  }
  backButton() {
    // Logic to handle the "Back" button click
    // For example, close the modal or reset the form
    this.activeTab = 'View'; // Assuming 'View' is the previous tab
    this.modalService.dismissAll(); // Close the modal
  }

  ngOnInit(): void {
    this.newInvoiceCreation = this.fb.group({
      ProformaCustomerName: ['', Validators.required],
      notes: [''],
      ProformaAddress: ['', Validators.required],
      ProformaCity: ['', Validators.required],
      ProformaState: ['', Validators.required],
      ProformaPincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      ProformaGstNo: [''], 
      ProformaPanNO: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      ProformaInvoiceNumber: ['', Validators.required],
      ProformaInvoiceDate: ['', [Validators.required, this.customDateValidator]],      
      ProformaPan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      ProformaGstNumber: ['', Validators.required],
      proformatypeOfAircraft: ['', Validators.required],
      proformaseatingcapasity: ['', Validators.required],
      bookingdateOfjourny: [''], // Handle date input
      bookingsector: ['', Validators.required],
      bookingbillingflyingtime: ['', Validators.required], 
      reviewedDescriptionEdit: ['']  
      // ... other form controls with their validators
    });
    
    
    this.loginData = this.service.getLoginResponse()
    console.log("this.loginData ", this.loginData)
    this.getStates();
    this.getAllInvoice();
    this.calculateTotalPages();
   
  }


calculateTotalPages() {
  this.totalPages = Math.ceil(this.allInvoiceList.length / this.pageSize);
  this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
}


onPageSizeChange() {
  this.currentPage = 1;
  this.calculateTotalPages();
  this.pageChanged(1);
}

loadInvoices() {
  this.totalPages = Math.ceil(this.allInvoiceList.length / this.itemsPerPage);
  this.calculateTotalPages();
  this.updatePagination();
}

pageChanged(newPage: number) {
  if (newPage >= 1 && newPage <= this.totalPages) {
    this.currentPage = newPage;
    this.updatePagination();
  }
}
updatePagination() {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.paginatedInvoices = this.allInvoiceList.slice(startIndex, endIndex);
  console.log("Paginated Invoices: ", this.paginatedInvoices);
}
resetPagination() {
  this.service.page = 1; // Reset the page number to 1
}

  customDateValidator(control: any): { [key: string]: boolean } | null {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    return dateRegex.test(control.value) ? null : { invalidDate: true };
  }

  // getAllInvoice() {
  //   this.allInvoiceList = []
  //   this.spinner.show()
  //   let obj={
  //     "userActivity":this.loginData.data.userActivity
  // }
  //   this.service.getAllInvoice(obj).subscribe((res: any) => {
  //     console.log("getAllInvoice", res);
  //     this.spinner.hide()
  //     this.allInvoiceList = res.data;
  //   }, error => {
  //     this.spinner.hide()
  //   })
  // }
  getAllInvoice() {
    this.allInvoiceList = []
   
      // this.allInvoiceList = data;
      // this.calculateTotalPages();
      // this.updatePagination();
    this.spinner.show()
    let obj={
      "userActivity":""
  }
    this.service.getAllInvoice(obj).subscribe((res: any) => {
      console.log("getAllInvoice", res);
      this.spinner.hide()
      this.allInvoiceList = res.data;
      // this.uniqueInvoices = [...this.allInvoiceList];

      // console.log("this.uniqueInvoices", this.uniqueInvoices)
      this.updatePagination();
      this.calculateTotalPages();
    }, error => {
      this.spinner.hide()
    })
  }
  openSharePopup(invoice: any) {
    // this.showSharePopup = true;
    this.selectedInvoice = null;
    this.selectedInvoice = invoice;
    this.modalService.open(this.reviewedOpen, { size: 'XL' })

  }
  closeInvoice() {
    this.modalService.dismissAll(); 
  }
    openGlobalReviewPopup(invoice: any) {
      this.selectedInvoice = invoice;
    
      // Open GlobalReviewEditComponent in a modal
      this.modalRef = this.modalService.open(GlobalReviewEditComponent, {  backdrop: 'static', 
        keyboard: false,size:'lg' });
     
    
      // Pass data to the component
      this.modalRef.componentInstance.invoiceData = this.selectedInvoice;
    
      // Handle modal close
      this.modalRef.componentInstance.closeModal.subscribe(() => {
        this.modalRef.close();
      });
    }
  
//   openEditPopup(invoice: any) {
//     this.selectedInvoice = null
//     this.selectedInvoice = invoice; 
//     this.activeTab = 'Edit';
//     console.log('Invoice data:', invoice);
//     this.newInvoiceCreation.patchValue({
//       // invoiceHeader: this.selectedInvoice.header.invoiceHeader,
//       ProformaCustomerName: this.selectedInvoice.header.ProformaCustomerName,
//       ProformaAddress: this.selectedInvoice.header.ProformaAddress,
//       ProformaCity: this.selectedInvoice.header.ProformaCity,
//       ProformaState: this.selectedInvoice.header.ProformaState,
//       ProformaPincode: this.selectedInvoice.header.ProformaPincode,
//       ProformaGstNo: this.selectedInvoice.header.ProformaGstNo,
//       ProformaPanNO: this.selectedInvoice.header.ProformaPanNO,
//       ProformaInvoiceNumber: this.selectedInvoice.invoiceUniqueNumber,
//       ProformaInvoiceDate: this.selectedInvoice.header.ProformaInvoiceDate,
//       ProformaPan: this.selectedInvoice.header.ProformaPan,
//       ProformaGstNumber: this.selectedInvoice.header.ProformaGstNumber,
//       proformatypeOfAircraft: this.selectedInvoice.header.ProformaTypeOfAircraft,
//       proformaseatingcapasity: this.selectedInvoice.header.ProformaSeatingCapasity,
//       notes: this.selectedInvoice.header.notes,
//       bookingdateOfjourny: this.selectedInvoice.header.BookingDateOfJourny,
//       bookingsector: this.selectedInvoice.header.BookingSector,
//       bookingbillingflyingtime: this.selectedInvoice.header.BookingBillingFlyingTime,
//       reviewedDescriptionEdit:  this.selectedInvoice.reviewedDescription,
//       // accountName: this.selectedInvoice.bankDetails.accountName,
//       // bankname: this.selectedInvoice.bankDetails.bank,
//       // accountNumber: this.selectedInvoice.bankDetails.accountNumber,
//       // branch:this.selectedInvoice.bankDetails.branch,
//       // ifscCode:this.selectedInvoice.bankDetails.ifscCode 
//     })

//     this.chargeItems = this.selectedInvoice.chargesList;
//     this.taxItems = this.selectedInvoice.taxList;
//     this.subtotal = this.selectedInvoice.subtotal;
//     this.grandTotal = this.selectedInvoice.grandTotal
//     this.amountInWords = this.selectedInvoice.amountInWords
//     this.logoUrl = this.selectedInvoice.header.invoiceImage
//     this.InvoiceLogo = this.selectedInvoice.header.invoiceHeader
//     this.reSubmitInvoiceStatus =this.selectedInvoice.status 
//     this.reason =this.selectedInvoice.reason ,
//     this.invoiceApprovedOrRejectedByUser =this.selectedInvoice.invoiceApprovedOrRejectedByUser ,
//     this.invoiceApprovedOrRejectedDateAndTime =this.selectedInvoice.invoiceApprovedOrRejectedDateAndTime,
//     this.proformaCardHeaderId = this.selectedInvoice.proformaCardHeaderId,
//     this.proformaCardHeaderName  =this.selectedInvoice.proformaCardHeaderName 
    
// if(this.logoUrl == ''|| this.logoUrl == null){
//   this.logoUrl = this.imageService.getBase64FlightLogo(); 
// }
// if(this.InvoiceLogo== ''|| this.InvoiceLogo == null){
//   this.InvoiceLogo = this.imageService.getBase64WorldLogo(); 

// }
//     console.log("this.selectedInvoice.header.invoiceUniqueNumber", this.selectedInvoice.invoiceUniqueNumber)
//     console.log("this.newInvoiceCreation", this.newInvoiceCreation.value.ProformaInvoiceNumber)
//     this.modalService.open(this.editForm, { size: 'xl' }); 
// }
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
    reviewedDescriptionEdit:"",
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


  closeSharePopup() {
    this.showSharePopup = false;
    this.selectedInvoice = null;
  }
  // ApproveOrReject(invoice: any,decision) {
  //   this.decisionTaking = null
  //   this.decisionTaking = decision
  //   if(decision == 'Approved'){
  //     this.invoice = invoice;
  //     this.modalService.open(this.approveModal,{size:'sm'});
  //   }else if(decision == 'Rejected'){
  //     this.invoice = invoice;
  //     this.modalService.open(this.approveModal,{size:'sm'});
  //   }

  // }

  // openModal(action: string, invoice: any) {
  //   this.selectedAction = action;
  //   this.selectedInvoice = invoice;
  
  //   // Reset form and validation
  //   this.approveForm.reset();
  //   this.submit = false;
  
  //   if (action === 'Rejected') {
  //     this.approveForm.get('remark')?.setValidators([Validators.required]);
  //   } else {
  //     this.approveForm.get('remark')?.clearValidators();
  //   }
  //   this.approveForm.get('remark')?.updateValueAndValidity();
  
  //   // Open the modal
  //   this.modalService.open(this.approveModal, { size: 'sm' });
  
  //   // Ensure parent is not hidden
  //   setTimeout(() => {
  //     document.body.removeAttribute('aria-hidden');
  //   }, 100);
  // }
  
  // afterDecisionOpen(invoice) {
  //   this.approveForm.reset()
  //   console.log("invoice", invoice);
  //   this.approveForm.patchValue({
  //     remark: invoice.reason,
  //     invoiceApprovedOrRejectedByUser: invoice.invoiceApprovedOrRejectedByUser,
  //     invoiceApprovedOrRejectedDateAndTime:invoice.invoiceApprovedOrRejectedDateAndTime
  //   })
  //   this.modalService.open(this.afterDecision, { size: 'lg' })
  // }
  // approveButton() {
  //   if (this.selectedAction === 'Approved') {
  //     this.ApproveOrReject(this.selectedInvoice, 'Approved');
  //     this.modalService.dismissAll();
  //   }
  // }

  // rejectButton() {
  //   this.submit = true;

  //   if (this.approveForm.invalid) {
  //     return;
  //   }

  //   this.ApproveOrReject(this.selectedInvoice, 'Rejected', this.approveForm.value.remark);
  //   this.modalService.dismissAll();
  // }

  ApproveOrReject(invoice: any, status: string, remark?: string): void {
    console.log(`Invoice: ${invoice}, Status: ${status}, Remark: ${''}`);
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24-hour format
    }).replace(',', ''); // Remove the comma between date and time

    const reqBody = {
      originalUniqueId: invoice.originalUniqueId, // Access invoice ID
      status: status, // Set status dynamically
      reason: this.approveForm.value.remark, // Default to 'N/A' if no remark is provided
      invoiceApprovedOrRejectedByUser: this.loginData?.data.userName,
      invoiceApprovedOrRejectedDateAndTime: formattedDateTime,
      reviewedReSubmited:false 

    };

    console.log('Payload sent to backend:', reqBody);
    this.service.invoiceApprovedOrRejected(reqBody).subscribe(
      (response: any) => {
        console.log('Response:', response); // Log the backend response

        // Ensure response structure is valid
        if (response.status == 200) {

          Swal.fire({
            text: response.message,
            icon: 'success',
            confirmButtonText: 'OK',
          });
          this.getAllInvoice()
          
        } else {
          Swal.fire({
            text: response.message,
            icon: 'error',
            confirmButtonText: 'OK',
          });
        }
      },
      (error) => {
        // Handle API errors
        Swal.fire('Error!', 'Failed to update status. Please try again.', 'error');
        console.error('Approval error:', error);
      }
    );




  };
  openModal(action: string, invoice: any) {
    this.selectedAction = action;
    this.selectedInvoice = invoice;

    // Reset form and validation
    this.approveForm.reset();
    this.submit = false;

    if (action === 'Rejected') {
      this.approveForm.get('remark')?.setValidators([Validators.required]);
    } else {
      this.approveForm.get('remark')?.clearValidators();
    }
    this.approveForm.get('remark')?.updateValueAndValidity();

    this.modalService.open(this.approveModal, { size: 'sm' })
  }
  afterDecisionOpen(invoice) {
    console.log("invoice",invoice.invoiceApprovedOrRejectedByUser,invoice.invoiceApprovedOrRejectedDateAndTime)
    if( invoice.invoiceApprovedOrRejectedByUser && invoice.invoiceApprovedOrRejectedDateAndTime){
      this.approveForm.reset()
      console.log("invoice", invoice);
      this.approveForm.patchValue({
        remark: invoice.reason?invoice.reason:'N/A',
        invoiceApprovedOrRejectedByUser: invoice.invoiceApprovedOrRejectedByUser,
        invoiceApprovedOrRejectedDateAndTime:invoice.invoiceApprovedOrRejectedDateAndTime
      })
      this.modalService.open(this.afterDecision, { size: 'lg' })
    }else{

    }
    
  }
  approveButton() {
    console.log("approveButton",this.selectedAction)
    if (this.selectedAction === 'Approved') {
      this.ApproveOrReject(this.selectedInvoice, 'Approved');
      this.modalService.dismissAll();
    }
  }

  rejectButton() {
    console.log("approveButton",this.selectedAction,this.approveForm)
    
    if (this.approveForm.invalid) {
      this.submit = true;
      return;
    }

    this.ApproveOrReject(this.selectedInvoice, 'Rejected', this.approveForm.value.remark);
    this.modalService.dismissAll();
  }





  // in this screen below is not required
 selectInvoice(invoice: any) {
    this.invoiceItem = null
    this.invoiceItem = invoice
    const invoiceItem = invoice;
    console.log("invoice", invoice)
    console.log("this.invoiceItem", this.invoiceItem.invoiceReferenceNo);
    console.log("this.invoiceItem.header.status", this.invoiceItem.header.status)
    
    if(this.invoiceItem.status == "Approved") {
      Swal.fire({
                  text: 'The selected invoice has been approved. Do you want to print the invoice?',
                  icon: 'question',
                  showCancelButton: true,
                  showConfirmButton: true,
                  confirmButtonText: 'Print',
                }).then((result) => {
                  if (result.isConfirmed) {
                    console.log('invoiceItem.proformaCardHeaderId',invoiceItem.proformaCardHeaderId)
                    // Check conditions before calling print functions
                    if (invoiceItem.proformaCardHeaderId === "PQ") {
                      this.generateInvoiceHTMLProfoma1(invoiceItem);
                      // Additional checks if needed
                    }else if (invoiceItem.proformaCardHeaderId === "TAX") {
                      this.generateInvoiceHTMLProfoma2(invoiceItem);
                    } else {
                      Swal.fire({
                        text: "No valid invoice type selected for printing.",
                        icon: "warning",
                      });
                    }
                  }
                });
    }
    if(this.invoiceItem.status == "Amount Received") {
      Swal.fire({
                 text: 'The selected invoice Amount  has been Received. Do you want to print the invoice?',
                 icon: 'question',
                 showCancelButton: true,
                 showConfirmButton: true,
                 confirmButtonText: 'Print',
               }).then((result) => {
                 if (result.isConfirmed) {
                   if (result.isConfirmed) {
                     console.log('invoiceItem.proformaCardHeaderId',invoiceItem.proformaCardHeaderId)
                     // Check conditions before calling print functions
                     if (invoiceItem.proformaCardHeaderId === "PQ") {
                       this.generateInvoiceHTMLProfoma1(invoiceItem);
                       // Additional checks if needed
                     }else if (invoiceItem.proformaCardHeaderId === "TAX") {
                       this.generateInvoiceHTMLProfoma2(invoiceItem);
                     } else {
                       Swal.fire({
                         text: "No valid invoice type selected for printing.",
                         icon: "warning",
                       });
                     }
                   }
         
                 }
               });
    }
    if (this.invoiceItem.status == "Rejected") {
      
      console.log("If rejected")
      Swal.fire({
        // title: 'question',
        text: 'The selected invoice has been rejected, so printing is not possible.',
        icon: 'info',
        // showCancelButton: true,
        showConfirmButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          this.invoiceItem = invoice
          console.log("this.invoiceItem", this.invoiceItem)
        } else {
          this.invoiceItem = invoice
          console.log("this.invoiceItem", this.invoiceItem)
        }
      });
    } else if (this.invoiceItem.status == "Pending") {
      
      console.log("If pending")
      Swal.fire({
        // title: 'question',
        text: 'The invoice is pending, so please proceed with the process.',
        icon: 'info',
        showCancelButton: false,
        showConfirmButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
        } else {
          this.invoiceItem = invoice
          console.log("this.invoiceItem", this.invoiceItem)
        }
      });
    }
    else if (this.invoiceItem.status == "Rejected_Reversed") {
      
      console.log("If pending")
      Swal.fire({
        // title: 'question',
        text: 'The selected invoice is Rejected Reversed, so please proceed with the process.',
        icon: 'info',
        showCancelButton: false,
        showConfirmButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
        } else {
          this.invoiceItem = invoice
          console.log("this.invoiceItem", this.invoiceItem)
        }
      });
    }
   
  }

  generateInvoiceHTMLProfoma1(invoiceItem: InvoiceItem) {
 
    this.logoUrl = this.imageService.getBase64FlightLogo();
    this.InvoiceLogo = this.imageService.getBase64WorldLogo();
    this.signature = this.imageService.getBase64Signature();
    const invoiceHTML = `
  
  <html>
  <head>
  
  <style>
      .invoice-container {
  margin: 10px;
  padding: 20px;
  border: 1px solid #ccc;
  background: #fff;
  font-family: Arial, sans-serif;
  }
   body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 5px;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 12px;
            }
       
          .invoice-container {
            width: 100%;
            margin: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: #fff;
            box-sizing: border-box;
        }
  
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Distributes space evenly */
  }
  
  .header-section .logo {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content vertically */
  }
  
  .header-section .left-logo {
    text-align: left; /* Align text to the left */
  }
  
  .header-section .right-logo {
    text-align: right; /* Align text to the right */
  }
  
  .header-section .company-name {
    text-align: center; /* Center the company name */
    flex-grow: 1; /* Allow the company name to take up available space */
  }
  
  .header-section img {
    max-width: 100px; /* Adjust as needed */
    height: auto;
  }
   .booking-details {
      border: 1px solid #ccc;
      width: 100%;
    }
  
    .booking-header {
      background-color: rgb(91, 85, 130);
      padding: 5px;
      color:white;
        text-align: center;
      border-bottom: 1px solid #ccc;
    }
  
    .booking-data {
          padding: 5px;
    width: 100%;
    display: flex;
    font-size: 14px;
    }
  
    .data-item {
      display: inline-block;
      padding-right: 10px;
      border-right: 1px solid #ccc;
    }
  
    .data-item:last-child {
      border-right: none;
      padding-right: 0;
    }
     .text-center{
       text-align: right;
      }
    .orange-background {
   
  background-color: rgb(167, 166, 175);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
    .table-bordered {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 10px;
      // background-color:rgb(193, 205, 217); /* Added background color */
    }
     .table-bordered th {
        border: 1px solid white;
    padding: 2px;
    background: rgb(88 98 145) !important;
    color: white;
    }
  
    .table-bordered td {
    padding: 2px;
    }
    .booking-header bold{
    background-color: rgb(91, 85, 130);
    color: white;
    }
   
  
   
       
    .bold {
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
   .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-top: 10px;
        }
  
        .footer .logo {
            width: 50%;
        }
  
        .footer .logo img {
            width: 100%;
            height: auto;
        }
     
  
  
  
  
  @media print {
    .invoice-container {
  margin: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  background: #fff;
  font-family: Arial, sans-serif;
  }
   body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 5px;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 12px;
            }
              .InvoiceHeader {
    background-color: rgb(181, 179, 200);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
       
          .invoice-container {
            width: 100%;
            margin: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: #fff;
            box-sizing: border-box;
        }
  
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Distributes space evenly */
  }
  
  .header-section .logo {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content vertically */
  }
  
  .header-section .left-logo {
    text-align: left; /* Align text to the left */
  }
  
  .header-section .right-logo {
    text-align: right; /* Align text to the right */
  }
  
  .header-section .company-name {
    text-align: center; /* Center the company name */
    flex-grow: 1; /* Allow the company name to take up available space */
  }
  
  .header-section img {
    max-width: 100px; /* Adjust as needed */
    height: auto;
  }
   .booking-details {
      border: 1px solid #ccc;
      width: 100%;
    }
  
    .booking-header {
      background-color: rgb(88, 98, 145);
      padding: 5px;
      color:white;
        text-align: center;
      border-bottom: 1px solid #ccc;
    }
  
    .booking-data {
          padding: 5px;
    width: 100%;
    display: flex;
    font-size: 14px;
    }
  
    .data-item {
      display: inline-block;
      padding-right: 10px;
      border-right: 1px solid #ccc;
    }
  
    .data-item:last-child {
      border-right: none;
      padding-right: 0;
    }
     .text-center{
       text-align: right;
      }
    .orange-background {
   
     background-color: rgb(127, 127, 136);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
    .table-bordered {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 10px;
      // background-color:rgb(193, 205, 217); /* Added background color */
    }
     .table-bordered th {
        border: 1px solid white;
    padding: 2px;
     background-color: rgb(91, 85, 130);
    color: white;
    }
  
    .table-bordered td {
    padding: 2px;
    }
    .booking-header bold{
    background-color: rgb(88, 98, 145);
    color: white;
    }
   
  
   
       
    .bold {
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
   .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-top: 10px;
        }
  
        .footer .logo {
            width: 50%;
        }
  
        .footer .logo img {
            width: 100%;
            height: auto;
        }
  
  
  </style>
  </head>
  <body>
  <div class="invoice-container">
    <div class="header-section">
           <div class="logo left-logo"><img src="${this.logoUrl}" alt="Invoice Logo"></div>
      <div class="logo"><h3>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h3></div>
            <div class="logo right-logo"><img src="${this.InvoiceLogo}" alt="Company Logo"></div>
    </div>
    <div class="InvoiceHeader">${invoiceItem.proformaCardHeaderName}</div>
    <br>
   
    <table class="table-bordered">
      <tr>
        <th class="bold">TO</th>
        <th class="bold">FROM</th>
      </tr>
      <tr>
        <td>${invoiceItem.header.ProformaCustomerName}<br>${invoiceItem.header.ProformaAddress}<br>${invoiceItem.header.ProformaCity}<br>${invoiceItem.header.ProformaPincode} <br><strong>GST NO:</strong>${invoiceItem.header.ProformaGstNo}<br>
                <strong>PAN NO:</strong> ${invoiceItem.header.ProformaPan}</td>
        <td><strong>INVOICE NO:</strong> ${invoiceItem.invoiceUniqueNumber}<br><strong>DATE: </strong>${invoiceItem.header.ProformaInvoiceDate}<br><strong>PAN NO</strong>:${invoiceItem.header.ProformaPanNO}<br><strong>GST NO: </strong>${invoiceItem.header.ProformaGstNumber}<br><strong>Type of Aircraft</strong>:${invoiceItem.header.ProformaTypeOfAircraft}<br><strong>Seating Capasity</strong>:${invoiceItem.header.ProformaSeatingCapasity}</td>
      </tr>
    </table>
  
    <div class="booking-details">
  <div class="booking-header bold">BOOKING  DETAILS</div>
  <div class="booking-data single-line">
      <div style="width:35%; text-align: center;" ><div class="bold">Date Of Journey</div> <div>03/03/25-04/03/2025</div></div>
      <div style="width:35%; text-align: center;" ><div class="bold">Sector</div> <div>${invoiceItem.header.BookingSector}</div></div>
      <div style="width:30%; text-align: center;" ><div class="bold">Billing Flying Time</div> <div>${invoiceItem.header.BookingBillingFlyingTime}</div></div>
  </div>
  </div>
  
    <table class="table-bordered">
              <thead>
                <tr>
                  <th class="booking-header bold">S.NO</th>
                  <th class="booking-header bold">DESCRIPATION</th>
                  <th class="booking-header bold">UNITS (Hrs.)</th>
                  <th class="booking-header bold">RATE(INR)</th>
                  <th class="booking-header bold">AMOUNT(INR)</th>
                </tr>
              </thead>
              <tbody>
             <tr>
              <td>1</td>
              <td class="bold">CHARGES</td>
              <td class="text-right"></td>
              <td class="text-right"></td>
              <td></td>
            </tr>
                ${invoiceItem.chargesList.map((charge, index) => `
                  <tr>
                   
                     <td class="text-center"></td>
                    <td>${charge.description}</td>
                    <td class="text-center">${charge.units ? charge.units : ''}</td>
                    <td class="text-right">${charge.rate}</td>
                    <td class="text-right">${charge.amount}</td>
                  </tr>
                `).join('')}
               
                <tr>
                <td></td>
                <td></td>
                <td></td>
                  <td  class="text-right bold" style="background-color: rgb(181, 179, 200);">TOTAL</td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">${invoiceItem.subtotal}</td>
                </tr>
                <tr>
              <td>2</td>
                    <td class="bold">TAXES:</td>
                    <td></td>
                    <td></td>
                    <td></td>
              </tr>
  
                ${invoiceItem.taxList.map(tax => `
                  <tr>
                    <td></td>
                    <td>${tax.description}</td>
                    <td></td>
                    <td></td>
                    <td class="text-right">${tax.amount}</td>
                  </tr>
                `).join('')}
  
                <tr>
                <td></td>
                <td></td>
                <td></td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">GRAND TOTAL</td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">${invoiceItem.grandTotal ? invoiceItem.grandTotal.toFixed(2) : '0.00'}</td>
                </tr>
                 <tr>
                    <td colspan="5" class="bold"> ${invoiceItem.amountInWords}</td>
                 </tr>
              </tbody>
            </table>
   
    <table class="table-bordered">
      <tr>
       
        <th class="booking-header bold">BANK DETAILS</th>
     
      </tr>
      <tr>
        <td><strong>Account Name:</strong> RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED<br><strong>Bank:</strong> KOTAK MAHINDRA BANK<br><strong>Account No:</strong> 0745211990<br><strong>Branch:</strong> BANJARAHILLS<br><strong>IFSC Code:</strong> KKBK00007461 (NEFT/RTGS)</td>
       
      </tr>
    </table>
   
  
    <div class="footer">
            <div class="logo"> <p class="bold">Note:</p>
    <p>${invoiceItem.header.notes}</p>
    </div>
            <div class="text-center">
                  <div><h4>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h4></div>
  
                <div  > <img src="${this.signature}" alt="Company Logo" class="logo"></div>
                   Authorised Signatory
               
            </div>
        </div>
   
  </div>
  </body>
  </html>
  
  
    `;
  
    const newWindow = window.open('', '', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
  
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };
  generateInvoiceHTMLProfoma2(invoiceItem: InvoiceItem) {
  
    this.logoUrl = this.imageService.getBase64FlightLogo();
    this.InvoiceLogo = this.imageService.getBase64WorldLogo();
    this.signature = this.imageService.getBase64Signature();
    const invoiceHTML = `
   
  <html>
  <head>
  
  <style>
      .invoice-container {
  margin: 10px;
  padding: 20px;
  border: 1px solid #ccc;
  background: #fff;
  font-family: Arial, sans-serif;
  }
   body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 5px;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 12px;
            }
       
          .invoice-container {
            width: 100%;
            margin: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: #fff;
            box-sizing: border-box;
        }
  
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Distributes space evenly */
  }
  
  .header-section .logo {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content vertically */
  }
  
  .header-section .left-logo {
    text-align: left; /* Align text to the left */
  }
  
  .header-section .right-logo {
    text-align: right; /* Align text to the right */
  }
  
  .header-section .company-name {
    text-align: center; /* Center the company name */
    flex-grow: 1; /* Allow the company name to take up available space */
  }
  
  .header-section img {
    max-width: 100px; /* Adjust as needed */
    height: auto;
  }
   .booking-details {
      border: 1px solid #ccc;
      width: 100%;
    }
  
    .booking-header {
      background-color: rgb(91, 85, 130);
      padding: 5px;
      color:white;
        text-align: center;
      border-bottom: 1px solid #ccc;
    }
  
    .booking-data {
          padding: 5px;
    width: 100%;
    display: flex;
    font-size: 14px;
    }
  
    .data-item {
      display: inline-block;
      padding-right: 10px;
      border-right: 1px solid #ccc;
    }
  
    .data-item:last-child {
      border-right: none;
      padding-right: 0;
    }
     .text-center{
       text-align: right;
      }
    .orange-background {
   
  background-color: rgb(167, 166, 175);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
    .table-bordered {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 10px;
      // background-color:rgb(193, 205, 217); /* Added background color */
    }
     .table-bordered th {
        border: 1px solid white;
    padding: 2px;
    background: rgb(88 98 145) !important;
    color: white;
    }
  
    .table-bordered td {
    padding: 2px;
    }
    .booking-header bold{
    background-color: rgb(91, 85, 130);
    color: white;
    }
   
  
   
       
    .bold {
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
   .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-top: 10px;
        }
  
        .footer .logo {
            width: 50%;
        }
  
        .footer .logo img {
            width: 100%;
            height: auto;
        }
     
  
  
  
  
  @media print {
    .invoice-container {
  margin: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  background: #fff;
  font-family: Arial, sans-serif;
  }
   body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 5px;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 12px;
            }
              .InvoiceHeader {
    background-color: rgb(181, 179, 200);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
       
          .invoice-container {
            width: 100%;
            margin: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: #fff;
            box-sizing: border-box;
        }
  
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Distributes space evenly */
  }
  
  .header-section .logo {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content vertically */
  }
  
  .header-section .left-logo {
    text-align: left; /* Align text to the left */
  }
  
  .header-section .right-logo {
    text-align: right; /* Align text to the right */
  }
  
  .header-section .company-name {
    text-align: center; /* Center the company name */
    flex-grow: 1; /* Allow the company name to take up available space */
  }
  
  .header-section img {
    max-width: 100px; /* Adjust as needed */
    height: auto;
  }
   .booking-details {
      border: 1px solid #ccc;
      width: 100%;
    }
  
    .booking-header {
      background-color: rgb(88, 98, 145);
      padding: 5px;
      color:white;
        text-align: center;
      border-bottom: 1px solid #ccc;
    }
  
    .booking-data {
          padding: 5px;
    width: 100%;
    display: flex;
    font-size: 14px;
    }
  
    .data-item {
      display: inline-block;
      padding-right: 10px;
      border-right: 1px solid #ccc;
    }
  
    .data-item:last-child {
      border-right: none;
      padding-right: 0;
    }
     .text-center{
       text-align: right;
      }
    .orange-background {
   
     background-color: rgb(127, 127, 136);
      font-size: 15px;
      color:white;
      padding: 8px;
      text-align: center;
      font-weight: bold;
    }
    .table-bordered {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 10px;
      // background-color:rgb(193, 205, 217); /* Added background color */
    }
     .table-bordered th {
        border: 1px solid white;
    padding: 2px;
     background-color: rgb(91, 85, 130);
    color: white;
    }
  
    .table-bordered td {
    padding: 2px;
    }
    .booking-header bold{
    background-color: rgb(88, 98, 145);
    color: white;
    }
   
  
   
       
    .bold {
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
   .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-top: 10px;
        }
  
        .footer .logo {
            width: 50%;
        }
  
        .footer .logo img {
            width: 100%;
            height: auto;
        }
  
  
  </style>
  </head>
  <body>
  <div class="invoice-container">
    <div class="header-section">
                <div class="logo right-logo"><img src="${this.InvoiceLogo}" alt="Company Logo"></div>
      <div class="logo"><h3>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h3></div>
                 <div class="logo left-logo"><img src="${this.logoUrl}" alt="Invoice Logo"></div>
  
    </div>
    <div class="InvoiceHeader">${invoiceItem.proformaCardHeaderName}</div>
    <br>
   
    <table class="table-bordered">
      <tr>
        <th class="bold">TO</th>
        <th class="bold">FROM</th>
      </tr>
      <tr>
        <td>${invoiceItem.header.ProformaCustomerName}<br>${invoiceItem.header.ProformaAddress}<br>${invoiceItem.header.ProformaCity}<br>${invoiceItem.header.ProformaPincode} <br><strong>GST NO:</strong>${invoiceItem.header.ProformaGstNo}<br>
                <strong>PAN NO:</strong> ${invoiceItem.header.ProformaPan}</td>
        <td><strong>INVOICE NO:</strong> ${invoiceItem.invoiceUniqueNumber}<br><strong>DATE: </strong>${invoiceItem.header.ProformaInvoiceDate}<br><strong>PAN NO</strong>:${invoiceItem.header.ProformaPanNO}<br><strong>GST NO: </strong>${invoiceItem.header.ProformaGstNumber}<br><strong>Type of Aircraft</strong>:${invoiceItem.header.ProformaTypeOfAircraft}<br><strong>Seating Capasity</strong>:${invoiceItem.header.ProformaSeatingCapasity}</td>
      </tr>
    </table>
  
    <div class="booking-details">
  <div class="booking-header bold">BOOKING  DETAILS</div>
  <div class="booking-data single-line">
      <div style="width:35%; text-align: center;" ><div class="bold">Date Of Journey</div> <div>03/03/25-04/03/2025</div></div>
      <div style="width:35%; text-align: center;" ><div class="bold">Sector</div> <div>${invoiceItem.header.BookingSector}</div></div>
      <div style="width:30%; text-align: center;" ><div class="bold">Billing Flying Time</div> <div>${invoiceItem.header.BookingBillingFlyingTime}</div></div>
  </div>
  </div>
  
    <table class="table-bordered">
              <thead>
                <tr>
                  <th class="booking-header bold">S.NO</th>
                  <th class="booking-header bold">DESCRIPATION</th>
                  <th class="booking-header bold">UNITS (Hrs.)</th>
                  <th class="booking-header bold">RATE(INR)</th>
                  <th class="booking-header bold">AMOUNT(INR)</th>
                </tr>
              </thead>
              <tbody>
             <tr>
              <td>1</td>
              <td class="bold">CHARGES</td>
              <td class="text-right"></td>
              <td class="text-right"></td>
              <td></td>
            </tr>
                ${invoiceItem.chargesList.map((charge, index) => `
                  <tr>
                   
                     <td class="text-center"></td>
                    <td>${charge.description}</td>
                    <td class="text-center">${charge.units ? charge.units : ''}</td>
                    <td class="text-right">${charge.rate}</td>
                    <td class="text-right">${charge.amount}</td>
                  </tr>
                `).join('')}
               
                <tr>
                <td></td>
                <td></td>
                <td></td>
                  <td  class="text-right bold" style="background-color: rgb(181, 179, 200);">TOTAL</td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">${invoiceItem.subtotal}</td>
                </tr>
                <tr>
              <td>2</td>
                    <td class="bold">TAXES:</td>
                    <td></td>
                    <td></td>
                    <td></td>
              </tr>
  
                ${invoiceItem.taxList.map(tax => `
                  <tr>
                    <td></td>
                    <td>${tax.description}</td>
                    <td></td>
                    <td></td>
                    <td class="text-right">${tax.amount}</td>
                  </tr>
                `).join('')}
  
                <tr>
                <td></td>
                <td></td>
                <td></td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">GRAND TOTAL</td>
                  <td class="text-right bold"  style="background-color: rgb(181, 179, 200);">${invoiceItem.grandTotal ? invoiceItem.grandTotal.toFixed(2) : '0.00'}</td>
                </tr>
                 <tr>
                    <td colspan="5" class="bold"> ${invoiceItem.amountInWords}</td>
                 </tr>
              </tbody>
            </table>
   
    <table class="table-bordered">
      <tr>
       
        <th class="booking-header bold">BANK DETAILS</th>
     
      </tr>
      <tr>
        <td><strong>Account Name:</strong> RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED<br><strong>Bank:</strong> KOTAK MAHINDRA BANK<br><strong>Account No:</strong> 0745211990<br><strong>Branch:</strong> BANJARAHILLS<br><strong>IFSC Code:</strong> KKBK00007461 (NEFT/RTGS)</td>
       
      </tr>
    </table>
   
  
    <div class="footer">
            <div class="logo"> <p class="bold">Note:</p>
    <p>${invoiceItem.header.notes}</p>
    </div>
            <div class="text-center">
                  <div><h4>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h4></div>
  
                <div  > <img src="${this.signature}" alt="Company Logo" class="logo"></div>
                   Authorised Signatory
               
            </div>
        </div>
   
  </div>
  </body>
  </html>
  
  
    `;
  
    const newWindow = window.open('', '', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
  
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };
  
 
  generateInvoiceHTML(invoiceItem: InvoiceItem) {
    this.logoUrl = this.imageService.getBase64FlightLogo();
    this.InvoiceLogo = this.imageService.getBase64WorldLogo();
    const invoiceHTML = `
          <html>
            <head>
              <title>Proforma Invoice</title>
              <style>
                /* General styles */
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 5px;
                  background-color: white;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  font-size: 12px;
                }
                .container {
                  width: 100%;
                  max-width: 1000px;
                  margin: 0 auto;
                }
                .orange-background {
                  background-color: rgb(255, 165, 0) !important;
                  padding: 8px;
                  color: black !important;
                  font-weight: bold;
                  text-align: center;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .card-header {
                  background-color: rgb(255, 165, 0) !important;
                  color: black !important;
                  padding: 8px;
                  text-align: center;
                  font-weight: bold;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .booking-title {
                  background-color: rgb(255, 165, 0) !important;
                  color: black !important;
                  padding: 8px;
                  text-align: center;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .table-bordered {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 10px;
                }
                .table-bordered td,
                .table-bordered th {
                  border: 1px solid black;
                  padding: 5px;
                }
                .border {
                  border: 1px solid black;
                  padding: 5px;
                }
                .text-center {
                  text-align: center;
                }
                .text-right {
                  text-align: right;
                }
                .mb-4 {
                  margin-bottom: 1rem;
                }
                .mt-4 {
                  margin-top: 1rem;
                }
                .company-name {
                  text-align: center;
                  margin: 5px 0;
                  font-size: 14px;
                  font-weight: bold;
                }
                .footer-text {
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .header-row {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 10px;
                }
                .logo {
                  height: 90px;
                }
                .notes {
                  margin: 5px 0;
                  font-size: 11px;
                }
                .bank-details {
                  margin-top: 10px;
                }
                .bold {
                  font-weight: bold;
                }
                
                /* Print-specific styles */
                @media print {
                  body {
                    margin: 0;
                    padding: 5px;
                  }
                  .orange-background,
                  .card-header,
                  .booking-title {
                    background-color: rgb(255, 165, 0) !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  thead tr {
                    background-color: rgb(255, 165, 0) !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  thead th {
                    background-color: rgb(255, 165, 0) !important;
                    color: black !important;
                    vertical-align: middle !important;
                    padding: 5px !important;
                    font-weight: bold;
                    text-align: center !important;
                    font-size: 12px !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="border">
                <div class="header-row">
                
                  <div><img src="${this.logoUrl}" alt="Company Logo" class="logo"></div>
                  <div>
                    <img src="${this.InvoiceLogo}" alt="Company Logo" class="logo">
                  </div>
                  <div><img src="${this.logoUrl}" alt="Company Logo" class="logo"></div>
                </div>
                
                <div class="orange-background">
                 Proforma Invoice
                </div>
                
                <table class="table-bordered">
                  <tr><td width="50%">To:</td><td>INVOICE NO : ${invoiceItem.invoiceUniqueNumber}</td></tr>
                  <tr><td>${invoiceItem.header.ProformaCustomerName}</td><td>DATE :${invoiceItem.header.ProformaInvoiceDate}</td></tr>
                  <tr><td>${invoiceItem.header.ProformaAddress}</td><td>PAN :${invoiceItem.header.ProformaPanNO}</td></tr>
                  <tr><td>${invoiceItem.header.ProformaCity}-${invoiceItem.header.ProformaPincode}</td><td>GST NO :${invoiceItem.header.ProformaGstNumber}</td></tr>
                  <tr><td>GST NO : ${invoiceItem.header.ProformaGstNo}</td><td>TYPE OF Aircraft : ${invoiceItem.header.ProformaTypeOfAircraft}</td></tr>
                  <tr><td>PAN NO :${invoiceItem.header.ProformaPan}</td><td>SEATING CAPACITY : ${invoiceItem.header.ProformaSeatingCapasity}</td></tr>
                </table>
    
                <div class="card-header">
                  Charges DETAILS
                </div>
                
                <table class="table-bordered">
                  <tr><td width="50%">Date Of Journey</td><td>${invoiceItem.header.BookingDateOfJourny}</td></tr>
                  <tr><td>SECTOR</td><td>${invoiceItem.header.BookingSector}</td></tr>
                  <tr><td>BILLING FLYING TIME</td><td>${invoiceItem.header.BookingBillingFlyingTime} Hrs.</td></tr>
                </table>
    
                <table class="table-bordered">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Description</th>
                      <th>Units (Hrs.)</th>
                      <th>Rate (INR)</th>
                      <th>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                 <tr>
                  <td>1</td>
                  <td class="bold">Charges</td>
                  <td class="text-right"></td>
                  <td class="text-right"></td>
                  <td></td>
                </tr>
                    ${invoiceItem.chargesList.map((charge, index) => `
                      <tr>
                       
                         <td class="text-center"></td>
                        <td>${charge.description}</td>
                        <td class="text-center">${charge.units}</td>
                        <td class="text-right">${charge.rate}</td>
                        <td class="text-right">${charge.amount}</td>
                      </tr>
                    `).join('')}
                    
                    <tr>
                      <td colspan="4" class="text-right bold">Total</td>
                      <td class="text-right bold">${invoiceItem.subtotal}</td>
                    </tr>
                    <tr>
                  <td>2</td>
                        <td class="bold">Taxes:</td>
                        <td></td>
                        <td></td>
                        <td></td>
                  </tr>
    
                    ${invoiceItem.taxList.map(tax => `
                      <tr>
                        <td></td>
                        <td>${tax.description}</td>
                        <td></td>
                        <td></td>
                        <td class="text-right">${tax.amount}</td>
                      </tr>
                    `).join('')}
    
                    <tr>
                      <td colspan="4" class="text-right bold">Grand Total</td>
                      <td class="text-right bold">${invoiceItem.grandTotal}</td>
                    </tr>
                  </tbody>
                </table>
    
                <div class="border">
                
                <div class="card-header">
                  Bank DETAILS
                </div>
                  <div style="padding: 5px;">
                    <div class="notes">
                      <p><strong>Note:</strong></p>
                      <p>${invoiceItem.header.notes}</p>
                      
                    </div>
                      <div class="header-row">
                        <div>
                          <div style="display: flex; flex-wrap: wrap; margin-bottom: 5px;">
                            <div style="width: 30%; font-weight: bold;">ACCOUNT NAME:</div>
                            <div style="width: 70%;">RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</div>
                          </div>
                          <div style="display: flex; flex-wrap: wrap; margin-bottom: 5px;">
                            <div style="width: 30%; font-weight: bold;">BANK:</div>
                            <div style="width: 70%;">KOTAK MAHINDRA BANK</div>
                          </div>
                          <div style="display: flex; flex-wrap: wrap; margin-bottom: 5px;">
                            <div style="width: 30%; font-weight: bold;">ACCOUNT NO:</div>
                            <div style="width: 70%;">0745211990</div>
                          </div>
                          <div style="display: flex; flex-wrap: wrap; margin-bottom: 5px;">
                            <div style="width: 30%; font-weight: bold;">BRANCH:</div>
                            <div style="width: 70%;">BANJARAHILLS</div>
                          </div>
                          <div style="display: flex; flex-wrap: wrap; margin-bottom: 5px;">
                            <div style="width: 30%; font-weight: bold;">IFSC CODE:</div>
                            <div style="width: 70%;">KKBK00007461(NEFT/RTGS)</div>
                          </div>
                        </div>
                        <div><p class="footer-text">RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</p>
                      <p>Authorised Signatory</p></div>
                      </div>
                    
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

    const newWindow = window.open('', '', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();

      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };
  generateInvoiceHTML1(invoiceItem: InvoiceItem) {

    this.logoUrl = this.imageService.getBase64FlightLogo();
    this.InvoiceLogo = this.imageService.getBase64WorldLogo();
    this.signature = this.imageService.getBase64Signature();
    const invoiceHTML = `
      <html>
        <head>
         
          <style>
           .invoice-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  background: #fff;
  font-family: Arial, sans-serif;
}
 .text-right {
              text-align: right;
            }
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom:2px solid #FFD700
}

.company-details {
  text-align: left;
}

.company-name {
  color: blue;
}

.invoice-logo .logo {
  width: 200px;
  height: 150px;

  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.signature-logo .logo {
  width: 300px;
  height: 150px;
  background: gray;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}


.invoice-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-top:10px;
   
}
  .invoice-number{
   font-weight: 600;
   font-size:20px
  }
 .bold {
    font-weight: bold;
   }
.billing-info {
      width: 100%;
    display: flex;
}
  .bank-booking-details {
  display: flex;
  width:100% !important
}
   .signature-details {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.invoice-table th, .invoice-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

.invoice-summary {
  text-align: right;
  margin-top: 20px;
}

.balance-due {
  color: blue;
  font-weight: bold;
}

.terms {
  margin-top: 20px;
}
       .table-bordered {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 10px;
            }
            
            .table-bordered th {
              padding: 5px;
            }
            .table-bordered td{
              padding: 5px;
            }

               thead th {
                background-color: #6ba3cd !important;
                color: white !important;
                vertical-align: middle !important;
                padding: 5px !important;
                font-weight: bold;
                text-align: center !important;
                font-size: 12px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
                 .headerBackground, 
.bill-to div, 
.invoice-dates div,.bank-booking-details-container .bank-booking-details .bank div,.bank-booking-details-container .bank-booking-details .booking div, .invoice-cardHeader {
  text-align: center !important;
  background-color: #6ba3cd !important;
  color: white !important;
  padding: 5px;
  font-weight: bold;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
    margin-right: 2px !important;

}


                .bank-booking-details {
  display: flex;
  width: 100%;
  page-break-inside: avoid; /* Prevents splitting */
  justify-content: space-between;
}

.bank-booking-details-container {
  page-break-before: always; /* Moves to next page if needed */
}
 

          </style>
        </head>
        <body>
          <div id="invoice" class="invoice-container">
  <div class="header">
    <div class="invoice-logo">
      <h4>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h3>
    </div>
    <div class="invoice-logo">
      <div class="logo"><img src="${this.logoUrl}" alt="Company Logo" class="logo"></div>
    </div>
  </div>

  <div class="invoice-cardHeader">
    <strong><span class="invoice-number">${invoiceItem.proformaCardHeaderName}</span></strong>
  </div>
   <div class="invoice-title">
    <strong>INVOICE NO : <span class="invoice-number">${invoiceItem.invoiceUniqueNumber}</span></strong>
  </div>

  <div class="billing-info">
    <div class="bill-to " style="width:50%">
      <div style="text-align: center !important;background-color: #6ba3cd !important;">BILL TO</div>
      <p>${invoiceItem.header.ProformaCustomerName}</p>
      <p>${invoiceItem.header.ProformaAddress}</p>
      <p>${invoiceItem.header.ProformaCity}-${invoiceItem.header.ProformaPincode}</p>
      <p><strong>GST NO:</strong> ${invoiceItem.header.ProformaGstNo}</p>
       <p><strong>PAN NO:</strong>${invoiceItem.header.ProformaPan}</p>
    </div>
    
    <div class="invoice-dates" style="width:50%">
    <div style="text-align: center !important;background-color: #6ba3cd !important;">From</div>
      <p><strong>Invoice Date:</strong> ${invoiceItem.header.ProformaInvoiceDate}</p>
      <p><strong>PAN:</strong> ${invoiceItem.header.ProformaPanNO}</p>
      <p><strong>GST NO:</strong> ${invoiceItem.header.ProformaGstNumber}</p>
       <p><strong>TYPE OF AIRCRAFT:</strong> ${invoiceItem.header.ProformaTypeOfAircraft}</p>
       <p><strong>SEATING CAPACITY:</strong> ${invoiceItem.header.ProformaTypeOfAircraft}</p>
    </div>
  </div>

 <table class="table-bordered">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Description</th>
                  <th>Units (Hrs.)</th>
                  <th>Rate (INR)</th>
                  <th>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
             <tr>
              <td>1</td>
              <td class="bold">Charges</td>
              <td class="text-right"></td>
              <td class="text-right"></td>
              <td></td>
            </tr>
                ${invoiceItem.chargesList.map((charge, index) => `
                  <tr>
                   
                     <td class="text-center"></td>
                    <td>${charge.description}</td>
                    <td class="text-center">${charge.units ? charge.units : ''}</td>
                    <td class="text-right">${charge.rate}</td>
                    <td class="text-right">${charge.amount}</td>
                  </tr>
                `).join('')}
                
                <tr>
                  <td ></td>
                  <td ></td>
                  <td ></td>
                  <td class="text-right bold">Total</td>
                  <td class="text-right bold">${invoiceItem.subtotal}</td>
                </tr>
                <tr>
              <td>2</td>
                    <td class="bold">Taxes:</td>
                    <td></td>
                    <td></td>
                    <td></td>
              </tr>

                ${invoiceItem.taxList.map(tax => `
                  <tr>
                    <td></td>
                    <td>${tax.description}</td>
                    <td></td>
                    <td></td>
                    <td class="text-right">${tax.amount}</td>
                  </tr>
                `).join('')}

                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="text-right bold">Grand Total</td>
                  <td class="text-right bold">${invoiceItem.grandTotal}</td>
                </tr>
              </tbody>
            </table>

  

  <div class="bank-booking-details-container">
  <div class="bank-booking-details" >
  <div class="bank" style="width:50%">
    <div >BANK DETAILS</div>
      <p><strong>ACCOUNT NAME::</strong> RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</p>
      <p><strong>BANK:</strong> KOTAK MAHINDRA BANK</p>
      <p><strong>ACCOUNT NO:</strong> 0745211990</p>
       <p><strong>BRANCH:</strong> BANJARAHILLS</p>
       <p><strong>IFSC CODE:</strong> KKBK00007461(NEFT/RTGS)</p>
    </div>
   <div  class="booking" style="width:50%">
      <div >BOOKING DETAILS</div>
      <p><strong>Date Of Journey:</strong> ${invoiceItem.header.BookingDateOfJourny}</p>
      <p><strong>SECTOR:</strong> ${invoiceItem.header.BookingSector}</p>
      <p><strong>BILLING FLYING TIME:</strong> ${invoiceItem.header.BookingBillingFlyingTime} Hrs.</p>
    </div>
  </div>
   
  </div>
   <div class="notes">
        <p><strong>NOTES:</strong>${invoiceItem.header.notes}</p>           
   </div>
  <div class="header">
    <div class="signature-logo">
      <div class="logo"><img src="${this.InvoiceLogo}" alt="Company Logo" class="logo"></div>
    </div>
    <div class="signature-logo">
      <div class="logo"><img src="${this.signature}" alt="Company Logo" class="logo"></div>
        Authorised Signatory
    </div>
  </div>

</div>

</div>

      </html>
    `;

    const newWindow = window.open('', '', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();

      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };
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

    console.log("this.activeTab ",this.activeTab ,this.subtotal)
   if( this.activeTab == 'Edit' && this.subtotal){
    console.log("if state")
    this.calculateTotals()
   } else{
    console.log("else state")
   }
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

    // Convert amount to words
    this.amountInWords = this.numberToWordsService.convert(this.grandTotal);

    // Debugging logs
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
   UpdateInvoice(): void {
    this.newInvoiceCreation.markAllAsTouched();
 
     if (this.newInvoiceCreation.valid) {
       console.log('Invoice Updated', this.newInvoiceCreation.value);
 
       let invoiceDate = this.newInvoiceCreation.value.ProformaInvoiceDate;
     let bookingDate = this.newInvoiceCreation.value.bookingdateOfjourny;
 
     // ✅ Check if the date is already in 'DD-MM-YYYY' format
     const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
 
     if (!dateRegex.test(invoiceDate)) {
       invoiceDate = this.formatDate(invoiceDate);
     }
 
     if (!dateRegex.test(bookingDate)) {
       bookingDate = this.formatDate(bookingDate);
     }
     
     
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
           "BookingDateOfJourny": bookingDate,
           "BookingSector": this.newInvoiceCreation.value.bookingsector,
           "BookingBillingFlyingTime": this.newInvoiceCreation.value.bookingbillingflyingtime,
           "reviewedDescription": this.newInvoiceCreation.value.reviewedDescriptionEdit,
         },
         "chargesList": this.chargeItems,
         "taxList": this.taxItems,
         "subtotal": this.subtotal,
         "grandTotal": this.grandTotal,
         "amountInWords": this.amountInWords,
         "reason":this.reason,
         "invoiceApprovedOrRejectedByUser":this.invoiceApprovedOrRejectedByUser,
         "invoiceApprovedOrRejectedDateAndTime":this.invoiceApprovedOrRejectedDateAndTime,
         "loggedInUser":this.loginData.userName,
        "status":this.reSubmitInvoiceStatus,
        "proformaCardHeaderId":this.proformaCardHeaderId,
         "proformaCardHeaderName":this.proformaCardHeaderName,
         "reviewedReSubmited":false ,
         "reviewed":false,
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
           this.getAllInvoice()
           this.selectedInvoice.status = 'updated';
           // Reset form and related data
           this.newInvoiceCreation.reset();
           // this.logoUrl = '';
           this.chargeItems = [];
           this.taxItems = [];
           this.subtotal = 0;
           this.grandTotal = 0;
           this.amountInWords = '';
          
           this.resetAll()
           this.show=true
           Swal.fire({
             text: response.message,
             icon: 'success',
             showConfirmButton: true
           });
           this.invoiceItem = null
           this.modalService.dismissAll();
 
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
  // updateStatus(invoice: any, status: string) {
  //   // Confirm before changing status
  //   if (confirm(`Are you sure you want to ${status.toLowerCase()} this invoice?`)) {
  //     invoice.status = status;

  //     // If you are updating status in the backend, call the API here
  //     // Example:
  //     // this.invoiceService.updateInvoiceStatus(invoice.id, status).subscribe(response => {
  //     //   console.log("Status updated:", response);
  //     // }, error => {
  //     //   console.error("Error updating status:", error);
  //     // });

  //     console.log(`Invoice ${invoice.invoiceUniqueNumber} status changed to ${status}`);
  //   }
  // }

  rowData(invoice){
    console.log("invoice",invoice)
    this.invoiceItem = null
    // this.generatePDFandSend(invoice)
    this.invoiceItem = invoice
  }
  reviewInvoice(invoice){
    console.log("invoice",invoice)
    this.invoiceItem
    // this.generatePDFandSend(invoice)
    this.invoiceItem = invoice;
    this.modalService.open(this.reviewedInvoice, { size: 'lg' })

  }
  descriptionAdd(){
    if(this.reviewedDescription){
      this.enableDescription = false
    }else{
      this.enableDescription = true
    }
  }
  reviewSave(){
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24-hour format
    }).replace(',', ''); // Remove the comma between date and time
    let obj={
      "reviewedDescription": this.reviewedDescription,
    "reviewedDate": formattedDateTime,
    "reviewedLoggedIn": this.loginData?.data.userName,
    "originalUniqueId":this.invoiceItem.originalUniqueId,
    "reviewed":true,
    "reviewedReSubmited":false
    }
    this.spinner.show()
    this.service.reviewedUpadte(obj).subscribe((response:any)=>{
      this.spinner.hide()
      if(response.status == 200){
        this.modalService.dismissAll();
        console.log("if")
        Swal.fire({
          text: response.message,
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.getAllInvoice()
      }else{
       console.log("else")
      }
      

    },error=>{
      this.spinner.hide()
    })
  }
//   generatePDFandSend(invoiceItem: InvoiceItem) {
//     console.log("invoiceItem",invoiceItem)
//     this.logoUrl = this.imageService.getBase64FlightLogo();
//     this.InvoiceLogo = this.imageService.getBase64WorldLogo();
//     this.signature = this.imageService.getBase64Signature();
//     const invoiceHTML = `
//       <html>
//         <head>
         
//           <style>
//            .invoice-container {
//   max-width: 800px;
//   margin: auto;
//   padding: 20px;
//   border: 1px solid #ccc;
//   background: #fff;
//   font-family: Arial, sans-serif;
// }
//  .text-right {
//               text-align: right;
//             }
// .header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 20px;
//   border-bottom:2px solid #FFD700
// }

// .company-details {
//   text-align: left;
// }

// .company-name {
//   color: blue;
// }

// .invoice-logo .logo {
//   width: 200px;
//   height: 150px;

//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-weight: bold;
//   color: white;
// }

// .signature-logo .logo {
//   width: 300px;
//   height: 150px;
//   background: gray;
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-weight: bold;
//   color: white;
// }


// .invoice-title {
//   text-align: center;
//   font-size: 20px;
//   font-weight: bold;
//   margin-top:10px;
   
// }
//   .invoice-number{
//    font-weight: 600;
//    font-size:20px
//   }
//  .bold {
//     font-weight: bold;
//    }
// .billing-info {
//       width: 100%;
//     display: flex;
// }
//   .bank-booking-details {
//   display: flex;
//   width:100% !important
// }
//    .signature-details {
//   display: flex;
//   justify-content: space-between;
//   margin-top: 20px;
// }

// .invoice-table {
//   width: 100%;
//   border-collapse: collapse;
//   margin-top: 20px;
// }

// .invoice-table th, .invoice-table td {
//   border: 1px solid #ccc;
//   padding: 8px;
//   text-align: center;
// }

// .invoice-summary {
//   text-align: right;
//   margin-top: 20px;
// }

// .balance-due {
//   color: blue;
//   font-weight: bold;
// }

// .terms {
//   margin-top: 20px;
// }
//        .table-bordered {
//               border-collapse: collapse;
//               width: 100%;
//               margin-bottom: 10px;
//             }
            
//             .table-bordered th {
//               padding: 5px;
//             }
//             .table-bordered td{
//               padding: 5px;
//             }

//                thead th {
//                 background-color: #6ba3cd !important;
//                 color: white !important;
//                 vertical-align: middle !important;
//                 padding: 5px !important;
//                 font-weight: bold;
//                 text-align: center !important;
//                 font-size: 12px !important;
//                 -webkit-print-color-adjust: exact !important;
//                 print-color-adjust: exact !important;
//               }
//                  .headerBackground, 
// .bill-to div, 
// .invoice-dates div,.bank-booking-details-container .bank-booking-details .bank div,.bank-booking-details-container .bank-booking-details .booking div, .invoice-cardHeader {
//   text-align: center !important;
//   background-color: #6ba3cd !important;
//   color: white !important;
//   padding: 5px;
//   font-weight: bold;
//   -webkit-print-color-adjust: exact !important;
//   print-color-adjust: exact !important;
//     margin-right: 2px !important;

// }


//                 .bank-booking-details {
//   display: flex;
//   width: 100%;
//   page-break-inside: avoid; /* Prevents splitting */
//   justify-content: space-between;
// }

// .bank-booking-details-container {
//   page-break-before: always; /* Moves to next page if needed */
// }
 

//           </style>
//         </head>
//         <body>
//           <div id="invoice" class="invoice-container">
//   <div class="header">
//     <div class="invoice-logo">
//       <h4>RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</h3>
//     </div>
//     <div class="invoice-logo">
//       <div class="logo"><img src="${this.logoUrl}" alt="Company Logo" class="logo"></div>
//     </div>
//   </div>

//   <div class="invoice-cardHeader">
//     <strong><span class="invoice-number">${invoiceItem.proformaCardHeaderName}</span></strong>
//   </div>
//    <div class="invoice-title">
//     <strong>INVOICE NO : <span class="invoice-number">${invoiceItem.invoiceUniqueNumber}</span></strong>
//   </div>

//   <div class="billing-info">
//     <div class="bill-to " style="width:50%">
//       <div style="text-align: center !important;background-color: #6ba3cd !important;">BILL TO</div>
//       <p>${invoiceItem.header.ProformaCustomerName}</p>
//       <p>${invoiceItem.header.ProformaAddress}</p>
//       <p>${invoiceItem.header.ProformaCity}-${invoiceItem.header.ProformaPincode}</p>
//       <p><strong>GST NO:</strong> ${invoiceItem.header.ProformaGstNo}</p>
//        <p><strong>PAN NO:</strong>${invoiceItem.header.ProformaPan}</p>
//     </div>
    
//     <div class="invoice-dates" style="width:50%">
//     <div style="text-align: center !important;background-color: #6ba3cd !important;">From</div>
//       <p><strong>Invoice Date:</strong> ${invoiceItem.header.ProformaInvoiceDate}</p>
//       <p><strong>PAN:</strong> ${invoiceItem.header.ProformaPanNO}</p>
//       <p><strong>GST NO:</strong> ${invoiceItem.header.ProformaGstNumber}</p>
//        <p><strong>TYPE OF AIRCRAFT:</strong> ${invoiceItem.header.ProformaTypeOfAircraft}</p>
//        <p><strong>SEATING CAPACITY:</strong> ${invoiceItem.header.ProformaTypeOfAircraft}</p>
//     </div>
//   </div>

//  <table class="table-bordered">
//               <thead>
//                 <tr>
//                   <th>S.No</th>
//                   <th>Description</th>
//                   <th>Units (Hrs.)</th>
//                   <th>Rate (INR)</th>
//                   <th>Amount (INR)</th>
//                 </tr>
//               </thead>
//               <tbody>
//              <tr>
//               <td>1</td>
//               <td class="bold">Charges</td>
//               <td class="text-right"></td>
//               <td class="text-right"></td>
//               <td></td>
//             </tr>
//                 ${invoiceItem.chargesList.map((charge, index) => `
//                   <tr>
                   
//                      <td class="text-center"></td>
//                     <td>${charge.description}</td>
//                     <td class="text-center">${charge.units ? charge.units : ''}</td>
//                     <td class="text-right">${charge.rate}</td>
//                     <td class="text-right">${charge.amount}</td>
//                   </tr>
//                 `).join('')}
                
//                 <tr>
//                   <td ></td>
//                   <td ></td>
//                   <td ></td>
//                   <td class="text-right bold">Total</td>
//                   <td class="text-right bold">${invoiceItem.subtotal}</td>
//                 </tr>
//                 <tr>
//               <td>2</td>
//                     <td class="bold">Taxes:</td>
//                     <td></td>
//                     <td></td>
//                     <td></td>
//               </tr>

//                 ${invoiceItem.taxList.map(tax => `
//                   <tr>
//                     <td></td>
//                     <td>${tax.description}</td>
//                     <td></td>
//                     <td></td>
//                     <td class="text-right">${tax.amount}</td>
//                   </tr>
//                 `).join('')}

//                 <tr>
//                   <td></td>
//                   <td></td>
//                   <td></td>
//                   <td class="text-right bold">Grand Total</td>
//                   <td class="text-right bold">${invoiceItem.grandTotal}</td>
//                 </tr>
//               </tbody>
//             </table>

  

//   <div class="bank-booking-details-container">
//   <div class="bank-booking-details" >
//   <div class="bank" style="width:50%">
//     <div >BANK DETAILS</div>
//       <p><strong>ACCOUNT NAME::</strong> RITHWIK GREEN POWER & AVIATION PRIVATE LIMITED</p>
//       <p><strong>BANK:</strong> KOTAK MAHINDRA BANK</p>
//       <p><strong>ACCOUNT NO:</strong> 0745211990</p>
//        <p><strong>BRANCH:</strong> BANJARAHILLS</p>
//        <p><strong>IFSC CODE:</strong> KKBK00007461(NEFT/RTGS)</p>
//     </div>
//    <div  class="booking" style="width:50%">
//       <div >BOOKING DETAILS</div>
//       <p><strong>Date Of Journey:</strong> ${invoiceItem.header.BookingDateOfJourny}</p>
//       <p><strong>SECTOR:</strong> ${invoiceItem.header.BookingSector}</p>
//       <p><strong>BILLING FLYING TIME:</strong> ${invoiceItem.header.BookingBillingFlyingTime} Hrs.</p>
//     </div>
//   </div>
   
//   </div>
//    <div class="notes">
//         <p><strong>NOTES:</strong>${invoiceItem.header.notes}</p>           
//    </div>
//   <div class="header">
//     <div class="signature-logo">
//       <div class="logo"><img src="${this.InvoiceLogo}" alt="Company Logo" class="logo"></div>
//     </div>
//     <div class="signature-logo">
//       <div class="logo"><img src="${this.signature}" alt="Company Logo" class="logo"></div>
//         Authorised Signatory
//     </div>
//   </div>

// </div>

// </div>

//       </html>
//     `;

//     const newWindow = window.open('', '', 'height=600,width=800');
//     if (newWindow) {
//       newWindow.document.write(invoiceHTML);
//       newWindow.document.close();

//       setTimeout(() => {
//         newWindow.print();
//       }, 500);
//     }
//   };



}





// share related logic
// openSharePopup(invoice: any) {
//   this.showSharePopup = true;
//   this.selectedInvoice = invoice;
// }

// closeSharePopup() {
//   this.showSharePopup = false;
//   this.selectedInvoice = null;
// }



