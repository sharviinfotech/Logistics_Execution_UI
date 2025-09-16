import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxPrintModule } from 'ngx-print';
import Swal from 'sweetalert2';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { Component, ElementRef, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ImageService } from 'src/app/image.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { finalize } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // Import DomSanitizer and SafeResourceUrl

interface Invoice {
  invoiceUniqueNumber: string;
  header: {
    ProformaInvoiceDate: string;
    BookingBillingFlyingTime: string;
    ProformaTypeOfAircraft: string;
    BookingSector: string;
    startBookingDateOfJourny: string;
    endBookingDateOfJourny: string;
  };
  subtotal: number;
  grandTotal: number;
  status: string;
  originalUniqueId: string; // Used for updating

  // Expense properties
  groundHandlingAmount?: number | null;
  groundHandlingFile?: string | null; // Will store base64 string or URL
  groundHandlingFileName?: string | null; // To display the filename
  isGroundHandlingEditing?: boolean; // New flag for edit mode

  landingParkingAmount?: number | null;
  landingParkingFile?: string | null;
  landingParkingFileName?: string | null;
  isLandingParkingEditing?: boolean;

  GATerminalOthersAmount?: number | null;
  GATerminalOthersFile?: string | null;
  GATerminalOthersFileName?: string | null;
  isGATerminalOthersEditing?: boolean;

  onboardCateringAmount?: number | null;
  onboardCateringFile?: string | null;
  onboardCateringFileName?: string | null;
  isOnboardCateringEditing?: boolean;

  crewExpensesAmount?: number | null;
  crewExpensesFile?: string | null;
  crewExpensesFileName?: string | null;
  isCrewExpensesEditing?: boolean;

  fuelexpensesAmount?: number | null;
  fuelexpensesFile?: string | null;
  fuelexpensesFileName?: string | null;
  isFuelexpensesEditing?: boolean;

  otherexpensesAmount?: number | null;
  otherexpensesFile?: string | null;
  otherexpensesFileName?: string | null;
  isOtherexpensesEditing?: boolean;
}

// Define a type alias for the specific keys that are boolean editing flags
type InvoiceEditingKeys =
  'isGroundHandlingEditing' |
  'isLandingParkingEditing' |
  'isGATerminalOthersEditing' |
  'isOnboardCateringEditing' |
  'isCrewExpensesEditing' |
  'isFuelexpensesEditing' |
  'isOtherexpensesEditing';
