import { Component, OnInit } from '@angular/core';

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
  DIVISION: string;
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
export class UserCreationComponent implements OnInit {

  ngOnInit() {
    this.fetchUsers();   // 🔥 THIS WAS MISSING
  }


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


  onPlantChange() {
    const plant = this.userForm.value.PLANT;

    if (plant) {
      const exists = this.newUser.PLANTS.some(p => p.WERKS === plant);
      if (!exists) {
        this.newUser.PLANTS.push({ WERKS: plant });
      }

      // Filter divisions for selected plant
      this.DivisionList = this.PlantCodeList
        .filter(p => p.PLANT === plant)
        .map(p => ({ DIVISION: p.DIVISION }));

      this.userForm.patchValue({ DIVISION: '' });
    }
  }

  onDivisionChange() {
    const plant = this.userForm.value.PLANT;
    const division = this.userForm.value.DIVISION;

    if (plant && division) {
      const exists = this.newUser.DIVISIONS.some(
        d => d.WERKS === plant && d.DIVISION === division
      );

      if (!exists) {
        this.newUser.DIVISIONS.push({
          WERKS: plant,
          DIVISION: division
        });
      }
    }

    console.log('🟣 Selected Divisions:', this.newUser.DIVISIONS);
  }



  removePlant(index: number) {
    this.newUser.PLANTS.splice(index, 1);
  }



  removeDivision(index: number) {
    this.newUser.DIVISIONS.splice(index, 1);
  }


  fetchUsers() {
    this.spinner.show();

    this.service.UserCreationDisplayTable().subscribe(
      (res: any[]) => {
        this.spinner.hide();
        console.log('🟢 DisplayTable API Response:', res);

        if (Array.isArray(res)) {
          this.users = res.map(u => ({
            USER: u.USER,
            FIRST_NAME: u.FIRST_NAME,
            LAST_NAME: u.LAST_NAME,
            EMAIL: u.EMAIL,
            CONTACT: u.CONTACT,
            PASSWORD: u.PASSWORD,
            EMP_CODE: String(u.EMP_CODE),
            INOUT_TYPE: u.INOUT_TYPE,
            CATEGORY: u.CATEGORY,
            STATUS: u.STATUS === 'ACTIVE' ? 'Active' : u.STATUS,

            // ✅ Map TYUSER → ROLES
            ROLES: u.TYUSER,

            // ✅ Plants
            PLANTS: (u.PLANTS || []).map((p: any) => ({
              WERKS: p.WERKS
            })),

            // ✅ Divisions (API uses DIVISION)
            DIVISIONS: (u.DIVISIONS || []).map((d: any) => ({
              WERKS: d.WERKS,
              DIVISION: d.DIVISION   // ✅
            })),



            // ✅ Map ACTIVITY → ACTIVITIES
            ACTIVITIES: (u.ACTIVITY || []).map((a: any) => ({
              ACT: a.ACT
            }))
          }));
        } else {
          this.users = [];
        }
      },
      error => {
        this.spinner.hide();
        console.error('🔴 DisplayTable API Error:', error);
        Swal.fire('Error', 'Failed to load users table', 'error');
      }
    );
  }


