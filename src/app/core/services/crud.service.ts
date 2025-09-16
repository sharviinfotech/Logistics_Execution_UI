import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class CrudService {
    constructor(private http: HttpClient) { }

    /***
     * Get 
     */
    fetchData(url: any): Observable<any[]> {
        console.log(url);
        return this.http.get<any[]>(url);
    }

    addData(url: any, newData: any): Observable<any[]> {
        return this.http.post<any[]>(url, newData);
    }

    updateData(url: any, updatedData: any): Observable<any[]> {
        return this.http.put<any[]>(url, updatedData);
    }

    deleteData(url: any): Observable<void> {
        return this.http.delete<void>(url);
    }
    // getSalesReport(data: any): Observable<any> {
    //     return this.http.post<any>('http://localhost:3000/api/sales-report', data);
    //   }
    getSalesReport(page: number, pageSize: number, requestData: any) {
        const params = new HttpParams()
          .set('page', page)
          .set('pageSize', pageSize);
      
        return this.http.post('http://localhost:3000/api/sales-report', requestData, { params });
      }
      
}
