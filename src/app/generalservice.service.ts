import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  setLoginResponse(data) {
    this.loginResponse = data;
  }

  getLoginResponse() {
    return this.loginResponse;
  }
  getAllInvoice(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/getAllInvoices', obj);
  }
  CreateInvoice(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/createNewInvoice', obj);
  }

  UpdateInvoice(obj, invoiceRefNo) {
    return this.http.put(environment.baseUrl + 'api/updateInvoiceByReferenceNo/' + invoiceRefNo, obj);
  }
  getstateList() {
    return this.http.get(environment.baseUrl + 'api/invoice/stateList');
  }

  invoiceTemplate(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/invoiceTemplate', obj);

  }
  userNewCreation(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/userNewCreation', obj);

  }
  getAllUserList() {
    return this.http.get(environment.baseUrl + 'api/invoice/getAllUserList');
  }

  submitLogin(obj) {
    return this.http.post('http://14.99.143.250:3001/api/invoice/authenticationLogin', obj);
  }
  updateExitUser(obj, userUniqueId) {
    return this.http.put(environment.baseUrl + 'api/invoice/updateExitUser/' + userUniqueId, obj);
  }
  invoiceApprovedOrRejected(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/invoiceApprovedOrRejected', obj);
  }
  forgotPassword(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/forgotPassword', obj);
  }
  getAllCustomerList() {
    return this.http.get(environment.baseUrl + 'api/invoice/getAllCustomerList');
  }
  savecustomerCreation(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/SaveCustomerCreation', obj);

  }
  updateExitCustomer(obj, customerUniqueId) {
    return this.http.put(environment.baseUrl + 'api/invoice/updateExitCustomer/' + customerUniqueId, obj);

  }
  reviewedUpadte(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/reviewedUpadte', obj);

  }
  SaveCharges(data) {
    return this.http.post(environment.baseUrl + 'api/invoice/SaveCharges', data)

  }
  getAllCharges() {
    return this.http.get(environment.baseUrl + 'api/invoice/getAllCharges');


  }
  resetpassword(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/resetPassword', obj);

  }
  UpdateCharges(data) {
    return this.http.post(environment.baseUrl + 'api/invoice/UpdateCharges', data)

  }
  verifyedAndUpdated(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/verifyedAndUpdated', obj);

  }
  deteleGlobal(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/deteleGlobal', obj);

  }
  sectorwiseSave(obj) {
    return this.http.post(environment.baseUrl + 'api/invoice/sectorWiseSave', obj);

  }


  coois(obj) {
    return this.http.post(environment.baseUrl + 'api/external/orderconfirmation/coois', obj);

  }
  OrderinfoOutward(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderInfo/Outward/fetchInvoiceList', obj);
  }
  OrderInfoOutwardSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderInfo/Outward/withsap/Save', obj);
  }
  OrderInfoNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/withoutsap/Save', obj);
  }
  getpdb() {
    return this.http.get(environment.baseUrl + 'api/external/LE/orderInfo/f4_getAllDetails',);
  }
  fetchzone(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/withoutsap/fetchzone', obj);
  }
  custgroup(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/withoutsap/custgroup', obj);
  }
  OrderInfoPhysicaldispatch(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/Physicaldispatch', obj);
  }
  OrderInfoDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderInfo/Outward/DeleteWithSap', obj);
  }
  OrderInfoDeleteWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/DeleteWithoutSap', obj);
  }
  shipmentdetailsfetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/fetchInvoiceList', obj);
  }
  ShipmentOutwardSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/Save', obj);
  }
  getTypeofmaterial() {
    return this.http.get<any>(environment.baseUrl + 'api/external/LE/ShipmentDetails/Nonsap/f4_Typeofmaterial');
  }
  PlantBasedDivison(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderInfo/Outward/withoutsap/PlantBasedDivison', obj);
  }
  Incoterms(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/ShipmentDetails/Nonsap/f4_Incoterms', obj);
  }
  shipmentdetailsNonSapSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Nonsap/Save', obj);
  }
  shipmentdetailsNonSapReports(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Nonsap/Reports', obj);
  }
  Shipmentchangewithsap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/ChangeWithSap', obj);
  }
  Shipmentchangewithoutsap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/ChangeWithoutSap', obj);
  }
  ShipmentDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/ShipmentDeleteWithSap', obj);
  }
  ShipmentDeleteWithoutSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/ShipmentDetails/Outward/ShipmentDeleteWithoutSap', obj);
  }
  SegmentInfoOutwardFetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/fetchInvoiceList', obj);
  }
  SegmentInfoOutwardSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/withsap/Save', obj);
  }
  SegmentInfoNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/withoutsap/Save', obj);
  }
  SegmentInfoChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/ChangeWithSap', obj);
  }
  SegmentInfoChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/ChangeWithoutSap', obj);
  }
  SegmentInfoDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/DeleteWithSap', obj);
  }
  SegmentInfoDeleteWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/DeleteWithoutSap', obj);
  }
  getssc() {
    return this.http.get(environment.baseUrl + 'api/external/LE/segmentInfo/f4_getAllDetails',);
  }
  fetchTAT(obj: any) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/withSap/TAT_Type', obj);
  }
  fetchNonSapTAT(obj: any) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/NonSap/TAT_Type', obj);
  }
  fetchzoneTat(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/segmentInfo/Outward/withoutsap/fetchzone', obj);
  }

  TransitInfoSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitInfo/Outward/WithSap/Save', obj);
  }
  TransitInfoNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitInfo/NonSap/Save', obj);
  }
  TransitInfoDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitInfo/Outward/WithSap/Delete', obj);
  }
  TransitInfoDeleteWithOutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitInfo/Outward/WithoutSap/Delete', obj);
  }
  TransitInfoChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitInfo/Outward/WithSap/Change', obj);
  }
  TransitInfoChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitInfo/Outward/WithoutSap/Change', obj);
  }


  FreightBillingSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/WithSap/Save', obj);
  }
  FreightBillingNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/NonSap/Create', obj);
  }
  FreightBillingChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/ChangeWithSap', obj);
  }
  FreightBillingChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/ChangeWithoutSap', obj);
  }
  FreightBillingDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/WithSap/Delete', obj);
  }
  FreightBillingDeleteWithOutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/FreightBilling/Outward/NonSap/Delete', obj);
  }
  VehicleInfofetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/fetchInvoiceList', obj);
  }
  VehicleInfosave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/Save', obj);
  }
  VehicleInfoNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Vehicleinfo/NonSap/Save', obj);
  }
  VehicleInfoMapid(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/WithSapMapid', obj);
  }
  VehicleInfoMapidForNonsap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/WithoutSapMapid', obj);
  }
  VehicleInfoChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/ChangeWithSap', obj);
  }
  VehicleInfoChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/ChangeWithoutSap', obj);
  }
  VehicleInfoDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/DeleteWithSap', obj);
  }
  VehicleInfoDeleteWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Vehicleinfo/Outward/DeleteWithoutSap', obj);
  }
  DCReferenceNo(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Vehicleinfo/NonSap/DCNO', obj);
  }
  Invoiceloaddetailsfetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/Outward/fetchInvoiceList', obj);
  }
  sapget(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/Outward/sapget', obj);
  }
  InvoiceloaddetailsSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/Outward/save', obj);
  }
  InvoiceloaddetailsNonSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/NonSap/Save', obj);
  }
  gettypeofvehicle() {
    return this.http.get(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/f4_getAllDetails');
  }

  InvoiceloaddetailsDeleteWithsap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/Outward/DeleteWithsap', obj);
  }
  InvoiceloaddetailsDeleteWithoutsap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/InvoiceloadDetails/Outward/DeleteWithoutsap', obj);
  }
  InsuranceClaimTrackingfetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/Outward/fetchinvoicelist', obj);
  }
  InsuranceClaimTrackingSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/Outward/save', obj);
  }
  fetchinvoicelistnonsap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/NonSap/fetchinvoicelistnonsap', obj);
  }

  Nonsapsave(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/NonSap/Nonsapsave', obj);
  }
  InsuranceClaimTrackingDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/Outward/DeleteWithSap', obj);
  }
  InsuranceClaimTrackingDeleteWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/NonSap/DeleteWithoutSap', obj);
  }
  InsuranceClaimTrackingChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/Outward/ChangeWithSap', obj);
  }
  InsuranceClaimTrackingChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/InsuranceClaimTracking/Outward/ChangeWithoutSap', obj);
  }

  TransitDamageInfofetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitDamageInfo/Outward/fetchinvoicelist', obj);
  }
  TransitDamageInfoSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitDamageInfo/Outward/Save', obj);
  }
  fetchinvoicelistnonsapwosp(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitDamageInfo/NonSap/fetchinvoicelistnonsap', obj);
  }
  withoutsapSave(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitDamageInfo/NonSap/withoutsapSave', obj);
  }
  TransitDamageInfoDeleteWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitDamageInfo/Outward/DeleteWithSap', obj);
  }
  TransitDamageInfoDeleteWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitDamageInfo/NonSap/DeleteWithoutSap', obj);
  }
  TransitDamageInfoChangeWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/TransitDamageInfo/Outward/ChangeWithSap', obj);
  }
  TransitDamageInfoChangeWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/TransitDamageInfo/Outward/Change/WithoutSap', obj);
  }


  DispatchSave(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Dispatch/Outward/withsap/Save', obj);
  }
  DispatchNonSapSave(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Dispatch/Outward/withoutsap/Save', obj);
  }
  fetchVendorCode() {
    return this.http.get(environment.baseUrl + 'api/external/LE/Dispatch/Outward/F4Vendorcode/fetch');
  }

  fetchReferencenumber(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Dispatch/Outward/ReferenceNumber/fetch', obj);
  }

  fetchReferencenumberWithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Dispatch/Outward/ReferenceNumber/WithoutSap/fetch', obj);
  }


  fetchReferencenumberEdit(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Dispatch/Outward/ReferenceNumber/edit', obj);
  }

  GlobalReferenceNoFetch(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderinfo/GlobalReferenceNoFetch', obj);
  }

  GlobalReferenceNoFetchwithoutsap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderinfo/GlobalReferenceNoFetchwithoutsap', obj);
  }
  global_Fields_SearchOption(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderinfo/global_Fields_SearchOption', obj);
  }
  global_Fields_SearchOption_WithoutSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/orderinfo/global_Fields_SearchOption_WithoutSap', obj);
  }
  fetchDispatchFiltered(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderinfo/Filter_Creation', obj);
  }

  fetchDispatchFilteredNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Dispatch/Outward/Filter_Creation_NonSap', obj);
  }


  fetchOrderInfoFiltered(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/orderinfo/Outward/Filter_Creation', obj);
  }

  fetchGlobalFilteredNonSap(obj) {
    return this.http.put(environment.baseUrl + 'api/external/LE/Global/Outward/Filter_Creation_NonSap', obj);
  }

  OutwardCountGlobalWithSap(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/Outward/GlobalScreen/CountWithSap', obj);
  }

  GlobalUserAuth(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/GlobalUserAuth', obj);
  }
  UserCreationDisplayTable() {
    return this.http.get(environment.baseUrl + 'api/external/LE/UserCreation/DisplayTable');
  }

  UserCreationDelete(obj) {
    return this.http.post(environment.baseUrl + 'api/external/LE/UserCreationDelete', obj);
  }









}
