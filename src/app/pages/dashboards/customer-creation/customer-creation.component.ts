import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GeneralserviceService } from 'src/app/generalservice.service'; // Adjust path if necessary
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-customer-creation',
  templateUrl: './customer-creation.component.html',
  styleUrl: './customer-creation.component.css',
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgxSpinnerModule],
  standalone: true
})
export class CustomerCreationComponent {
  @ViewChild('editCustomerTemplate') editCustomerTemplate!: TemplateRef<any>;
  creditPeriodList: string[] = ['15 days', '30 days', '45 days'];
   
  statesList: any[] = [];
   customerEditForm: FormGroup;
   CreateCustomer: any[] = [];
   selectedCustomer: any = null;
   modalRef: any;
   customerEditModal: any;
 
 
   fieldTextType: boolean = false;
   submitted: boolean = false;
 confirmFieldTextType: boolean = false;
   customerNewCreation: any[];
   customerList: any[];
   submit: boolean=false;
   customerUniqueId: number;
   loginData: any;
   StateName: string;
 
 CustomerCreationForm: any;
newCustomerTemplate: any;

 // spinner: any;
 
 
 
 
   constructor(
     private modalService: NgbModal,
     private fb: FormBuilder,
     private service: GeneralserviceService,private toastr: ToastrService,private spinner:NgxSpinnerService
   ) {}
 
   ngOnInit(): void {
     this.getStates();
     this.CustomerCreationForm = this.fb.group({
       customerName: ['', Validators.required],
       customerAddress: ['', Validators.required],
       customerCity: ['', Validators.required],
       customerState: ['', Validators.required],
       customerPincode: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/)
        ]
      ],
       customerGstNo: ['', Validators.required],
       customerPanNo:  ['',
        [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]  // Correct PAN format
      ],
   
