import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GeneralserviceService } from 'src/app/generalservice.service'; // Adjust path if necessary
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-invoice-user-creation',
  templateUrl: './invoice-user-creation.component.html',
  styleUrls: ['./invoice-user-creation.component.css'], 
  imports: [CommonModule, ReactiveFormsModule, FormsModule,],
    standalone: true
})
export class InvoiceUserCreationComponent implements OnInit {
  @ViewChild('editUserTemplate') editUserTemplate!: TemplateRef<any>;

  // invoiceUserCreationForm!: FormGroup;
  userCreationForm!: FormGroup;
  userEditForm!: FormGroup;
  CreateUser: any[] = [];
  selectedUser: any = null;
  modalRef: any;
  userEditModal: any;
  

  fieldTextType: boolean = false;
  submitted = false;
confirmFieldTextType: boolean = false;
  userNewCreation: any[];
  userList: any[];
  submit: boolean=false;
  userUniqueId: any;
  loginData: any;
  c: any;
  
 

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private service: GeneralserviceService,private toastr: ToastrService,private spinner:NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.userCreationForm = this.fb.group({
      userName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      activity: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]] ,
      status: [true]
    });
  
    


    this.userEditForm = this.fb.group({

      userName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      activity: ['', Validators.required],
      status: [false]
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
    // this.loadDummyUsers();
    this.getInvoiceUserDetails(); // Fetch users from API
    this.getAllUserList()
    this.loginData = this.service.getLoginResponse()
  }
  editUser(selectedUser: any, content: any) {
    console.log('Selected User:', selectedUser); // Debugging

    if (!selectedUser) {
      console.error('No user data found');
      return;
    }
  }
 

  openEditModal(user: any, editUserTemplate: TemplateRef<any>): void {
    this.submit = false
    console.log('user',user);
    this.userUniqueId =null
    const selectedUser = user;
    this.userUniqueId = user.userUniqueId
    this.userEditForm.patchValue({
      userName: selectedUser.userName,
      firstName: selectedUser.userFirstName,
      lastName: selectedUser.userLastName,
      email: selectedUser.userEmail,
      contact: selectedUser.userContact,
      password: selectedUser.userPassword,
      confirmPassword: selectedUser.userConfirmPassword,
      activity: selectedUser.userActivity,
      status: selectedUser.userStatus 
    });
    this.modalService.open(this.editUserTemplate, {
      backdrop: 'static', 
      keyboard: false ,size:'lg'
    });  
  }


  mustMatch(password: string, confirmPassword: string) {
    return (formGroup: FormGroup) => {
      const passControl = formGroup.controls[password];
      const confirmPassControl = formGroup.controls[confirmPassword];
  
      if (confirmPassControl.errors && !confirmPassControl.errors['mustMatch']) {
        return;
      }
  
      if (passControl.value !== confirmPassControl.value) {
        confirmPassControl.setErrors({ mustMatch: true });
      } else {
        confirmPassControl.setErrors(null);
      }
    };
  }
  
  
  

  // private loadDummyUsers(): void {
  //   this.userList = [
  //     { userName: 'john_doe', firstName: 'John', lastName: 'Doe', email: 'john@example.com', contact: '1234567890' },
  //     { userName: 'jane_smith', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', contact: '0987654321' },
  //     { userName: 'mark_wilson', firstName: 'Mark', lastName: 'Wilson', email: 'mark@example.com', contact: '9876543210' }
  //   ];
  // }

  // Initialize Forms with Dummy Data for New User

  // passwordMatchValidator(control: any): { [key: string]: boolean } | null {
  //   if (this.editUserTemplate && control.value !== this.editUserTemplate.get('password')?.value) {
  //     return { mustMatch: true };
  //   }
  //   return null;
  // }
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  toggleConfirmFieldTextType() {
    this.confirmFieldTextType = !this.confirmFieldTextType;
  }
  toggleStatus(): void {
    this.userEditForm.patchValue({ status: !this.userEditForm.value.status });
  }


  
  // Password match validator function
  // mustMatch(controlName: string, matchingControlName: string) {
  //   return (formGroup: FormGroup) => {
  //     const control = formGroup.controls[controlName];
  //     const matchingControl = formGroup.controls[matchingControlName];
  
  //     if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
  //       return;
  //     }
  
  //     if (control.value !== matchingControl.value) {
  //       matchingControl.setErrors({ mustMatch: true });
  //     } else {
  //       matchingControl.setErrors(null);
  //     }
  //   };
  // }
  
  // Fetch users from API
  getInvoiceUserDetails(): void {
    // this.service.userList().subscribe({
    //   next: (res: any) => {
    //     this.userList = res.responseData.data || [];
    //     console.log('User List:', this.userList);
    //   },
    //   error: (error) => {
    //     console.error('Error fetching user details:', error);
    //   }
    // });
  }

  // Open Edit Modal
 
  newUserCreation(newUserTemplate: any): void {
    this.submit =false
    this.userCreationForm.reset()
    this.userCreationForm.patchValue({
      "status": true
    })
    this.modalService.open(newUserTemplate,{  backdrop: 'static', 
      keyboard: false,size:'lg' });
  
  }
  get f() {
     return this.userCreationForm.controls;
     }
     

  // Update User Information
  updateUserCreation(modal: any): void {
    if (this.userEditForm.valid) {
      console.log('Updated Data:', this.userEditForm.value);
      // Here, you would typically send the updated data to the backend
    
  
      
      let updateObj = {
        "userUniqueId": this.userUniqueId, // Assuming the unique ID is part of the form
        "userName": this.userEditForm.value.userName,
        "userFirstName": this.userEditForm.value.firstName,
        "userLastName": this.userEditForm.value.lastName,
        "userEmail": this.userEditForm.value.email,
        "userContact": this.userEditForm.value.contact,
        "userPassword": this.userEditForm.value.password,
        "userConfirmPassword": this.userEditForm.value.confirmPassword,
        "userStatus": this.userEditForm.value.status,
        "userActivity": this.userEditForm.value.activity,

      };
      
      console.log("updateObj", updateObj);
      this.spinner.show()
      this.service. updateExitUser(updateObj,this.userUniqueId).subscribe((res: any) => {
        console.log("updateUserCreation", res);
        this.spinner.hide()
        if (res.status == 400) {
          this.toastr.success(res.message);
        } else {
          this.submit =false
          // Display success toast
          this.modalService.dismissAll(modal);
          Swal.fire({
            title: '',
            text: res.message,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer:5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
        }
        this.userEditForm.reset()
        this.getAllUserList();
        
        this.submitted = false;
      }, error => {
        this.spinner.hide()
        this.toastr.error(error);
        console.log("error", error);
      });
    } else {
      console.log('Form is invalid');// Ensure all fields are marked as touched
      this.submit =true
    }
  }
  
  // submitNewUser() {
  //   this.submitted = true;
  //   if (this.userCreationForm.invalid) {
  //     return;
  //   }
  //   // Handle form submission logic
  // }

  submitUserForm(modal: any) {
    console.log('Create User:', this.userCreationForm.value);
  
    if (this.userCreationForm.invalid == true) {
      this.submit = true;
      return;
    } else {
      this.submit = false;

  
    let creatObj = {
      "userName": this.userCreationForm.value.userName,
      "userFirstName": this.userCreationForm.value.firstName,
      "userLastName": this.userCreationForm.value.lastName,
      "userEmail": this.userCreationForm.value.email,
      "userContact": this.userCreationForm.value.contact,
      "userPassword": this.userCreationForm.value.password,
      "userConfirmPassword": this.userCreationForm.value.confirmPassword,
      "userStatus": this.userCreationForm.value.status,
      "userActivity": this.userCreationForm.value.activity
    };
  
    console.log("creatObj", creatObj);
  this.spinner.show()
    this.service.userNewCreation(creatObj).subscribe((res: any) => {
      console.log("submitUserForm", res);
      console.log('apiErr', res, res.responseData);
      this.spinner.hide()

      if(res.status == 400){
        this.toastr.success(res.message);

      }else{
         // Display success toast
         this.userCreationForm.reset()
         
      this.modalService.dismissAll(modal);
      // this.c('Close click');
      this.getAllUserList()
      Swal.fire({
        title: '',
        text: res.message,
        icon: 'success',
        cancelButtonText: 'Ok',
        timer:5000
      }).then((result) => {
        if (result) {
  
        } else {
  
        }
      });
      }
      
  
     
  
      this.getAllUserList();
      // this.modalService.dismissAll(modal);
      this.submitted = true;
      this.submit=false
    }, error => {
        this.toastr.error(error)
      // this.modalService.dismissAll(modal);
      console.log("error", error);
      this.spinner.hide()

    });
  }
  }
  //  delete(data): void {
  //     console.log('Deleting Customer with ID:',data, this.userUniqueId);
  //   this.userUniqueId = data.userUniqueId
  //     let deletePayload = {
  //       globalId: this.userUniqueId,
  //       screenName: "user"
  //     };
    
  //     console.log("Delete payload:", deletePayload);
  //   this.spinner.show()
  //     this.service.deteleGlobal(deletePayload).subscribe((res: any) => {
  //         console.log("deleteGlobal response:", res);
  //         this.spinner.hide()
  //         if (res.status === 400) {
  //           this.toastr.error(res.message);
  //         } else {
            
  //           Swal.fire({
  //             title: 'succes',
  //             text: res.message,
  //             icon: 'success',
  //             confirmButtonText: 'OK'
  //           }).then(() => {
              
  //           });
  //           this.modalService.dismissAll();
           
  //         }
  //       },
  //       (error) => {
  //         this.spinner.hide()
  //         console.error("Error deleting customer:", error);
  //         this.toastr.error("Failed to delete customer");
  //       }
  //     );
  //   }
  delete(data): void {
    console.log("data",data.userActivity)
    const adminCount = this.userList.filter(user => user.userActivity === 'ADMIN').length;
    console.log("Admin Count:", adminCount);
    const accountsCount = this.userList.filter(user => user.userActivity === 'ACCOUNTS').length;
    console.log("Admin Count:", adminCount);

    // If there is only one admin and we are trying to delete an admin, show error message
    if (adminCount === 1 && data.userActivity == 'ADMIN') {
      Swal.fire({
        title: 'Cannot Delete!',
        text: "At least one Admin must remain. Please create another Admin before deleting.",
        icon: 'error',
        confirmButtonText: 'OK',
        timer:10000
      });
      return; // Stop further execution
    }
   else if (accountsCount === 1 && data.userActivity == 'ACCOUNTS') {
      Swal.fire({
        title: 'Cannot Delete!',
        text: "At least one Accounts must remain. Please create another Accounts before deleting.",
        icon: 'error',
        confirmButtonText: 'OK',
        timer:10000
      });
      return; // Stop further execution
    }
    else{
      Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this user?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        timer:10000 
      }).then((result) => {
        if (result.isConfirmed) {
          this.spinner.show();
          console.log('Deleting Customer with ID:', data, this.userUniqueId);
          this.userUniqueId = data.userUniqueId;
          let deletePayload = {
            globalId: this.userUniqueId,
            screenName: "user"
          };
         
          console.log("Delete payload:", deletePayload);
          this.service.deteleGlobal(deletePayload).subscribe((res: any) => {
            console.log("deleteGlobal response:", res);
            this.spinner.hide();
            if (res.status === 200) {
              this.getAllUserList()
              Swal.fire({
                title: 'Success',
                text: res.message,
                icon: 'success',
                confirmButtonText: 'OK',
                timer:5000
              }).then(() => {
                this.modalService.dismissAll();
                
              });
             
            } else {
              this.toastr.error(res.message);
            }
          }, (error) => {
            this.spinner.hide();
            console.error("Error deleting customer:", error);
            this.toastr.error("Failed to delete customer");
          });
        }
      });
    }

  
   
   
   
  }
  
  getAllUserList(){
    this.userList = [];
    this.spinner.show()
    this.service.getAllUserList().subscribe((res:any)=>{
      this.userList = res.data
      this.spinner.hide()
      console.log("this.userList",this.userList)
    },error =>{
      this.spinner.hide()
    console.log("error",error)
    })
  }
}
