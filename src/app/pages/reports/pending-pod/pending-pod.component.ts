import { Component, OnInit  } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
@Component({
  selector: 'app-pending-pod',
  templateUrl: './pending-pod.component.html',
  styleUrl: './pending-pod.component.css'
})
export class PendingPodComponent implements OnInit{

Pendingform!: FormGroup;
 
  // Static Data
  allData = [
    {
      WERKS: '1000',
      KDAUF_AUFK: '500001',
      KDPOS_AUFK: '10',
      MATNR: 'MAT001',
      MATXT: 'Sample Material',
      AUFNR: '300001',
      AUART: 'PP01',
      STEXT: 'Released',
      GWEMG: 10,
      GAMNG: 100
    },
    {
      WERKS: '2000',
      KDAUF_AUFK: '500002',
      KDPOS_AUFK: '20',
      MATNR: 'MAT002',
      MATXT: 'Material 2',
      AUFNR: '300002',
      AUART: 'PP02',
      STEXT: 'Pending',
      GWEMG: 20,
      GAMNG: 200
    }
  ];
 
  filteredData: any[] = [];
 
  constructor(private fb: FormBuilder) {}
 
  ngOnInit(): void {
  this.Pendingform = this.fb.group({
  INOUT: ['',Validators.required],
  SAPTYPE: [''],
  FROM_DATE: ['',Validators.required],
  TO_DATE: ['',Validators.required],
  TRANS_GROUP: [''],
  TRANSPORTER: [''],
  WERKS: [''],
  MATNR: [''],
  DIVISION: [''],
  CUSTOMER: [''],
  BRANCH: [''],
  BRANCH_ZONE: [''],
  DEST_LOCATION: [''],
  DEST_STATE: [''],
  DEST_ZONE: [''],
  INCOTERMS: ['']
});
  }
 
  // ✅ EXECUTE BUTTON
  onSearch() {
    const formValues = this.Pendingform.value;
 
    this.filteredData = this.allData.filter(item => {
 
      return (
        (!formValues.WERKS || item.WERKS === formValues.WERKS) &&
        (!formValues.AUART || item.AUART === formValues.AUART) &&
        (!formValues.KDAUF || item.KDAUF_AUFK === formValues.KDAUF)
      );
 
    });
 
    console.log('Filtered Data:', this.filteredData);
  }
 
  // ✅ CLEAR BUTTON
  resetForm() {
    this.Pendingform.reset();
    this.filteredData = []; // clear table
  }
}