@Component({
  selector: 'app-sector-wise',
  templateUrl: './sector-wise.component.html',
  styleUrl: './sector-wise.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPrintModule, BsDatepickerModule],
  standalone: true,
})
export class SectorWiseComponent {
    @ViewChild('newUserTemplate') newUserTemplate: TemplateRef<any>;
allInvoiceList: any[] = []; 
  bsConfig: Partial<BsDatepickerConfig>;
  invoiceItem: any;
filteredList: any[] = [];
paginatedInvoices: any[] = [];
pages: number[] = [];
currentPage: number = 1;
pageSize: number = 10;
searchTerm: string = '';
totalPages: number = 0;
  logoUrl: string;
  itemsPerPage: number = 10;
  totalItems = 0; 
  pagedInvoiceList: any[] = [];
  InvoiceLogo: string;
  reportsForm: FormGroup;
  filteredInvoices: any;
  uniqueInvoices: any;
  submit: boolean = false;
  loginData: any;
  grandTotalInvoices: any;
  selectedFiles: { [invoiceId: string]: { [field: string]: File } } = {};
   // Property to hold the sanitized PDF source for the iframe
  currentPdfBase64: SafeResourceUrl | null = null;
  constructor(public service: GeneralserviceService,  private spinner: NgxSpinnerService, private imageService: ImageService, private fb: FormBuilder,private modalService: NgbModal,private sanitizer: DomSanitizer) {
    this.service = service;
    
    this.bsConfig = {
      dateInputFormat: 'DD-MM-YYYY',
      containerClass: 'theme-blue', // Optional: Customize theme
    };

  }
  ngOnInit(): void {
  
    this.reportsForm = this.fb.group({
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      status: ['', Validators.required],
      invoiceType: ['', Validators.required],
    });
        this.loginData = this.service.getLoginResponse();
    console.log("this.loginData ", this.loginData);  
    this.loadInvoices();
    this.getAllInvoice();
    this.updatePagination();
   
  }


loadInvoices() {
  this.allInvoiceList = []
  // this.updatePagination();
  this.getAllInvoice()
}
onPageSizeChange(): void {
  this.pageSize = +this.pageSize; // convert string to number
  this.currentPage = 1;
  this.updatePagination();
}


pageChanged(page: number): void {
  console.log("pageChanged page",page)
  this.currentPage = page;
  this.updatePagination();
}

resetPagination(): void {
  this.currentPage = 1;
  this.updatePagination();
}

updatePagination(): void {
  // Filter data based on search term
  let filtered = this.allInvoiceList;
  if (this.searchTerm && this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    filtered = this.allInvoiceList.filter(invoice =>
      invoice.invoiceUniqueNumber?.toLowerCase().includes(term) ||
      invoice.header?.ProformaCustomerName?.toLowerCase().includes(term) ||
      invoice.status?.toLowerCase().includes(term)
    );
  }

  // Calculate total pages
  this.totalPages = Math.ceil(filtered.length / this.pageSize);
  this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

  // Clamp currentPage
  if (this.currentPage > this.totalPages) {
    this.currentPage = this.totalPages || 1;
  }

  // Calculate slice range
    console.log("Page Size: 255", this.pageSize);
  const startIndex = (this.currentPage - 1) * this.pageSize;
    console.log("startIndex",startIndex);
  const endIndex = startIndex + this.pageSize;
  console.log("endIndex",endIndex);
  // Apply pagination
  this.paginatedInvoices = filtered.slice(startIndex, endIndex);

  // Store filtered list for reference
  this.filteredList = filtered;

  // Debug logs
  console.log("Page Size:", this.pageSize);
  console.log("Current Page:", this.currentPage);
  console.log("Start Index:", startIndex);
  console.log("End Index:", endIndex);
  console.log("Paginated Invoices:", this.paginatedInvoices.length);
}

