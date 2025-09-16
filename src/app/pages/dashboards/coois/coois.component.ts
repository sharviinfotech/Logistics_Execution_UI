import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-coois',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coois.component.html',
  styleUrls: ['./coois.component.css']
})
export class CooisComponent {
  form: FormGroup;

  dropdownOptions: string[] = ['Order Headers', 'Confirmation', 'Goods'];
  formFieldsHide: boolean;

  constructor(private fb: FormBuilder, private service: GeneralserviceService, private toastr: ToastrService, private spinner: NgxSpinnerService) {
    this.form = this.fb.group({
      dropdown: [''],            // List dropdown
      prdOrdersCheck: [false],   // Production Order checkbox
      plndOrdersCheck: [false],  // Planned Order checkbox
      WERKS: [''],               // Plant

      AUFNR_F: [''], // From Order Number
      AUFNR_T: [''], // To Order Number
      AUART_F: [''], // From Order Type
      AUART_T: [''], // To Order Type

      KDAUF_F: [''], // From Sales Order
      KDAUF_T: [''], // To Sales Order
      KDPOS_F: [''], // From Sales Order Item
      KDPOS_T: ['']  // To Sales Order Item
    });
  }

  check(){
    if(this.form.value.prdOrdersCheck== true || this.form.value.plndOrdersCheck == true){
this.formFieldsHide = true
    }else{
      this.formFieldsHide = false
    }
  }
  onSubmit(): void {


    if (this.form.valid) {
      console.log('Form submitted', this.form.value);
      var obj

      if (this.form.value.dropdown == 'Order Headers') {
        obj = {
          "ORDER_HEADER": {
            "PRD_ORDERS": this.form.value.prdOrdersCheck,
            "PLND_ORDERS": this.form.value.plndOrdersCheck
          },
          "DATA": {
            "AUFNR_F": this.form.value.AUFNR_F,
            "AUFNR_T": this.form.value.AUFNR_T,
            "WERKS": this.form.value.WERKS,
            "AUART_F": this.form.value.AUART_F,
            "AUART_T": this.form.value.AUART_T,
            "KDAUF_F": this.form.value.KDAUF_F,
            "KDAUF_T": this.form.value.KDAUF_T,
            "KDPOS_F": this.form.value.KDPOS_F,
            "KDPOS_T": this.form.value.KDPOS_T
          }
        }
      } else if (this.form.value.dropdown == 'Confirmation') {
        obj = {

          "CONFIRMATION": {
            "AUFNR_F": this.form.value.AUFNR_F,
            "AUFNR_T": this.form.value.AUFNR_T,
            "WERKS": this.form.value.WERKS,
            "AUART_F": this.form.value.AUART_F,
            "AUART_T": this.form.value.AUART_T,
            "KDAUF_F": this.form.value.KDAUF_F,
            "KDAUF_T": this.form.value.KDAUF_T,
            "KDPOS_F": this.form.value.KDPOS_F,
            "KDPOS_T": this.form.value.KDPOS_T
          }
        }
      } else if (this.form.value.dropdown == 'Goods') {
        obj = {

          "GOODS": {
            "AUFNR_F": this.form.value.AUFNR_F,
            "AUFNR_T": this.form.value.AUFNR_T,
            "WERKS": this.form.value.WERKS,
            "AUART_F": this.form.value.AUART_F,
            "AUART_T": this.form.value.AUART_T,
            "KDAUF_F": this.form.value.KDAUF_F,
            "KDAUF_T": this.form.value.KDAUF_T,
            "KDPOS_F": this.form.value.KDPOS_F,
            "KDPOS_T": this.form.value.KDPOS_T
          }
        }
      }

      this.spinner.show()
      this.service.coois(obj).subscribe((res: any) => {
        console.log("res", res);
        this.spinner.hide()
        if (res.status == 400) {
          this.toastr.success(res.message);
        } else {
          // this.submit = false
          // Display success toast
          Swal.fire({
            title: '',
            text: res.message,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
        }

        // this.submitted = false;
      }, error => {
        this.spinner.hide()
        this.toastr.error(error);
        console.log("error", error);
      });
    }else{
      console.log('else Form submitted', this.form.value);

    }


  }

}






