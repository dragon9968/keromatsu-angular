import { Component, Input, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { catchError, Subscription, throwError } from 'rxjs';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { MapService } from 'src/app/core/services/map/map.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { selectMapContextMenu } from 'src/app/store/map-context-menu/map-context-menu.selectors';
import { retrievedMapEdit } from 'src/app/store/map-edit/map-edit.actions';
import { selectMapOption } from 'src/app/store/map-option/map-option.selectors';
import { selectMapPref } from 'src/app/store/map-style/map-style.selectors';
import { CommonService } from 'src/app/map/context-menu/cm-common-service/common.service';
import { retrievedMapContextMenu } from 'src/app/store/map-context-menu/map-context-menu.actions';
import { retrievedMap } from 'src/app/store/map/map.actions';
import { retrievedMapSelection } from 'src/app/store/map-selection/map-selection.actions';

@Component({
  selector: 'app-tool-panel',
  templateUrl: './tool-panel.component.html',
  styleUrls: ['./tool-panel.component.scss']
})
export class ToolPanelComponent implements OnDestroy {
  @Input() cy: any;
  @Input() ur: any;
  @Input() config: any;
  @Input() collectionId: any;
  @Input() mapCategory: any;
  @Input() isDisableCancel = true;
  @Input() isDisableAddNode = true;
  @Input() isDisableAddPG = false;
  @Input() isDisableAddImage = false;
  @Input() activeNodes: any[] = [];
  @Input() activePGs: any[] = [];
  @Input() activeEdges: any[] = [];
  @Input() activeGBs: any[] = [];
  @Input() activeMBs: any[] = [];
  @Input() deletedNodes: any[] = [];
  @Input() deletedInterfaces: any[] = [];
  updatedNodes: any[] = [];
  updatedInterfaces: any[] = [];
  updatedGroupBoxes: any[] = [];
  updatedMapBackgrounds: any[] = [];
  selectMapOption$ = new Subscription();
  selectMapPref$ = new Subscription();
  selectDefaultPreferences$ = new Subscription();
  selectMapContextMenu$ = new Subscription();
  isEdgeDirectionChecked!: boolean;
  isGroupBoxesChecked!: boolean;
  isMapGridChecked!: boolean;
  isSnapToGridChecked!: boolean;
  isMapOverviewChecked!: boolean;
  gridSpacingSize!: string;
  groupCategoryId!: string;
  selectedMapPrefId!: string;
  defaultPreferences: any;

  constructor(
    private store: Store,
    private toastr: ToastrService,
    private mapService: MapService,
    private dialog: MatDialog,
    private helpersService: HelpersService,
    private commonService: CommonService
  ) {
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe((mapOption: any) => {
      if (mapOption) {
        this.isEdgeDirectionChecked = mapOption.isEdgeDirectionChecked;
        this.isGroupBoxesChecked = mapOption.isGroupBoxesChecked;
        this.isMapGridChecked = mapOption.isMapGridChecked;
        this.isSnapToGridChecked = mapOption.isSnapToGridChecked;
        this.isMapOverviewChecked = mapOption.isMapOverviewChecked;
        this.gridSpacingSize = mapOption.gridSpacingSize;
        this.groupCategoryId = mapOption.groupCategoryId;
      }
    });
    this.selectMapPref$ = this.store.select(selectMapPref).subscribe((selectedMapPref: any) => {
      this.selectedMapPrefId = selectedMapPref?.id;
    });
    this.selectMapContextMenu$ = this.store.select(selectMapContextMenu).subscribe((mapContextMenu: any) => {
      if (mapContextMenu?.event == 'download') {
        this.download();
        this.store.dispatch(retrievedMapContextMenu({ data: { event: undefined } }));
      } else if (mapContextMenu?.event == 'save') {
        this.save();
        this.store.dispatch(retrievedMapContextMenu({ data: { event: undefined } }));
      } else if (mapContextMenu?.event == 'undo') {
        this.undo();
        this.store.dispatch(retrievedMapContextMenu({ data: { event: undefined } }));
      } else if (mapContextMenu?.event == 'redo') {
        this.redo();
        this.store.dispatch(retrievedMapContextMenu({ data: { event: undefined } }));
      }
    });
  }

  ngOnDestroy() {
    this.selectMapOption$.unsubscribe();
    this.selectMapPref$.unsubscribe();
    this.selectMapContextMenu$.unsubscribe();
  }

  download() {
    const dialogData = {
      title: 'Download Map',
      message: 'PNG file format.',
      submitButtonName: 'Download'
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { width: '600px', data: dialogData });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const text = this.cy.png({
          output: "blob",
          bg: "#ffffff",
          full: false,
        });
        const file = new Blob([text], { type: "image/png" });
        this.helpersService.downloadBlob("download_map.png", file);
      }
    });
  }

  save() {
    this.cy.elements().forEach((ele: any) => {
      if (ele.group() == "nodes") {
        this.getUpdatedNodeOrPGOrGB(ele);
      } else {
        this.getUpdatedInterface(ele);
      }
    });

    const updatedMapOptions = {
      accessed: true,
      edge_direction_checkbox: this.isEdgeDirectionChecked,
      groupbox_checkbox: this.isGroupBoxesChecked,
      display_map_overview_checkbox: this.isMapOverviewChecked,
      group_category: this.groupCategoryId,
      default_map_pref_id: this.selectedMapPrefId,
      grid_settings: {
        enabled: this.isMapGridChecked,
        spacing: this.gridSpacingSize,
        snap_to_grid: this.isSnapToGridChecked
      }
    }
    const jsonData = {
      updatedNodes: this.updatedNodes,
      updatedInterfaces: this.updatedInterfaces,
      deletedNodes: this.deletedNodes,
      deletedInterfaces: this.deletedInterfaces,
      updatedGroupBoxes: this.updatedGroupBoxes,
      updatedMapOptions
    }
    this.mapService.saveMap(this.collectionId, this.mapCategory, jsonData).pipe(
      catchError((error: any) => {
        this.toastr.error("Map saved failed");
        return throwError(() => error);
      })
    ).subscribe((_respData: any) => {
      this.deletedNodes.splice(0);
      this.deletedInterfaces.splice(0);
      this.cy.elements().forEach((ele: any) => {
        const data = ele.data();
        if (data.updated) {
          data.updated = false;
        }
      });
      this.toastr.success("Map saved");
    })
    this.updatedNodes.splice(0);
    this.updatedInterfaces.splice(0);
  }

  refresh() {
    let isDirty = false;
    this.cy.elements().forEach((ele: any) => {
      const data = ele.data();
      if (data.updated) {
        isDirty = true;
      }
    });
    if (isDirty) {
      const dialogData = {
        title: 'User confirmation needed',
        message: 'Are you sure you want to refresh? Changes have not been saved.'
      }
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, { width: '400px', data: dialogData });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.mapService.getMapData(this.mapCategory, this.collectionId).subscribe((data: any) => this.store.dispatch(retrievedMap({ data })));
          this.activeNodes.splice(0);
          this.activePGs.splice(0);
          this.activeEdges.splice(0);
          this.activeGBs.splice(0);
          this.store.dispatch(retrievedMapSelection({ data: true }));
        }
      });
    }
  }

  undo() {
    this.commonService?.ur.undo();

  }

  redo() {
    this.commonService?.ur.redo();
  }

  cancel() {
    this.store.dispatch(retrievedMapEdit({
      data: {
        isAddNode: false,
        isAddPublicPG: false,
        isAddPrivatePG: false,
      }
    }));
  }

  getUpdatedNodeOrPGOrGB(ele: any) {
    const data = ele.data();
    if (data.label == "group_box") {
      this.getUpdatedGB(ele);
    } else {
      if (data.label == "map_background") {
        this.getUpdatedMapBackground(ele, ele.position());
      } else {
        this.getUpdatedNodeOrPG(ele, ele.position());
      }
    }
  }

  getUpdatedInterface(ele: any) {
    const data = ele.data()
    const updatedInterface = {
      name: data.name,
      source: data.source,
      subnet: data.subnet,
      target: data.target,
      id: data.updated ? data.interface_id : null,
      label: "edge",
      map_style: {
        direction: data?.direction,
        elem_category: data?.elem_category,
        color: ele.style('line-color'),
        width: ele.style('width'),
        text_size: ele.style("font-size"),
        text_color: ele.style("color"),
        text_bg_color: ele.style("text-background-color"),
        text_bg_opacity: ele.style("text-background-opacity"),
        text_valign: ele.style("text-valign"),
        text_halign: ele.style("text-halign"),
        arrow_scale: data?.arrow_scale
      },
    };
    if (data.updated) {
      this.updatedInterfaces.push(updatedInterface);
      data.updated = false;
    }
  }

  getUpdatedGB(ele: any) {
    const data = ele.data();
    const updatedGroupbox: any = {
      group_id: data.group_id,
      collapsed: false,
      label: 'group_box',
      color: ele.style('background-color'),
      group_opacity: ele.style('background-opacity'),
      border_color: ele.style('border-color'),
      border_style: ele.style('border-style'),
      text_size: ele.style("font-size"),
      text_color: ele.style("color"),
      zIndex: data.zIndex,
      locked: ele.locked()
    };

    if (data.collapsedChildren) {
      updatedGroupbox.collapsed = true;
      const lastPos = data['position-before-collapse'];
      const curPos = ele.position();
      const offset = { x: curPos.x.toFixed(2) - lastPos.x.toFixed(2), y: curPos.y.toFixed(2) - lastPos.y.toFixed(2) };
      const offsetX = offset.x.toFixed(2)
      const offsetY = offset.y.toFixed(2)
      const expandCollapse = this.cy.expandCollapse('get');
      const children = expandCollapse.getCollapsedChildrenRecursively(ele);
      children.forEach((ele: any) => {
        const data = ele.data();
        if (ele.group() == 'nodes') {
          const curPos = ele.position();
          const curPosX = curPos.x.toFixed(2)
          const curPosY = curPos.y.toFixed(2)
          if (data.label == "map_background") {
            this.getUpdatedMapBackground(ele, { x: curPosX + offsetX, y: curPosY + offsetY });
          } else {
            this.getUpdatedNodeOrPG(ele, { x: curPosX + offsetX, y: curPosY + offsetY });
          }
        } else {
          this.getUpdatedInterface(ele);
        }
      }, { 'offset': offset });
    }
    this.updatedGroupBoxes.push(updatedGroupbox);
  }

  getUpdatedNodeOrPG(ele: any, position: any) {
    const data = ele.data();
    const updatedNode = {
      id: data.id,
      position,
      elem_category: data.elem_category,
      map_style: {
        height: ele.style("height"),
        width: ele.style("width"),
        text_size: ele.style("font-size"),
        text_color: ele.style("color"),
        text_bg_color: ele.style("text-background-color"),
        text_bg_opacity: ele.style("text-background-opacity"),
        text_valign: ele.style("text-valign"),
        text_halign: ele.style("text-halign"),
        'text-wrap': ele.style("text-wrap"),
        'background-image': ele.style("background-image"),
        'background-fit': ele.style("background-fit"),
        color: ele.data("elem_category") == "port_group" ? ele.style("background-color") : undefined,
        pg_color: ele.data("elem_category") == "port_group" ? data.pg_color : undefined,
      },
      label: data.label,
      data: {
        ...data,
        locked: ele.locked()
      }
    };
    if (data.updated) {
      this.updatedNodes.push(updatedNode);
    }
  }

  getUpdatedMapBackground(ele: any, position: any) {
    const data = ele.data();
    const updatedMapBackground: any = {
      position,
      map_style: {
        width: ele.style('width'),
        height: ele.style('height'),
        src: ele.data('src'),
        zIndex: ele.data('zIndex'),
        text_size: ele.style("font-size"),
        text_color: ele.style("color"),
        text_bg_color: ele.style("text-background-color"),
        text_bg_opacity: ele.style("text-background-opacity"),
        text_valign: ele.style("text-valign"),
        text_halign: ele.style("text-halign"),
        label: "map_background",
        elem_category: "bg_image",
        locked: ele.locked()
      }
    };
    if (data.in_groupbox) {
      updatedMapBackground.domain = data.domain;
      updatedMapBackground.domain_id = data.domain_id;
      updatedMapBackground.in_groupbox = true;
      updatedMapBackground.elem_category = data.elem_category;
    }
    this.updatedMapBackgrounds.push(updatedMapBackground);
  }
}