  // ================= Create / Edit =================
  createUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Swal.fire('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    const formValue = this.userForm.value;

    // ✅ Final API Payload
    const payload = {
      CREATE: {
        USER: formValue.USER,
        FIRST_NAME: formValue.FIRST_NAME,
        LAST_NAME: formValue.LAST_NAME,
        EMAIL: formValue.EMAIL,
        CONTACT: formValue.CONTACT,
        PASSWORD: formValue.PASSWORD,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        CATEGORY: formValue.CATEGORY,

        TYUSER: formValue.ROLES,
        STATUS: formValue.STATUS,

        PLANTS: this.newUser.PLANTS.map(p => ({ WERKS: p.WERKS })),
        DIVISIONS: this.newUser.DIVISIONS.map(d => ({
          WERKS: d.WERKS,
          DIVISIONS: this.newUser.DIVISIONS.map(d => ({
            WERKS: d.WERKS,
            DIVISIONS: d.DIVISION   // ✅ BACKEND KEY
          }))

        })),


        ACTIVITY: formValue.ACTIVITIES.map((a: string) => ({ ACT: a }))
      }
    };


    console.log('🟢 GlobalUserAuth Payload:', payload);

    // ================= API CALL =================
    this.spinner.show();

    this.service.GlobalUserAuth(payload).subscribe(
      (res: any) => {
        this.spinner.hide();

        console.log('🟢 GlobalUserAuth Response:', res);

        if (res && res.SUCCESS) {
          Swal.fire('Success', 'User created successfully', 'success');

          // Optional: update local table
          this.users.push(JSON.parse(JSON.stringify(payload)));

          this.closeModal();
        } else {
          Swal.fire('Failed', res?.MESSAGE || 'User creation failed', 'error');
        }
      },
      (error) => {
        this.spinner.hide();
        console.error('🔴 GlobalUserAuth Error:', error);
        Swal.fire('Error', 'API Error while creating user', 'error');
      }
    );
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

    // ===== Activities =====
    this.activitiesFormArray.clear();
    user.ACTIVITIES.forEach(a => {
      this.activitiesFormArray.push(this.fb.control(a.ACT));
    });

    // ===== Plants & Divisions =====
    this.newUser.PLANTS = [...user.PLANTS];
    this.newUser.DIVISIONS = [...user.DIVISIONS];

    this.showModal = true;

    // 🔥 Load plants FIRST
    this.fetchPlantCodeList();

    // 🔥 After small delay, set plant & rebuild divisions
    setTimeout(() => {
      if (this.newUser.PLANTS.length > 0) {
        const selectedPlant = this.newUser.PLANTS[0].WERKS;

        this.userForm.patchValue({ PLANT: selectedPlant });

        this.DivisionList = this.PlantCodeList
          .filter(p => p.PLANT === selectedPlant)
          .map(p => ({ DIVISION: p.DIVISION }));

        // 🔥 ALSO SET FIRST DIVISION (if exists)
        if (this.newUser.DIVISIONS.length > 0) {
          const selectedDivision = this.newUser.DIVISIONS[0].DIVISION;
          this.userForm.patchValue({ DIVISION: selectedDivision });
        }
      }
    }, 300);

  }



  updateUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Swal.fire('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    const formValue = this.userForm.value;

    // 🔥 EXACT BACKEND FORMAT
    const payload = {
      EDIT: {
        USER: formValue.USER,
        FIRST_NAME: formValue.FIRST_NAME,
        LAST_NAME: formValue.LAST_NAME,
        EMAIL: formValue.EMAIL,
        CONTACT: formValue.CONTACT,
        PASSWORD: formValue.PASSWORD,
        STATUS: formValue.STATUS,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,

        // Backend expects TYUSER (not ROLES)
        TYUSER: formValue.ROLES,

        CATEGORY: formValue.CATEGORY,

        // Plants
        PLANTS: this.newUser.PLANTS.map(p => ({
          WERKS: p.WERKS
        })),

        // Divisions (uses DIVISIONS key)
        DIVISIONS: this.newUser.DIVISIONS.map(d => ({
          WERKS: d.WERKS,
          DIVISIONS: d.DIVISION   // ✅ BACKEND KEY
        })),



        // Backend expects ACTIVITY (not ACTIVITIES)
        ACTIVITY: this.activitiesFormArray.value.map((a: string) => ({
          ACT: a
        }))
      }
    };

    console.log('🟢 User Edit Payload:', payload);

    this.spinner.show();

    this.service.GlobalUserAuth(payload).subscribe(
      (res: any) => {
        this.spinner.hide();
        console.log('🟢 User Edit Response:', res);

        if (res?.STATUS === 'TRUE') {
          Swal.fire('Success', res.MESSAGE || 'User updated successfully', 'success');

          // 🔥 Always refresh from backend
          this.fetchUsers();

          this.closeModal();
        } else {
          Swal.fire('Failed', res?.MESSAGE || 'User update failed', 'error');
        }
      },
      error => {
        this.spinner.hide();
        console.error('🔴 User Edit Error:', error);
        Swal.fire('Error', 'API Error while updating user', 'error');
      }
    );
  }


  deleteUser(index: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users.splice(index, 1);
    }
  }
}
