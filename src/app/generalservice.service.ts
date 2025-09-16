import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class GeneralserviceService {
  searchTerm: string = '';
  allInvoices: any[] = []; // Store all invoices
  page: number = 1;
  pageSize: number = 10; // Adjust as needed
  data: any;
 
  resetPasswordData(): any {
    throw new Error('Method not implemented.');
  }
 
  setLoginDataList: any;
  userList: any;
  loginResponse: any;
  setTableData: any;
  

  
  constructor(private http: HttpClient) { }

  setLoginResponse(data){
    this.loginResponse = data;
}

getLoginResponse(){
   return this.loginResponse;
}
  getAllInvoice(obj){
    return this.http.post(environment.baseUrl+'api/invoice/getAllInvoices',obj);
  }
  CreateInvoice(obj){
    return this.http.post(environment.baseUrl+'api/invoice/createNewInvoice',obj);
  }
  
  UpdateInvoice(obj,invoiceRefNo){
    return this.http.put(environment.baseUrl+'api/updateInvoiceByReferenceNo/'+invoiceRefNo,obj);
  }
  getstateList(){
    return this.http.get(environment.baseUrl+'api/invoice/stateList');
  }

  invoiceTemplate(obj){
    return this.http.post(environment.baseUrl+'api/invoice/invoiceTemplate',obj);

  }
  userNewCreation(obj){
    return this.http.post(environment.baseUrl+'api/invoice/userNewCreation',obj);

  }
  getAllUserList(){
    return this.http.get(environment.baseUrl+'api/invoice/getAllUserList');
  }

  submitLogin(obj){
    return this.http.post('http://14.99.143.250:3001/api/invoice/authenticationLogin',obj);
  }
  updateExitUser(obj,userUniqueId){
    return this.http.put(environment.baseUrl+'api/invoice/updateExitUser/'+userUniqueId,obj);
  }
  invoiceApprovedOrRejected(obj){
    return this.http.post(environment.baseUrl+'api/invoice/invoiceApprovedOrRejected',obj);
  }
  forgotPassword(obj){
    return this.http.post(environment.baseUrl+'api/invoice/forgotPassword',obj);
  }
  getAllCustomerList(){
    return this.http.get(environment.baseUrl+'api/invoice/getAllCustomerList');
  }
  savecustomerCreation(obj){
    return this.http.post(environment.baseUrl+'api/invoice/SaveCustomerCreation',obj);
 
  }
  updateExitCustomer(obj,customerUniqueId){
    return this.http.put(environment.baseUrl+'api/invoice/updateExitCustomer/'+customerUniqueId,obj);
 
  }
  reviewedUpadte(obj){
    return this.http.post(environment.baseUrl+'api/invoice/reviewedUpadte',obj);
 
  }
  SaveCharges(data){
    return this.http.post(environment.baseUrl+'api/invoice/SaveCharges',data)

  }
  getAllCharges(){
    return this.http.get(environment.baseUrl+'api/invoice/getAllCharges');


  }
  resetpassword(obj){
    return this.http.post(environment.baseUrl+'api/invoice/resetPassword',obj);
 
  }
  UpdateCharges(data){
    return this.http.post(environment.baseUrl+'api/invoice/UpdateCharges',data)

  }
  verifyedAndUpdated(obj){
    return this.http.post(environment.baseUrl+'api/invoice/verifyedAndUpdated',obj);
 
  }
  deteleGlobal(obj){
    return this.http.post(environment.baseUrl+'api/invoice/deteleGlobal',obj);
 
  }
 sectorwiseSave(obj){
    return this.http.post(environment.baseUrl+'api/invoice/sectorWiseSave',obj);
 
  }


  coois(obj){
    return this.http.post(environment.baseUrl+'api/external/orderconfirmation/coois',obj);
 
  }
}
