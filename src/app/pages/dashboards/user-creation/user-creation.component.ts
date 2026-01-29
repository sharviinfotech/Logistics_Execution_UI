import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';

interface Plant {
  PLANT: string;
  DIVISION: string;
  PLANT_TEXT: string;
}

interface Division {
  WERKS: string;
  DIVISIONS: string;
}

interface Activity {
  ACT: string;
}

interface Role {
  name: string;
}

interface User {
  USER: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  CONTACT: string;
  PASSWORD: string;
  EMP_CODE: string;
  INOUT_TYPE: string;
  CATEGORY: string;
  ROLES: string;
  STATUS: string;
  PLANTS: { WERKS: string }[];
  DIVISIONS: Division[];
  ACTIVITIES: Activity[];
}

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html',
  styleUrls: ['./user-creation.component.css']
})
export class UserCreationComponent {

  // ===== Reactive Form =====
  userForm!: FormGroup;

  // ===== UI State =====
  showActivityCard = false;
  showModal = false;
  usernameError = false;
  editingIndex: number | null = null;

  // ===== F4 Data =====
  PlantCodeList: Plant[] = [];
  DivisionList: { DIVISION: string }[] = [];


  plantInput = '';
  divisionInputName = '';
  selectedPlantForDivision = '';

  // ===== Table Data =====
  users: User[] = [
    {
      USER: '10004',
      FIRST_NAME: 'John',
      LAST_NAME: 'Doe',
      EMAIL: 'john@example.com',
      CONTACT: '1234567890',
      PASSWORD: '******',
      EMP_CODE: 'EMP001',
      INOUT_TYPE: 'IN',
      CATEGORY: 'Internal',
      ROLES: 'ADMIN',
      STATUS: 'Active',
      PLANTS: [],
      DIVISIONS: [],
      ACTIVITIES: []
    }
  ];

  availableRoles: Role[] = [
    { name: 'ADMIN' }
  ];

  availableActivities: string[] = [
    'ORDER INFO',
    'SHIPMENT DETAILS',
    'SEGMENT INFO',
    'INVOICE LOAD DETAILS',
    'VEHICLE INFO',
    'TRANSIT INFO',
    'FREIGHT BILLING',
    'TRANSIT DAMAGE INFO',
    'INSURANCE CLAIM STATUS'
  ];

