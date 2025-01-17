import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiPaths } from 'src/app/core/enums/api-paths.enum';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get<any>(ApiPaths.USER);
  }

  get(id: string): Observable<any> {
    return this.http.get<any>(ApiPaths.USER + id);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(ApiPaths.USER_PROFILE);
  }

  add(data: any): Observable<any> {
    return this.http.post<any>(ApiPaths.USER, data);
  }

  put(id: string, data: any): Observable<any> {
    return this.http.put<any>(ApiPaths.USER + id, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(ApiPaths.USER + id);
  }

  associate(data: any) {
    return this.http.post<any>(ApiPaths.ASSOCIATE_ROLE, data);
  }

  getCreatorProject(projectId: any): Observable<any> {
    return this.http.get<any>(ApiPaths.USER_CREATED_PROJECT + projectId);
  }
}
