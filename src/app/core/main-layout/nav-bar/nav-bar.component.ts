import { Component, ElementRef, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { EditProjectDialogComponent } from 'src/app/project/edit-project-dialog/edit-project-dialog.component';
import { ProjectService } from 'src/app/project/services/project.service';
import { retrievedSearchText } from 'src/app/store/map-option/map-option.actions';
import { selectIsMapOpen, selectMapFeature } from 'src/app/store/map/map.selectors';
import { MapState } from 'src/app/store/map/map.state';
import { PermissionLevels } from '../../enums/permission-levels.enum';
import { RouteSegments } from '../../enums/route-segments.enum';
import { AuthService } from '../../services/auth/auth.service';
import { Injectable, EventEmitter } from '@angular/core';
import { selectIsOpen } from 'src/app/store/project/project.selectors';
import { retrievedIsOpen } from 'src/app/store/project/project.actions';

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
  searchText = '';
  isMapOpen = false;
  isOpen!: boolean;
  selectIsMapOpen$ = new Subscription();

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private router: Router,
    private store: Store,
    private domSanitizer: DomSanitizer,
    iconRegistry: MatIconRegistry,
  ) {
    this.selectIsMapOpen$ = this.store.select(selectIsMapOpen).subscribe((isMapOpen: boolean) => {
      this.isMapOpen = isMapOpen;
    });
    this.selectIsOpen$ = this.store.select(selectIsOpen).subscribe(isOpen => {
      this.isOpen = isOpen
    });
    iconRegistry.addSvgIcon('plant-tree-icon', this._setPath('/assets/icons/plant-tree-icon.svg'));
  }

  ngOnInit(): void { 
    if (this.projectService.getCollectionId()) {
      this.store.dispatch(retrievedIsOpen({data: true}));
    }
  }

  private _setPath(url: string): SafeResourceUrl {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnDestroy(): void {
    this.selectIsMapOpen$.unsubscribe();
  }

  logout() {
    this.authService.logout();
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
    this.store.dispatch(retrievedIsOpen({data: false}));
    this.router.navigate([RouteSegments.ROOT]);
  }

  editProject() {
    const collectionId = this.projectService.getCollectionId()
    this.projectService.get(collectionId).subscribe(data => {
      const dialogData = {
        mode: 'update',
        genData: data.result
      }
      const dialogRef = this.dialog.open(EditProjectDialogComponent, {
        autoFocus: false,
        width: '450px',
        data: dialogData
      });
    })
  }
}