  getAllInvoice() {
  this.allInvoiceList = [];
  this.spinner.show(); // Show the spinner

  const obj = {
    userActivity: "SECTOR"
  };

  this.service.getAllInvoice(obj).pipe(
    finalize(() => {
      this.spinner.hide(); // This will be executed regardless of success or error
    })
  ).subscribe({
    next: (res: any) => {
      console.log("getAllInvoice", res);
      this.allInvoiceList = res.data;
      this.uniqueInvoices = [...this.allInvoiceList];
      console.log("this.allInvoiceList", this.allInvoiceList);
      console.log("this.uniqueInvoices", this.uniqueInvoices);
      this.updatePagination();
      this.paginatedInvoices.forEach(invoice => this.initializeEditFlags(invoice));
    },
    error: (error) => {
      console.error("Error fetching invoices:", error);
    }
  });
}
 initializeEditFlags(invoice: Invoice): void {
    invoice.isGroundHandlingEditing = !(invoice.groundHandlingAmount || invoice.groundHandlingFile);
    invoice.isLandingParkingEditing = !(invoice.landingParkingAmount || invoice.landingParkingFile);
    invoice.isGATerminalOthersEditing = !(invoice.GATerminalOthersAmount || invoice.GATerminalOthersFile);
    invoice.isOnboardCateringEditing = !(invoice.onboardCateringAmount || invoice.onboardCateringFile);
    invoice.isCrewExpensesEditing = !(invoice.crewExpensesAmount || invoice.crewExpensesFile);
    invoice.isFuelexpensesEditing = !(invoice.fuelexpensesAmount || invoice.fuelexpensesFile);
    invoice.isOtherexpensesEditing = !(invoice.otherexpensesAmount || invoice.otherexpensesFile);
  }
toggleEditMode(invoice: Invoice, expenseType: string | undefined | null): void { // Added undefined | null to expenseType
    console.log('toggleEditMode called.');
    console.log('invoice:', invoice);
    console.log('expenseType received:', expenseType); // Log the received expenseType

    // Defensive check: Ensure expenseType is a non-empty string
    if (typeof expenseType !== 'string' || expenseType.trim() === '') {
      console.error('Invalid expenseType received in toggleEditMode:', expenseType);
      Swal.fire({
        text: 'An internal error occurred: Invalid expense type.',
        icon: 'error',
        showConfirmButton: true
      });
      return; // Stop execution if expenseType is invalid
    }

    // Construct the key for the editing flag dynamically
    const editFlagKey: InvoiceEditingKeys = `is${expenseType.charAt(0).toUpperCase() + expenseType.slice(1)}Editing` as InvoiceEditingKeys;

    // Use a type assertion to tell TypeScript that invoice[editFlagKey] is a boolean
    // This resolves the 'Type 'boolean' is not assignable to type 'never'' error
    invoice[editFlagKey] = !(invoice[editFlagKey] as boolean);
  }
onFileSelected(event: Event, invoice: Invoice, expenseType: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        Swal.fire({
          text: 'Please select a PDF file.',
          icon: 'warning',
          showConfirmButton: true
        });
        input.value = ''; // Clear the input
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Store the base64 string and file name
        switch (expenseType) {
          case 'groundHandling':
            invoice.groundHandlingFile = base64String;
            invoice.groundHandlingFileName = file.name;
            break;
          case 'landingParking':
            invoice.landingParkingFile = base64String;
            invoice.landingParkingFileName = file.name;
            break;
          case 'GATerminalOthers':
            invoice.GATerminalOthersFile = base64String;
            invoice.GATerminalOthersFileName = file.name;
            break;
          case 'onboardCatering':
            invoice.onboardCateringFile = base64String;
            invoice.onboardCateringFileName = file.name;
            break;
          case 'crewExpenses':
            invoice.crewExpensesFile = base64String;
            invoice.crewExpensesFileName = file.name;
            break;
          case 'fuelexpenses':
            invoice.fuelexpensesFile = base64String;
            invoice.fuelexpensesFileName = file.name;
            break;
          case 'otherexpenses':
            invoice.otherexpensesFile = base64String;
            invoice.otherexpensesFileName = file.name;
            break;
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Clear the file if no file is selected (e.g., user cancels)
      switch (expenseType) {
        case 'groundHandling':
          invoice.groundHandlingFile = null;
          invoice.groundHandlingFileName = null;
          break;
        case 'landingParking':
          invoice.landingParkingFile = null;
          invoice.landingParkingFileName = null;
          break;
        case 'GATerminalOthers':
          invoice.GATerminalOthersFile = null;
          invoice.GATerminalOthersFileName = null;
          break;
        case 'onboardCatering':
          invoice.onboardCateringFile = null;
          invoice.onboardCateringFileName = null;
          break;
        case 'crewExpenses':
          invoice.crewExpensesFile = null;
          invoice.crewExpensesFileName = null;
          break;
        case 'fuelexpenses':
          invoice.fuelexpensesFile = null;
          invoice.fuelexpensesFileName = null;
          break;
        case 'otherexpenses':
          invoice.otherexpensesFile = null;
          invoice.otherexpensesFileName = null;
          break;
      }
    }
  }



saveExpenseBackup(invoice: Invoice, expenseType: string): void {
    const payload: any = {
      originalUniqueId: invoice.originalUniqueId,
    };

    switch (expenseType) {
      case 'groundHandling':
        payload.groundHandlingAmount = invoice.groundHandlingAmount;
        payload.groundHandlingFile = invoice.groundHandlingFile;
        break;
      case 'landingParking':
        payload.landingParkingAmount = invoice.landingParkingAmount;
        payload.landingParkingFile = invoice.landingParkingFile;
        break;
      case 'GATerminalOthers':
        payload.GATerminalOthersAmount = invoice.GATerminalOthersAmount;
        payload.GATerminalOthersFile = invoice.GATerminalOthersFile;
        break;
      case 'onboardCatering':
        payload.onboardCateringAmount = invoice.onboardCateringAmount;
        payload.onboardCateringFile = invoice.onboardCateringFile;
        break;
      case 'crewExpenses':
        payload.crewExpensesAmount = invoice.crewExpensesAmount;
        payload.crewExpensesFile = invoice.crewExpensesFile;
        break;
      case 'fuelexpenses':
        payload.fuelexpensesAmount = invoice.fuelexpensesAmount;
        payload.fuelexpensesFile = invoice.fuelexpensesFile;
        break;
      case 'otherexpenses':
        payload.otherexpensesAmount = invoice.otherexpensesAmount;
        payload.otherexpensesFile = invoice.otherexpensesFile;
        break;
      default:
        console.warn('Unknown expense type:', expenseType);
        return;
    }
console.log('payload',payload)
    this.service.sectorwiseSave(payload) // Replace with your actual API endpoint
      .subscribe({
        next: (response: any) => {
          console.log('Expense saved successfully:', response);
          if(response.status == 200){
           Swal.fire({
                     text: response.message,
                     icon: 'success',
                     showConfirmButton: true
                   });
          this.loadInvoices();
          this.getAllInvoice();
          this.updatePagination();
          }else{
                 Swal.fire({
                     text: response.message,
                     icon: 'success',
                     showConfirmButton: true
                   });
          }
        
        },
        error: (error) => {
          if(error == 'Payload Too Large'){
                  Swal.fire({
                     text: 'Payload Too Large,Unable to save',
                     icon: 'error',
                     showConfirmButton: true
                   });
          }
          console.log('Error saving expense:', error);
          
        }
      });
  }
saveExpense(invoice: Invoice, expenseType: string): void {
    const payload: any = {
      originalUniqueId: invoice.originalUniqueId,
    };

    // Dynamically add amount and file to payload based on expenseType
    const amountKey = `${expenseType}Amount` as keyof Invoice;
    const fileKey = `${expenseType}File` as keyof Invoice;

    if (invoice.hasOwnProperty(amountKey)) {
      payload[amountKey] = invoice[amountKey];
    }
    if (invoice.hasOwnProperty(fileKey)) {
      payload[fileKey] = invoice[fileKey];
    }

    console.log('Payload sent to backend:', payload);

    // Replace 'this.http.post' with 'this.service.sectorwiseSave' if using a service
    this.service.sectorwiseSave(payload) // Ensure this URL is correct
      .subscribe({
        next: (response: any) => {
          console.log('Expense saved successfully:', response);
          if (response.status == 200) {
            Swal.fire({
              text: response.message,
              icon: 'success',
              showConfirmButton: true
            });
            // After successful save, update the local invoice object and exit edit mode
            // It's good practice to update the invoice with data from the response if the backend sends it
            // Object.assign(invoice, response.data); // Uncomment if backend returns updated invoice
            this.toggleEditMode(invoice, expenseType); // Exit edit mode
            this.loadInvoices(); // Reload data to ensure consistency
            // this.getAllInvoice(); // Placeholder for your existing method
            // this.updatePagination(); // Placeholder for your existing method
          } else {
            Swal.fire({
              text: response.message,
              icon: 'error', // Changed to error for non-200 status
              showConfirmButton: true
            });
          }
        },
        error: (error) => {
          console.log('Error saving expense:', error);
          if(error == 'Payload Too Large'){
                  Swal.fire({
                     text: 'Payload Too Large,Unable to save',
                     icon: 'error',
                     showConfirmButton: true
         });
          }
        }
      });
  }




viewPDF(base64String: string | null | undefined): void {
    if (base64String) {
      // Sanitize the Base64 string for use in an iframe src
      this.currentPdfBase64 = this.sanitizer.bypassSecurityTrustResourceUrl(base64String);

      // Open the modal using the newUserTemplate
      // Ensure newUserTemplate is available (e.g., in ngOnInit, or use a conditional check)
      if (this.newUserTemplate) {
        this.modalService.open(this.newUserTemplate, {
          backdrop: 'static',
          keyboard: false,
          size: 'lg'
        });
      } else {
        Swal.fire({
          text: 'PDF viewer template not found. Please ensure it\'s defined in your HTML.',
          icon: 'error',
          showConfirmButton: true
        });
      }
    } else {
      Swal.fire({
        text: 'No PDF file available to view.',
        icon: 'info',
        showConfirmButton: true
      });
    }
  }


  downloadPDF(base64String: string | null | undefined, filename: string): void {
    if (base64String) {
      const link = document.createElement('a');
      link.href = base64String;
      link.download = filename;
      document.body.appendChild(link); // Append to body to make it clickable in some browsers
      link.click();
      document.body.removeChild(link); // Clean up
    } else {
      Swal.fire({
        text: 'No PDF file available to download.',
        icon: 'info',
        showConfirmButton: true
      });
    }
  }


}
