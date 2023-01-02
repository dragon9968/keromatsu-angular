import { Component, ElementRef, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { interval, Subject, Subscription, throwError } from 'rxjs';
import { EditProjectDialogComponent } from 'src/app/project/edit-project-dialog/edit-project-dialog.component';
import { ProjectService } from 'src/app/project/services/project.service';
import { retrievedSearchText } from 'src/app/store/map-option/map-option.actions';
import { selectIsMapOpen } from 'src/app/store/map/map.selectors';
import { PermissionLevels } from '../../enums/permission-levels.enum';
import { RouteSegments } from '../../enums/route-segments.enum';
import { AuthService } from '../../services/auth/auth.service';
import { selectIsOpen, selectProjectName } from 'src/app/store/project/project.selectors';
import {
  retrievedIsOpen,
  retrievedProjectName,
  retrievedProjects,
  retrievedVMStatus
} from 'src/app/store/project/project.actions';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { ExportProjectDialogComponent } from 'src/app/project/export-project-dialog/export-project-dialog.component';
import { ImportProjectDialogComponent } from 'src/app/project/import-project-dialog/import-project-dialog.component';
import { HelpersService } from "../../services/helpers/helpers.service";
import { catchError, takeUntil } from "rxjs/operators";
import { AppPreferencesComponent } from 'src/app/settings/app-preferences/app-preferences.component';
import { AppPrefService } from '../../services/app-pref/app-pref.service';
import { MapPrefService } from '../../services/map-pref/map-pref.service';
import { retrievedMapPrefs } from 'src/app/store/map-pref/map-pref.actions';
import { UserService } from '../../services/user/user.service';
import { selectIsConnect } from 'src/app/store/server-connect/server-connect.selectors';
import { ServerConnectService } from '../../services/server-connect/server-connect.service';
import { ServerConnectDialogComponent } from 'src/app/map/tool-panel/tool-panel-remote/server-connect-dialog/server-connect-dialog.component';
import { retrievedIsConnect, retrievedServerConnect } from 'src/app/store/server-connect/server-connect.actions';
import { AboutComponent } from 'src/app/help/about/about.component';
import { retrievedUser } from 'src/app/store/user/user.actions';
import { ValidateProjectDialogComponent } from 'src/app/project/validate-project-dialog/validate-project-dialog.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit, OnDestroy {
  @ViewChild('searchbar') searchbar!: ElementRef;
  permissionLevels = PermissionLevels;
  routeSegments = RouteSegments;
  selectIsOpen$ = new Subscription();
  selectProjectName$ = new Subscription();
  searchText = '';
  isMapOpen = false;
  isOpen!: boolean;
  status = 'active';
  selectIsMapOpen$ = new Subscription();
  destroy$: Subject<boolean> = new Subject<boolean>();
  selectIsConnect$ = new Subscription();
  isConnect = false;
  connection = { name: '', id: 0 }
  collectionId: any;
  projectName: any;
  username: any;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private mapPrefService: MapPrefService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    private store: Store,
    private helpersService: HelpersService,
    private appPrefService: AppPrefService,
    iconRegistry: MatIconRegistry,
    private userService: UserService,
    private serverConnectionService: ServerConnectService,
    private serverConnectService: ServerConnectService,
  ) {
    this.selectIsMapOpen$ = this.store.select(selectIsMapOpen).subscribe((isMapOpen: boolean) => {
      this.isMapOpen = isMapOpen;
      if (isMapOpen) {
        this.searchByInterval();
      }
    });
    this.selectIsOpen$ = this.store.select(selectIsOpen).subscribe(isOpen => {
      this.isOpen = isOpen;
      if (isOpen) {
        this.collectionId = this.projectService.getCollectionId();
        this.projectService.get(this.collectionId).subscribe(projectData => {
          this.store.dispatch(retrievedProjectName({ projectName: projectData.result.name }));
        });
      }
    });
    this.selectProjectName$ = this.store.select(selectProjectName).subscribe(
      projectName => this.projectName = projectName
    )
    this.selectIsConnect$ = this.store.select(selectIsConnect).subscribe(isConnect => {
      this.isConnect = isConnect;
      const connection = this.serverConnectionService.getConnection();
      this.connection = connection ? connection : { name: '', id: 0 };
    })
    iconRegistry.addSvgIcon('plant-tree-icon', this.helpersService.setIconPath('/assets/icons/plant-tree-icon.svg'));
    iconRegistry.addSvgIcon('icons8-trash-can', this.helpersService.setIconPath('/assets/icons/icons8-trash-can.svg'));
  }

  ngOnInit(): void {
    const accessToken = this.authService.getAccessToken();
    const accessTokenPayload = this.helpersService.decodeToken(accessToken);
    const userId = accessTokenPayload.identity;
    this.userService.get(userId).subscribe(respData => {
      this.username = respData.result.username;
      this.store.dispatch(retrievedUser({ data: respData.result }));
    });
    this.collectionId = this.projectService.getCollectionId();
    const connection = this.serverConnectionService.getConnection();
    if (connection && connection.id !== 0) {
      this.store.dispatch(retrievedIsConnect({ data: true }));
    }
    if (this.collectionId) {
      this.store.dispatch(retrievedIsOpen({ data: true }));
    }
    this.serverConnectService.getAll().subscribe((data: any) => this.store.dispatch(retrievedServerConnect({ data: data.result })));
  }

  ngOnDestroy(): void {
    this.selectIsMapOpen$.unsubscribe();
    this.selectIsOpen$.unsubscribe();
    this.selectIsConnect$.unsubscribe();
    this.selectProjectName$.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.projectService.closeProject();
    this.store.dispatch(retrievedIsOpen({ data: false }));
    this.router.navigate([RouteSegments.ROOT, RouteSegments.LOGIN]);
  }

  userProfile() {
    this.router.navigate([RouteSegments.ROOT, RouteSegments.USER_PROFILE]);
  }

  close() {
    this.searchText = '';
    this.store.dispatch(retrievedSearchText({ data: this.searchText }));
  }

  search() {
    this.store.dispatch(retrievedSearchText({ data: this.searchText }));
  }

  closeProject() {
    this.projectService.closeProject();
    this.store.dispatch(retrievedProjectName({ projectName: undefined }));
    this.store.dispatch(retrievedIsOpen({ data: false }));
    this.router.navigate([RouteSegments.ROOT]);
  }

  getCollectionId() {
    this.collectionId = this.projectService.getCollectionId();
  }

  editProject() {
    this.projectService.getProjectByStatus('active').subscribe(data => {
      this.store.dispatch(retrievedProjects({data: data.result}));
      this.projectService.get(this.collectionId).subscribe(resp => {
        const dialogData = {
          mode: 'update',
          genData: resp.result
        }
        const dialogRef = this.dialog.open(EditProjectDialogComponent, {
          autoFocus: false,
          width: '800px',
          data: dialogData
        });
      });
    });
  }

  deleteProject() {
    const dialogData = {
      title: 'User confirmation needed',
      message: 'Project will be moved to trash. Are you sure?',
      submitButtonName: 'Delete'
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { width: '400px', data: dialogData });
    dialogRef.afterClosed().subscribe(result => {
      const jsonData = {
        pk: this.collectionId,
        status: 'delete'
      }
      if (result) {
        this.projectService.deleteOrRecoverProject(jsonData).subscribe({
          next: (rest) => {
            this.toastr.success(`Delete Project successfully`);
            this.projectService.closeProject();
            this.store.dispatch(retrievedIsOpen({ data: false }));
            this.projectService.getProjectByStatus(this.status).subscribe(
              (data: any) => this.store.dispatch(retrievedProjects({ data: data.result }))
            );
            this.router.navigate([RouteSegments.PROJECTS]);
          },
          error: (error) => {
            this.toastr.error(`Error while delete Project`);
          }
        })
      }
    });
  }

  exportProject() {
    const dialogData = {
      pk: this.collectionId
    }
    const dialogRef = this.dialog.open(ExportProjectDialogComponent, {
      autoFocus: false,
      width: '450px',
      data: dialogData
    });
  }

  importProject() {
    const dialogRef = this.dialog.open(ImportProjectDialogComponent, {
      autoFocus: false,
      width: '450px',
    });
  }

  cloneProject() {
    const dialogData = {
      title: 'User confirmation needed',
      message: 'Clone this project?',
      submitButtonName: 'OK'
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { width: '400px', data: dialogData });
    dialogRef.afterClosed().subscribe(result => {
      const jsonData = {
        pk: this.collectionId,
      }
      if (result) {
        this.projectService.cloneProject(jsonData).subscribe({
          next: (rest) => {
            this.toastr.success(`Clone Project successfully`);
            this.projectService.getProjectByStatus('active').subscribe((data: any) => this.store.dispatch(retrievedProjects({ data: data.result })));
            this.router.navigate([RouteSegments.PROJECTS]);
          },
          error: (error) => {
            this.toastr.error(`Error while Clone Project`);
          }
        })
      }
    });
  }

  searchByInterval() {
    interval(3000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isMapOpen) {
        this.search();
      } else {
        this.close();
        this.destroy$.next(true);
      }
    })
  }

  openAppPref() {
    this.appPrefService.get('2').subscribe(data => {
      const dialogData = {
        mode: 'update',
        genData: data.result
      }
      this.mapPrefService.getAll().subscribe((data: any) => this.store.dispatch(retrievedMapPrefs({ data: data.result })));
      const dialogRef = this.dialog.open(AppPreferencesComponent, {
        autoFocus: false,
        width: '600px',
        data: dialogData
      });
    })
  }

  openConnectServerForm() {
    const dialogData = {
      genData: this.connection
    }
    this.dialog.open(ServerConnectDialogComponent, { width: '600px', autoFocus: false, data: dialogData });
  }

  disconnectServer() {
    const jsonData = {
      pk: this.connection.id,
    }
    this.serverConnectionService.disconnect(jsonData)
      .subscribe({
        next: response => {
          this.store.dispatch(retrievedIsConnect({ data: false }));
          this.store.dispatch(retrievedVMStatus({ vmStatus: undefined }));
          this.toastr.info(`Disconnected from ${this.connection.name} server!`);
        },
        error: err => {
          this.toastr.error('Could not to disconnect from Server', 'Error');
          return throwError(() => err.error.message);
        }
      })
  }

  openAboutModal() {
    this.dialog.open(AboutComponent, { width: '600px', autoFocus: false });
  }

  openProject(collectionId: string) {
    this.projectService.openProject(collectionId);
  }

  validateProject() {
    const dialogData = {
      pk: this.collectionId
    }
    this.projectService.validateProject(dialogData).pipe(
      catchError((e: any) => {
        this.toastr.error(e.error.message);
        this.dialog.open(ValidateProjectDialogComponent, {
          autoFocus: false,
          width: 'auto',
          data: e.error.result
        });
        return throwError(() => e);
      })
    ).subscribe(response => {
      this.toastr.success(response.message);
    });
  }
}