       customerEmail: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
       customerContact: ['', [Validators.required,  Validators.pattern('^[0-9]{10}$')]],
       customerAlernativecontact: ['',],
       customerCreditPeriod: ['', Validators.required]
 
 
     });
 
   
 
 
     this.customerEditForm = this.fb.group({
 
       customerName: ['', Validators.required],
       customerAddress: ['', Validators.required],
       customerCity: ['', Validators.required],
       customerState: ['', Validators.required],
       customerPincode: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/)
        ]
      ],       customerGstNo: ['', Validators.required],
       customerPanNo: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],

       customerEmail: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
       customerContact: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
       customerAlernativecontact: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
       customerCreditPeriod: ['', Validators.required]
 
 
     }, {
       // validator: this.mustMatch('password', 'confirmPassword')
     });
   
     this.getInvoiceCustomerDetails();
     this.getAllCustomerList();
   
   
     this.loginData = this.service.getLoginResponse()
   }
   convertToUpperCase(event: any) {
    event.target.value = event.target.value.toUpperCase();
  }
  
   editCustomer(selectedCustomer: any, content: any) {
     console.log('selected Customer:', selectedCustomer); // Debugging
 
     if (!selectedCustomer) {
       console.error('No customer data found');
       return;
     }
   }
   
     

   
   openEditModal(customer: any, editCustomerTemplate: TemplateRef<any>): void {
     this.submit = false
     console.log('customer',customer);
     this.customerUniqueId =null
     const selectedCustomer = customer;
     this.customerUniqueId = customer.customerUniqueId
     this.customerEditForm.patchValue({
       customerName: selectedCustomer.customerName,
       customerAddress: selectedCustomer.customerAddress,
       customerCity: selectedCustomer.customerCity,
       customerState: selectedCustomer.customerState,
       customerPincode: selectedCustomer.customerPincode,
       customerGstNo: selectedCustomer.customerGstNo,
       customerPanNo:selectedCustomer.customerPanNo,
       customerEmail:selectedCustomer.customerEmail,
       customerContact: selectedCustomer.customerContact,
       customerAlernativecontact: selectedCustomer.customerAlernativecontact,
       customerCreditPeriod:selectedCustomer.customerCreditPeriod
 
     });
     this.modalService.open(this.editCustomerTemplate, {
       backdrop: 'static',
       keyboard: false ,size:'lg'
     });  }
   getStates() {
     console.log("state ")
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

   toggleFieldTextType() {
     this.fieldTextType = !this.fieldTextType;
   }
   toggleConfirmFieldTextType() {
     this.confirmFieldTextType = !this.confirmFieldTextType;
   }
   toggleStatus(): void {
     this.customerEditForm.patchValue({ status: !this.customerEditForm.value.status });
   }
 
 
 
   getInvoiceCustomerDetails(): void {
   
   }
 
   newCustomerCreation(newCustomerTemplate: any): void {
   
     this.modalService.open(newCustomerTemplate,{  backdrop: 'static',
       keyboard: false,size:'lg' });
 
 
   }
   get f() {
      return this.CustomerCreationForm.controls;
      return this.customerEditForm.controls;
      }
     
    
 
 
 
      savecustomerCreation(model:any) {
      console.log('Create Customer:', this.CustomerCreationForm.value);
       
          if (this.CustomerCreationForm.invalid == true) {
            this.submit = true;
            return;
          } else {
            this.submit = false;
          }
       
          let creatObj = {
            "customerName": this.CustomerCreationForm.value.customerName,
            "customerAddress": this.CustomerCreationForm.value.customerAddress,
            "customerCity": this.CustomerCreationForm.value.customerCity,
            "customerState": this.CustomerCreationForm.value.customerState.toUpperCase(),
            "customerPincode": this.CustomerCreationForm.value.customerPincode,
            "customerGstNo": this.CustomerCreationForm.value.customerGstNo.toUpperCase(),
            "customerPanNo": this.CustomerCreationForm.value.customerPanNo.toUpperCase(),
            "customerEmail":this.CustomerCreationForm.value.customerEmail,
            "customerContact":this.CustomerCreationForm.value.customerContact,
            "customerAlernativecontact":this.CustomerCreationForm.value.customerAlernativecontact,
            "customerCreditPeriod":this.CustomerCreationForm.value.customerCreditPeriod.toUpperCase()
 
 
         
          };
       
          console.log("creatObj", creatObj);
       
          this.service.savecustomerCreation(creatObj).subscribe((res: any) => {
            console.log("submitCustomerForm", res);
            console.log('apiErr', res, res.responseData);
     
            if(res.status == 400){
              this.toastr.success(res.message);
            }else{
               // Display success toast
               this.CustomerCreationForm.reset()
            this.modalService.dismissAll(model);
            Swal.fire({
              title: '',
              text: res.message,
              icon: 'success',
              cancelButtonText: 'Ok'
            }).then((result) => {
              if (result) {
       
              } else {
       
              }
            });
            }
       
         
       
            this. getAllCustomerList();
            // this.modalService.dismissAll(modal);
            this.submitted = true;
          }, error => {
              this.toastr.error(error)
            // this.modalService.dismissAll(modal);
            console.log("error", error);
          });
        }
   c(message: string) {
     // Handle the close logic here
     console.log(message);
     // You might want to close the modal or clear form fields, etc.
   }
   updateExitCustomer(modal: any): void {
    console.log('Edit Customer:', this.customerEditForm.value);
    this.submitted = true;
  
    // if (this.customerEditForm.errors) {
    //   console.log('Form is errors');
    //   return;
    // }
  
    let updateObj = {
      customerUniqueId: this.customerUniqueId,
      customerName: this.customerEditForm.value.customerName.toUpperCase(),
      customerAddress: this.customerEditForm.value.customerAddress.toUpperCase(),
      customerCity: this.customerEditForm.value.customerCity.toUpperCase(),
      customerState: this.customerEditForm.value.customerState.toUpperCase(),
      customerPincode: this.customerEditForm.value.customerPincode,
      customerGstNo: this.customerEditForm.value.customerGstNo.toUpperCase(),
      customerPanNo: this.customerEditForm.value.customerPanNo.toUpperCase(),
      customerEmail: this.customerEditForm.value.customerEmail,
      customerContact: this.customerEditForm.value.customerContact,
      customerAlernativecontact: this.customerEditForm.value.customerAlernativecontact,
      customerCreditPeriod: this.customerEditForm.value.customerCreditPeriod.toUpperCase()
    };
  
    console.log("Updating customer with data:", updateObj);
    this.spinner.show();
  
    this.service.updateExitCustomer(updateObj, this.customerUniqueId).subscribe(
      (res: any) => {
        console.log("updateCustomerCreation response:", res);
        this.spinner.hide()
  
        if (res.status === 400) {
          this.toastr.error(res.message);
        } else {
          this.toastr.success("Customer updated successfully");
          this.modalService.dismissAll(modal);
          Swal.fire({
            title: '',
            text: res.message,
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.getAllCustomerList();
          });
        }
  
        this.customerEditForm.reset();
        this.submitted = false;
      },
      (error) => {
        this.spinner.hide()
        console.error("Error updating customer:", error);
        this.toastr.error("Failed to update customer");
      }
    );
  }
  delete(data): void {
    console.log('Deleting Customer with ID:',data, this.customerUniqueId);
  this.customerUniqueId = data.customerUniqueId
    let deletePayload = {
      globalId: this.customerUniqueId,
      screenName: "customer"
    };
  
    console.log("Delete payload:", deletePayload);
  this.spinner.show()
    this.service.deteleGlobal(deletePayload).subscribe((res: any) => {
        console.log("deleteGlobal response:", res);
        this.spinner.hide()
        if (res.status === 400) {
          this.toastr.error(res.message);
        } else {
          Swal.fire({
            title: 'succes',
            text: res.message,
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.getAllCustomerList();
          });
          this.modalService.dismissAll();
         
        }
      },
      (error) => {
        this.spinner.hide()
        console.error("Error deleting customer:", error);
        this.toastr.error("Failed to delete customer");
      }
    );
  }
    
   getAllCustomerList(){
     this.customerList = [];
     this.spinner.show()
     this.service.getAllCustomerList().subscribe((res:any)=>{
       this.customerList = res.data
       console.log("this.customerList",this.customerList)
       this.spinner.hide()
     },error =>{
     console.log("error",error)
     this.spinner.hide();
     })
   }
   
}
 