  // ===== Non-form arrays (kept same for Plant/Division) =====
  newUser: User = this.getEmptyUser();

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private service: GeneralserviceService,
    private spinnerService: SpinnerService
  ) {
    this.initForm();
  }

  // ================= Reactive Form Init =================
  initForm() {
    this.userForm = this.fb.group({
      USER: ['', Validators.required],
      FIRST_NAME: ['', Validators.required],
      LAST_NAME: [''],
      EMAIL: ['', Validators.required],
      CONTACT: ['', Validators.required],
      PASSWORD: ['', Validators.required],
      EMP_CODE: ['', Validators.required],
      INOUT_TYPE: ['', Validators.required],
      CATEGORY: ['Internal'],
      ROLES: ['', Validators.required],
      STATUS: ['Active'],

      // ✅ ADD THESE
      PLANT: [''],
      DIVISION: [''],

      ACTIVITIES: this.fb.array([])
    });
  }


  // ================= Activities FormArray =================
  get activitiesFormArray(): FormArray {
    return this.userForm.get('ACTIVITIES') as FormArray;
  }

  toggleActivityCard() {
    this.showActivityCard = !this.showActivityCard;
  }

  isActivitySelected(activity: string): boolean {
    return this.activitiesFormArray.value.includes(activity);
  }

  selectActivity(activity: string) {
    const index = this.activitiesFormArray.value.indexOf(activity);

    if (index > -1) {
      this.activitiesFormArray.removeAt(index);
    } else {
      this.activitiesFormArray.push(this.fb.control(activity));
    }
  }

  // ================= Helpers =================
  getEmptyUser(): User {
    return {
      USER: '',
      FIRST_NAME: '',
      LAST_NAME: '',
      EMAIL: '',
      CONTACT: '',
      PASSWORD: '',
      EMP_CODE: '',
      INOUT_TYPE: '',
      CATEGORY: 'Internal',
      ROLES: '',
      STATUS: 'Active',
      PLANTS: [],
      DIVISIONS: [],
      ACTIVITIES: []
    };
  }

  resetForm() {
    this.userForm.reset({
      CATEGORY: 'Internal',
      STATUS: 'Active'
    });

    this.activitiesFormArray.clear();

    this.newUser = this.getEmptyUser();
    this.plantInput = '';
    this.selectedPlantForDivision = '';
    this.divisionInputName = '';
    this.usernameError = false;
  }

  onUsernameChange() {
    this.usernameError = this.userForm.get('USER')?.invalid || false;
  }

  // ================= Modal =================
  openModal() {
    this.showModal = true;
    this.usernameError = false;
    this.fetchPlantCodeList();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
    this.editingIndex = null;
  }

  // ================= Status =================
  setStatus(status: string) {
    this.userForm.patchValue({ STATUS: status });
  }

  // ================= Plant / Division (UNCHANGED) =================
  fetchPlantCodeList(): void {
    this.spinner.show();

    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res && res[0]?.PLANT) {
          this.PlantCodeList = res[0].PLANT;


          const allDivisions = this.PlantCodeList.map(p => p.DIVISION);
          console.log('🟢 PlantCodeList:', this.PlantCodeList);

          const uniqueDivisions = Array.from(new Set(allDivisions));

          this.DivisionList = uniqueDivisions.map(div => ({
            DIVISION: div
          }));
          console.log('🟠 Final DivisionList for Dropdown:', this.DivisionList);

        } else {
          Swal.fire('No Plant Found', '', 'warning');
        }

        this.spinner.hide();
      },
      error => {
        this.spinner.hide();
        Swal.fire('Error fetching plants', '', 'error');
      }
    );
  }


  // onPlantChange() {
  //   this.selectedPlantForDivision = this.plantInput;

  //   this.DivisionList = this.PlantCodeList
  //     .filter(p => p.PLANT.toString() === this.plantInput.toString())
  //     .map(p => ({ DIVISION: p.DIVISION }));

  //   this.divisionInputName = '';
  // }

  // addPlant() {
  //   if (this.plantInput) {
  //     const exists = this.newUser.PLANTS.some(p => p.WERKS === this.plantInput);
  //     if (!exists) this.newUser.PLANTS.push({ WERKS: this.plantInput });
  //     this.plantInput = '';
  //   }
  // }

  removePlant(index: number) {
    this.newUser.PLANTS.splice(index, 1);
  }

  // addDivision() {
  //   if (this.selectedPlantForDivision && this.divisionInputName) {
  //     const exists = this.newUser.DIVISIONS.some(
  //       d => d.WERKS === this.selectedPlantForDivision &&
  //         d.DIVISIONS === this.divisionInputName
  //     );

  //     if (!exists) {
  //       this.newUser.DIVISIONS.push({
  //         WERKS: this.selectedPlantForDivision,
  //         DIVISIONS: this.divisionInputName
  //       });
  //     }

  //     this.divisionInputName = '';
  //   } else {
  //     Swal.fire('Please select Plant and Division', '', 'warning');
  //   }
  // }

  removeDivision(index: number) {
    this.newUser.DIVISIONS.splice(index, 1);
  }

  // ================= Create / Edit =================
  createUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      alert('Please fill required fields');
      return;
    }

    const formValue = this.userForm.value;

    const finalUser: User = {
      ...formValue,

      // convert FormArray to backend format
      ACTIVITIES: formValue.ACTIVITIES.map((a: string) => ({ ACT: a })),

      // keep Plant/Division logic same
      PLANTS: this.newUser.PLANTS,
      DIVISIONS: this.newUser.DIVISIONS
    };

    if (this.editingIndex !== null) {
      this.users[this.editingIndex] = JSON.parse(JSON.stringify(finalUser));
    } else {
      this.users.push(JSON.parse(JSON.stringify(finalUser)));
    }

    this.closeModal();
  }

  editUser(user: User, index: number) {
    this.editingIndex = index;

    this.userForm.patchValue({
      USER: user.USER,
      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,
      EMAIL: user.EMAIL,
      CONTACT: user.CONTACT,
      PASSWORD: user.PASSWORD,
      EMP_CODE: user.EMP_CODE,
      INOUT_TYPE: user.INOUT_TYPE,
      CATEGORY: user.CATEGORY,
      ROLES: user.ROLES,
      STATUS: user.STATUS
    });

    // reload activities into FormArray
    this.activitiesFormArray.clear();
    user.ACTIVITIES.forEach(a => {
      this.activitiesFormArray.push(this.fb.control(a.ACT));
    });

    // keep Plant/Division same
    this.newUser.PLANTS = [...user.PLANTS];
    this.newUser.DIVISIONS = [...user.DIVISIONS];

    this.showModal = true;
    this.fetchPlantCodeList();
  }

  deleteUser(index: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users.splice(index, 1);
    }
  }
}
