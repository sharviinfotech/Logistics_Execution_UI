import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-transit-damage-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transit-damage-info.component.html',
  styleUrl: './transit-damage-info.component.css'
})
export class TransitDamageInfoComponent implements OnInit {

  orderType: any;
  sapType: any;
  invoicenumber: any;

  HeaderForm!: FormGroup;
  ItemForm!: FormGroup;

  showTable = false;

  constructor(private fb: FormBuilder, private service: GeneralserviceService) { }

  ngOnInit(): void {
    this.buildHeaderForm();
    this.buildItemForm();
  }

  // ✅ Header form
  buildHeaderForm() {
    this.HeaderForm = this.fb.group({
      INV_NO: [''],
      INV_DATE: [''],
      FSR_RPT_DT: [''],
      BASIC_VALUE: [''],
      INC_DATE: [''],
      CUSTOMER: [''],
      CONSIGN_NAME: [''],
      DAMAGE_RMK: [''],
      SETTLEMENT: [''],
      CLOSING_DT: [''],
      IMAGES: ['']
    });
  }

  // ✅ Item form
  buildItemForm() {
    this.ItemForm = this.fb.group({
      ITEMS: this.fb.array([])
    });
  }

  get items() {
    return this.ItemForm.get('ITEMS') as FormArray;
  }

  addItemRow() {
    const row = this.fb.group({
      INV_NO: [''],
      POSNR: [''],
      VEH_LINE: [''],
      TRUCK_NO: [''],
      LR_NO: [''],
      TRANSPORTER: ['']
    });

    this.items.push(row);
  }

  removeItemRow(i: number) {
    this.items.removeAt(i);
  }

  // ✅ RESET ALL
  resetForms() {
    this.showTable = false;

    this.HeaderForm.reset();

    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    this.invoicenumber = "";
  }

  onOrderTypeSelection() {
    this.resetForms();
    this.sapType = null;
  }

  onSapTypeSelection() {
    this.resetForms();
  }

  // ✅ ✅ ✅ MAIN FUNCTION — FETCH API & FILL DATA
  fetchInvoiceDetails() {
    if (!this.invoicenumber) return;

    const payload = {
      VBELN: this.invoicenumber
    };

    this.service.TransitDamageInfofetch(payload).subscribe({
      next: (res: any) => {

        if (!res || res.length === 0) {
          alert("No data found");
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        // ✅ Show UI
        this.showTable = true;

        // ✅ Fill Header
        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES
        });

        // ✅ Clear old items
        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        // ✅ Fill ITEM array
        items.forEach((x: any) => {
          const row = this.fb.group({
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER]
          });

          this.items.push(row);
        });
      },
      error: (err) => {
        console.error(err);
        alert("Error fetching data");
      }
    });
  }

  // ✅ FINAL SAVE FUNCTION
  onSave() {

    // ✅ Build Final Payload EXACTLY AS API NEEDS
    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.ItemForm.value.ITEMS   // ✅ correct
    };

    console.log("✅ Final Save Payload Sent:", payload);

    // ✅ CALL SAVE API
    this.service.TransitDamageInfoSave(payload).subscribe({
      next: (res: any) => {

        console.log("✅ SAVE RESPONSE:", res);

        if (res && res.STATUS === "TRUE") {
          alert("✅ Data Saved Successfully!");
        } else {
          alert("⚠️ Save Failed: " + res.MESSAGE);
        }

      },
      error: (err) => {
        console.error(err);
        alert("❌ Error while saving data");
      }
    });

  }
  fetchInvoiceDetailsnonsap() {
    if (!this.invoicenumber) return;

    const payload = {
      VBELN: this.invoicenumber
    };

    this.service.fetchinvoicelistnonsapwosp(payload).subscribe({
      next: (res: any) => {

        if (!res || res.length === 0) {
          alert("No data found");
          return;
        }

        const header = res[0].HEADER;
        const items = res[0].ITEM;

        // ✅ Show UI
        this.showTable = true;

        // ✅ Fill Header
        this.HeaderForm.patchValue({
          INV_NO: header.INV_NO,
          INV_DATE: header.INV_DATE,
          FSR_RPT_DT: header.FSR_RPT_DT,
          BASIC_VALUE: header.BASIC_VALUE,
          INC_DATE: header.INC_DATE,
          CUSTOMER: header.CUSTOMER,
          CONSIGN_NAME: header.CONSIGN_NAME,
          DAMAGE_RMK: header.DAMAGE_RMK,
          SETTLEMENT: header.SETTLEMENT,
          CLOSING_DT: header.CLOSING_DT,
          IMAGES: header.IMAGES
        });

        // ✅ Clear old items
        while (this.items.length !== 0) {
          this.items.removeAt(0);
        }

        // ✅ Fill items
        items.forEach((x: any) => {
          const row = this.fb.group({
            INV_NO: [x.INV_NO],
            POSNR: [x.POSNR],
            VEH_LINE: [x.VEH_LINE],
            TRUCK_NO: [x.TRUCK_NO],
            LR_NO: [x.LR_NO],
            TRANSPORTER: [x.TRANSPORTER]
          });

          this.items.push(row);
        });

      },
      error: (err) => {
        console.error(err);
        alert("Error fetching NON-SAP data");
      }
    });
  }

  onSaveNonSap() {

    // ✅ Build Final Payload EXACTLY AS API NEEDS
    const payload = {
      HEADER: this.HeaderForm.value,
      ITEM: this.ItemForm.value.ITEMS   // ✅ correct
    };

    console.log("✅ Final Save Payload Sent:", payload);

    // ✅ CALL SAVE API
    this.service.withoutsapSave(payload).subscribe({
      next: (res: any) => {

        console.log("✅ SAVE RESPONSE:", res);

        if (res && res.STATUS === "TRUE") {
          alert("✅ Data Saved Successfully!");
        } else {
          alert("⚠️ Save Failed: " + res.MESSAGE);
        }

      },
      error: (err) => {
        console.error(err);
        alert("❌ Error while saving data");
      }
    });

  }

}
