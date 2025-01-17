import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiPaths } from 'src/app/core/enums/api-paths.enum';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor(private http: HttpClient) { }

  getMapData(mapCategory: string, projectId: string): Observable<any> {
    const params = new HttpParams().set('project_id', projectId).set('category', mapCategory);
    return this.http.get<any>(ApiPaths.GET_MAP_DATA, { params });
  }

  saveMap(projectId: string, mapCategory: string, data: any): Observable<any> {
    const params = new HttpParams()
      .set('project_id', projectId)
      .set('map_category', mapCategory);
    return this.http.post<any>(ApiPaths.SAVE_MAP, data, { params });
  }

  getMapStatus(projectId: number, connectionId: number): Observable<any> {
    const params = new HttpParams()
      .set('project_id', projectId)
      .set('connection_id', connectionId);
    return this.http.get<any>(ApiPaths.MAP_STATUS, { params });
  }

  uploadMapOverviewImage(data: any): Observable<any> {
    return this.http.post<any>(ApiPaths.SAVE_MAP_OVERVIEW, data);
  }

  addTemplateIntoMap(data: any): Observable<any> {
    return this.http.post<any>(ApiPaths.PROJECT_TEMPLATE_ADD, data);
  }

}
