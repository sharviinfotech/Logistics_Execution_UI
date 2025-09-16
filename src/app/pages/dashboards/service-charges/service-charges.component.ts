import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeneralserviceService } from 'src/app/generalservice.service'; 
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-service-charges',
  templateUrl: './service-charges.component.html',
  styleUrls: ['./service-charges.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true
})
export class ServiceChargesComponent implements OnInit {
  @ViewChild('editservicesChargeTemplate') editservicesChargeTemplate!: TemplateRef<any>;
  chargesForm: FormGroup;
  servicesEditForm: FormGroup;

  submitted: boolean;
  currentChargeId: string | null = null;
  editForm:FormGroup;
  allCharges: any[] = []; // Initialize as an empty array
  submit: boolean = false;
  chargesUniqueId:number;
  userRole: string = '';
  isEditing = false;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private modalService: NgbModal,
    private service: GeneralserviceService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.chargesForm = this.fb.group({
      chargesName: ['', Validators.required]
    });
    this.editForm = this.fb.group({
      chargesName: ['', Validators.required]
    });
    this.getAllCharges(); // Fetch charges when the component initializes
    this.route.queryParams.subscribe(params => {
      this.userRole = params['role'];
      console.log('User Role:', this.userRole);
    });
  }

  get chargesName() {
    return this.chargesForm.get('chargesName');
  }
  editservicesCharge(charge: any) {
    this.currentChargeId = charge.chargesUniqueId;
    
    this.editForm.patchValue({
      chargesName: charge.chargesName
      
    });
    
    this.modalService.open(this.editservicesChargeTemplate, {
      centered: true,
      backdrop: 'static',
      size: 'lg' // Adjust size as needed
    });
    
    this.isEditing = true;
    this.submit = false; // Reset submit flag
  }

  SaveCharges() {
    if (this.chargesName.invalid) {
      this.submit = true;
      return;
    }

    let data = {
      chargesName: this.chargesName.value,
    };
    this.spinner.show()
    this.service.SaveCharges(data).subscribe((res: any) => {
      this.spinner.hide()

      if (res.status === 200) {

        this.getAllCharges(); // Refresh the list after saving
        this.chargesForm.reset(); // Reset the form
          Swal.fire({
                    text: res.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                  }).then(() => {
                    
                  });
        
      } else {
        this.toastr.error('Failed to save charge.');
      }
    }, error => {
      this.toastr.error('An error occurred while saving the charge.');
      console.error("Error saving charge:", error);
      this.spinner.hide()

    });
  
  }
  
  // delete(charge): void {
  //   console.log('Deleting Customer with ID:',charge);
  //   this.chargesUniqueId= null
  // this.chargesUniqueId = charge.chargesUniqueId
  //   let deletePayload = {
  //     globalId: this.chargesUniqueId,
  //     screenName: "charges"
  //   };
  
  //   console.log("Delete payload:", deletePayload);
  // this.spinner.show()
  //   this.service.deteleGlobal(deletePayload).subscribe((res: any) => {
  //       console.log("deleteGlobal response:", res);
  //       this.spinner.hide()
  //       if (res.status === 400) {
  //         this.toastr.error(res.message);
  //       } else {
  //         Swal.fire({
  //           title: 'succes',
  //           text: res.message,
  //           icon: 'success',
  //           confirmButtonText: 'OK'
  //         }).then(() => {
  //           this.getAllCharges();
  //         });
  //         // this.modalService.dismissAll();
         
  //       }
  //     },
  //     (error) => {
  //       this.spinner.hide()
  //       console.error("Error deleting customer:", error);
  //       this.toastr.error("Failed to delete customer");
  //     }
  //   );
  // }
  delete(data): void {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this service charge?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        timer: 10000
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('Deleting Services Charge with ID:', data);
            this.chargesUniqueId = data.chargesUniqueId;
            
            let deletePayload = {
              globalId: this.chargesUniqueId,
              screenName: "charges"
            };
  
            console.log("Delete payload:", deletePayload);
            this.spinner.show();
  
            this.service.deteleGlobal(deletePayload).subscribe(
                (res: any) => {
                    console.log("deleteGlobal response:", res);
                    this.spinner.hide();
                    
                    if (res.status === 200) {
                      this.getAllCharges();
                        Swal.fire({
                            title: 'Success',
                            text: res.message,
                            icon: 'success',
                            confirmButtonText: 'OK',
                            timer: 5000
                        }).then(() => {
                            
                            this.modalService.dismissAll();
                        });
                    } else {
                        this.toastr.error(res.message);
                    }
                },
                (error) => {
                    this.spinner.hide();
                    console.error("Error deleting service charge:", error);
                    this.toastr.error("Failed to delete service charge");
                }
            );
        }
    });
  }
  updateCharge() {
    console.log('Edit services:', this.editForm.value);
      this.submitted = true;
      
    if (this.editForm.invalid) {
      return;
    }
  
    let updatedata = {
      chargesUniqueId:this.currentChargeId,
      chargesName:  this.editForm.value.chargesName,
     
    };
    console.log("Updating services with data:", updatedata);
    this.spinner.show();
    
    
      this.service.UpdateCharges(updatedata).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.status === 200) {
            this.getAllCharges();
            this.modalService.dismissAll();
            Swal.fire({
              text: res.message,
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            this.toastr.error(res.message || 'Failed to update charge');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.toastr.error(err.error?.message || 'Error updating charge');
        }
      });
    
  }

  getAllCharges() {
    this.spinner.show()
    this.service.getAllCharges().subscribe((res: any) => {
      this.allCharges = res.data; // Update the allCharges array with the fetched data
      this.spinner.hide()
    }, error => {
      console.error("Error fetching charges:", error);
      this.spinner.hide()

    });
  }
}