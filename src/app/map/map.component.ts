import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, Subject, Subscription, throwError } from 'rxjs';
import {
  retrievedIsMapOpen,
  loadMap,
  loadLinkedMap,
  addTemplateIntoProject,
  unSelectAllElementsOnMap,
  mapDestroySuccess
} from '../store/map/map.actions';
import { environment } from 'src/environments/environment';
import * as cytoscape from 'cytoscape';
import { HelpersService } from '../core/services/helpers/helpers.service';
import { selectIsMapLoadedSuccess, selectMapFeature } from '../store/map/map.selectors';
import { retrievedIcons } from '../store/icon/icon.actions';
import { retrievedDevices } from '../store/device/device.actions';
import { retrievedTemplates } from '../store/template/template.actions';
import { retrievedHardwares } from '../store/hardware/hardware.actions';
import { loadDomains } from '../store/domain/domain.actions';
import { retrievedConfigTemplates } from '../store/config-template/config-template.actions';
import { retrievedLoginProfiles } from '../store/login-profile/login-profile.actions';
import { DeviceService } from '../core/services/device/device.service';
import { ConfigTemplateService } from '../core/services/config-template/config-template.service';
import { MatDialog } from '@angular/material/dialog';
import { AddUpdateNodeDialogComponent } from './add-update-node-dialog/add-update-node-dialog.component';
import { selectMapEdit } from '../store/map-edit/map-edit.selectors';
import { selectMapPref } from '../store/map-style/map-style.selectors';
import { ToastrService } from 'ngx-toastr';
import { AddUpdatePGDialogComponent } from './add-update-pg-dialog/add-update-pg-dialog.component';
import { AddUpdateInterfaceDialogComponent } from './add-update-interface-dialog/add-update-interface-dialog.component';
import { addNewPG, selectPG, unSelectPG, updatePG } from '../store/portgroup/portgroup.actions';
import { selectMapPortGroups } from '../store/portgroup/portgroup.selectors';
import { CMActionsService } from './context-menu/cm-actions/cm-actions.service';
import { TemplateService } from '../core/services/template/template.service';
import { NodeService } from '../core/services/node/node.service';
import { PortGroupService } from '../core/services/portgroup/portgroup.service';
import { InterfaceService } from '../core/services/interface/interface.service';
import { selectIcons } from '../store/icon/icon.selectors';
import { CMAddService } from './context-menu/cm-add/cm-add.service';
import { CMViewDetailsService } from './context-menu/cm-view-details/cm-view-details.service';
import { CMDeleteService } from './context-menu/cm-delete/cm-delete.service';
import { CMEditService } from './context-menu/cm-edit/cm-edit.service';
import { CMGroupBoxService } from './context-menu/cm-groupbox/cm-groupbox.service';
import { CMLockUnlockService } from './context-menu/cm-lock-unlock/cm-lock-unlock.service';
import { CMRemoteService } from './context-menu/cm-remote/cm-remote.service';
import { CMMapService } from './context-menu/cm-map/cm-map.service';
import { ImageService } from '../core/services/image/image.service';
import { HardwareService } from '../core/services/hardware/hardware.service';
import { DomainService } from '../core/services/domain/domain.service';
import { LoginProfileService } from '../core/services/login-profile/login-profile.service';
import { SearchService } from '../core/services/search/search.service';
import { MapService } from '../core/services/map/map.service';
import { selectMapOption, selectSearchText } from '../store/map-option/map-option.selectors';
import { CommonService } from 'src/app/map/context-menu/cm-common-service/common.service';
import { ToolPanelStyleService } from 'src/app/core/services/tool-panel-style/tool-panel-style.service';
import { ProjectService } from "../project/services/project.service";
import {
  loadProjectsNotLinkYet,
  retrievedVMStatus
} from "../store/project/project.actions";
import { ICON_PATH } from '../shared/contants/icon-path.constant';
import { InfoPanelService } from '../core/services/info-panel/info-panel.service';
import {
  addInterfaceMapLinkToPG,
  retrievedInterfacePkConnectNode,
  retrievedInterfacesByDestinationNode,
  retrievedIsInterfaceConnectPG,
  selectInterface,
  selectPhysicalInterface,
  unSelectInterface,
  unSelectPhysicalInterface
} from "../store/interface/interface.actions";
import {
  selectIsConfiguratorConnect,
  selectIsHypervisorConnect
} from "../store/server-connect/server-connect.selectors";
import { MapImageService } from '../core/services/map-image/map-image.service';
import {
  addNewMapImage,
  retrievedImages,
  selectMapImage,
  unSelectMapImage
} from '../store/map-image/map-image.actions';
import { RouteSegments } from "../core/enums/route-segments.enum";
import { ContextMenuService } from './context-menu/context-menu.service';
import { retrievedMapEdit } from "../store/map-edit/map-edit.actions";
import {
  selectIsInterfaceConnectPG,
  selectInterfacePkConnectNode,
  selectLogicalMapInterfaces,
  selectPhysicalInterfaces,
  selectInterfacesCommonMapLinks
} from "../store/interface/interface.selectors";
import { CMInterfaceService } from "./context-menu/cm-interface/cm-interface.service";
import { GroupService } from "../core/services/group/group.service";
import { addNewNode, selectNode, unSelectNode, updateNode } from "../store/node/node.actions";
import { loadGroups, selectGroup, unSelectGroup } from "../store/group/group.actions";
import {
  selectProjectCategory,
  selectProjectName,
  selectProject,
  selectDefaultPreferences
} from "../store/project/project.selectors";
import { CMProjectNodeService } from "./context-menu/cm-project-node/cm-project-node.service";
import { MapLinkService } from "../core/services/map-link/map-link.service";
import { NetmaskService } from '../core/services/netmask/netmask.service';
import { retrievedNetmasks } from '../store/netmask/netmask.actions';
import { MapEditService } from "../core/services/map-edit/map-edit.service";
import { RolesService } from '../core/services/roles/roles.service';
import { CmGroupOptionService } from './context-menu/cm-group-option/cm-group-option.service';
import { PortGroupAddModel } from "../core/models/port-group.model";
import { ConnectInterfaceDialogComponent } from './context-menu/cm-dialog/connect-interface-dialog/connect-interface-dialog.component';
import { selectLogicalNodes, selectPhysicalNodes } from '../store/node/node.selectors';
import { selectGroups } from '../store/group/group.selectors';
import { selectMapImages } from '../store/map-image/map-image.selectors';
import { selectMapLinks } from "../store/map-link/map-link.selectors";
import {
  addNewMapLink,
  clearMapLinks,
  loadMapLinks,
  selectMapLink,
  unSelectMapLink
} from "../store/map-link/map-link.actions";
import { retrievedMapCategory } from '../store/map-category/map-category.actions';
import { LocalStorageKeys } from "../core/storage/local-storage/local-storage-keys.enum";
import { MatButtonToggleChange } from "@angular/material/button-toggle";

const navigator = require('cytoscape-navigator');
const gridGuide = require('cytoscape-grid-guide');
const expandCollapse = require('cytoscape-expand-collapse');
const undoRedo = require('cytoscape-undo-redo');
const contextMenus = require('cytoscape-context-menus');
const panzoom = require('cytoscape-panzoom');
const compoundDragAndDrop = require('cytoscape-compound-drag-and-drop');
const nodeEditing = require('cytoscape-node-editing');
const konva = require('konva');
const jquery = require('jquery');
const popper = require('cytoscape-popper');


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy, OnInit {
  cy: any;
  ur: any;
  isOpenToolPanel = true;
  isDisableCancel = true;
  isDisableAddNode = true;
  isDisableAddProjectTemplate = true;
  isDisableNewFromSelected = false;
  isDisableLinkProject = true;
  isDisableAddPG = false;
  isDisableAddImage = true;
  isAddNode = false;
  isAddProjectTemplate = false;
  isAddProjectNode = false;
  isAddPublicPG = false;
  isAddPrivatePG = false;
  isAddMapImage = false;
  isTemplateCategory = false;
  isCanWriteOnProject = false;
  mapCategory = 'logical';
  projectId = 0;
  logicalNodes!: any[];
  physicalNodes!: any[];
  portGroups!: any[];
  logicalMapInterfaces!: any[];
  physicalInterfaces!: any[];
  mapImages!: any[];
  groupBoxes!: any[];
  domains!: any[];
  mapLinks!: any[];
  icons!: any[];
  mapProperties: any;
  defaultPreferences: any;
  config: any;
  styleExists: any;
  cleared: any;
  eles: any[] = [];
  isCustomizeNode = true;
  isCustomizePG = true;
  isLayoutOnly = false;
  deviceId = '';
  templateId = '';
  projectTemplateId = 0;
  linkProjectId = 0;
  mapImage: any;
  imageWidth: any;
  imageHeight: any;
  imageUrl: any;
  selectedMapPref: any;
  gateways!: any[];
  newEdgeData: any;
  e: any;
  inv: any;
  edgeNode: any;
  edgePortGroup: any;
  isAddEdge: any;
  isAddTunnel: any;
  isConnectToPG: any;
  isConnectToNode: any;
  interfacesCommonMapLinks: any[] = [];
  isBoxSelecting = false;
  isSearching = false;
  isSelectedProcessed = false;
  isEdgeDirectionChecked = false;
  isGroupBoxesChecked = false;
  vmStatus!: boolean;
  boxSelectedNodes = new Set();
  isInterfaceConnectPG = false;
  interfacePkConnectNode!: any;
  groupCategoryId!: string;
  projectName = ''
  selectDefaultPreferences$ = new Subscription();
  selectIsMapLoadedSuccess$ = new Subscription();
  selectMapPref$ = new Subscription();
  selectMapEdit$ = new Subscription();
  selectMapPortGroups$ = new Subscription();
  selectIcons$ = new Subscription();
  selectDomains$ = new Subscription();
  selectSearchText$ = new Subscription();
  selectIsHypervisorConnect$ = new Subscription();
  selectIsConfiguratorConnect$ = new Subscription();
  isHypervisorConnect = false;
  isConfiguratorConnect = false;
  selectInterfacePkConnectPG$ = new Subscription();
  selectInterfacePkConnectNode$ = new Subscription();
  selectMapOption$ = new Subscription();
  selectProjectCategory$ = new Subscription();
  selectLogicalNodes$ = new Subscription();
  selectPhysicalNodes$ = new Subscription();
  selectManagementPGs$ = new Subscription();
  selectLogicalMapInterfaces$ = new Subscription();
  selectPhysicalInterfaces$ = new Subscription();
  selectLogicalManagementInterfaces$ = new Subscription();
  selectMapImages$ = new Subscription();
  selectProjectName$ = new Subscription();
  selectMapLinks$ = new Subscription();
  selectGroups$ = new Subscription();
  selectProject$ = new Subscription();
  selectInterfacesCommonMapLinks$ = new Subscription();
  destroy$: Subject<boolean> = new Subject<boolean>();
  saveMapSubject: Subject<void> = new Subject<void>();
  activeNodeInBox: any[] = [];

  constructor(
    private router: Router,
    private store: Store,
    private helpersService: HelpersService,
    private mapService: MapService,
    private imageService: ImageService,
    private deviceService: DeviceService,
    private templateService: TemplateService,
    private hardwareService: HardwareService,
    private domainService: DomainService,
    private configTemplateService: ConfigTemplateService,
    private loginProfileService: LoginProfileService,
    private nodeService: NodeService,
    private mapLinkService: MapLinkService,
    private groupService: GroupService,
    private portgroupService: PortGroupService,
    private interfaceService: InterfaceService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private cmAddService: CMAddService,
    private cmInterfaceService: CMInterfaceService,
    private cmActionsService: CMActionsService,
    private cmViewDetailsService: CMViewDetailsService,
    private cmEditService: CMEditService,
    private cmDeleteService: CMDeleteService,
    private cmGroupBoxService: CMGroupBoxService,
    private cmProjectNodeService: CMProjectNodeService,
    private cmLockUnlockService: CMLockUnlockService,
    private cmRemoteService: CMRemoteService,
    private cmMapService: CMMapService,
    private searchService: SearchService,
    private commonService: CommonService,
    private toolPanelStyleService: ToolPanelStyleService,
    private projectService: ProjectService,
    private infoPanelService: InfoPanelService,
    private mapImageService: MapImageService,
    private contextMenuService: ContextMenuService,
    private netmaskService: NetmaskService,
    private mapEditService: MapEditService,
    private rolesService: RolesService,
    private cmGroupOptionService: CmGroupOptionService
  ) {
    navigator(cytoscape);
    gridGuide(cytoscape);
    expandCollapse(cytoscape);
    undoRedo(cytoscape);
    contextMenus(cytoscape);
    panzoom(cytoscape);
    cytoscape.use(compoundDragAndDrop);
    cytoscape.use(popper);
    nodeEditing(cytoscape, jquery, konva);
    this.mapCategory = localStorage.getItem(LocalStorageKeys.MAP_STATE) || 'logical'
    this.selectIcons$ = this.store.select(selectIcons).subscribe((icons: any) => {
      this.icons = icons;
    });
    this.selectMapPref$ = this.store.select(selectMapPref).subscribe((selectedMapPref: any) => {
      this.selectedMapPref = selectedMapPref;
    });
    this.selectMapEdit$ = this.store.select(selectMapEdit).subscribe((mapEdit: any) => {
      if (mapEdit) {
        this.isAddNode = mapEdit.isAddNode;
        this.isAddProjectNode = mapEdit.isAddProjectNode;
        this.linkProjectId = mapEdit.linkProjectId ? mapEdit.linkProjectId : this.linkProjectId;
        this.mapImage = mapEdit.mapImage;
        this.imageWidth = mapEdit.imageWidth;
        this.imageHeight = mapEdit.imageHeight;
        this.imageUrl = mapEdit.imageUrl;
        this.isAddProjectTemplate = mapEdit.isAddTemplateProject;
        this.projectTemplateId = mapEdit.projectTemplateId ? mapEdit.projectTemplateId : this.projectTemplateId;
        this.templateId = mapEdit.templateId ? mapEdit.templateId : this.templateId;
        this.deviceId = mapEdit.deviceId ? mapEdit.deviceId : this.deviceId;
        this.isCustomizeNode = mapEdit.isCustomizeNode;
        this.isAddPublicPG = mapEdit.isAddPublicPG;
        this.isAddPrivatePG = mapEdit.isAddPrivatePG;
        this.isCustomizePG = mapEdit.isCustomizePG;
        this.isLayoutOnly = mapEdit.isLayoutOnly;
        this.isAddMapImage = mapEdit.isAddMapImage;
        if (this.isAddNode || this.isAddPublicPG || this.isAddPrivatePG || this.isAddProjectTemplate || this.isAddProjectNode || this.isAddMapImage) {
          this._disableMapEditButtons();
        } else {
          this._enableMapEditButtons();
        }
      }
    });
    this.selectDefaultPreferences$ = this.store.select(selectDefaultPreferences).subscribe(defaultPreferences => {
      if (defaultPreferences) {
        this.defaultPreferences = defaultPreferences;
      }
    });
    this.selectLogicalNodes$ = this.store.select(selectLogicalNodes).subscribe((logicalNodes: any) => {
      if (logicalNodes) {
        this.logicalNodes = logicalNodes;
      }
    });
    this.selectPhysicalNodes$ = this.store.select(selectPhysicalNodes).subscribe((physicalNodes: any) => {
      if (physicalNodes) {
        this.physicalNodes = physicalNodes;
      }
    });
    this.selectMapPortGroups$ = this.store.select(selectMapPortGroups).subscribe((portGroups: any) => {
      if (portGroups) {
        this.portGroups = portGroups;
      }
    });
    this.selectLogicalMapInterfaces$ = this.store.select(selectLogicalMapInterfaces).subscribe(logicalMapInterfaces => {
      if (logicalMapInterfaces) {
        this.logicalMapInterfaces = logicalMapInterfaces;
      }
    });
    this.selectPhysicalInterfaces$ = this.store.select(selectPhysicalInterfaces).subscribe(physicalWiredInterfaces => {
      if (physicalWiredInterfaces) {
        this.physicalInterfaces = physicalWiredInterfaces;
      }
    });
    this.selectInterfacesCommonMapLinks$ = this.store.select(selectInterfacesCommonMapLinks).subscribe(interfacesCommonMapLinks => {
      if (interfacesCommonMapLinks) {
        this.interfacesCommonMapLinks = interfacesCommonMapLinks;
      }
    });
    this.selectGroups$ = this.store.select(selectGroups).subscribe(groups => {
      if (groups) {
        this.groupBoxes = groups;
      }
    });
    this.selectMapImages$ = this.store.select(selectMapImages).subscribe(mapImage => {
      if (mapImage) {
        this.mapImages = mapImage
      }
    });
    this.selectMapLinks$ = this.store.select(selectMapLinks).subscribe(mapLinks => {
      this.mapLinks = mapLinks
    })
    this.selectSearchText$ = this.store.select(selectSearchText).subscribe((searchText: string) => {
      if (searchText?.length > 0) {
        this.searchMap(searchText);
      } else if (searchText?.length == 0) {
        this.clearSearch();
      }
    });
    this.selectIsHypervisorConnect$ = this.store.select(selectIsHypervisorConnect).subscribe(isHypervisorConnect => {
      if (isHypervisorConnect !== undefined) {
        this.isHypervisorConnect = isHypervisorConnect
      }
    })
    this.selectIsConfiguratorConnect$ = this.store.select(selectIsConfiguratorConnect).subscribe(isConfiguratorConnect => {
      if (isConfiguratorConnect !== undefined) {
        this.isConfiguratorConnect = isConfiguratorConnect
      }
    })
    this.projectId = this.projectService.getProjectId();
    this.store.dispatch(loadMap({ projectId: this.projectId, mapCategory: this.mapCategory }));
    this.store.dispatch(loadDomains({ projectId: this.projectId }));
    this.store.dispatch(loadMapLinks({ projectId: this.projectId }));
    this.store.dispatch(loadProjectsNotLinkYet({ projectId: this.projectId }));
    this.imageService.getByCategory('icon').subscribe((data: any) => this.store.dispatch(retrievedIcons({ data: data.result })));
    this.deviceService.getAll().subscribe((data: any) => this.store.dispatch(retrievedDevices({ data: data.result })));
    this.templateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedTemplates({ data: data.result })));
    this.hardwareService.getAll().subscribe((data: any) => this.store.dispatch(retrievedHardwares({ data: data.result })));
    this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    this.loginProfileService.getAll().subscribe((data: any) => this.store.dispatch(retrievedLoginProfiles({ data: data.result })));
    this.imageService.getByCategory('image').subscribe((data: any) => this.store.dispatch(retrievedImages({ data: data.result })));
    this.selectProjectCategory$ = this.store.select(selectProjectCategory).subscribe(projectCategory => {
      this.isTemplateCategory = projectCategory === 'template'
      if (this.isTemplateCategory) {
        this.mapEditService.removeAllProjectNodesOnMap(this.cy)
      }
    })
    this.netmaskService.getAll().subscribe((data: any) => this.store.dispatch(retrievedNetmasks({ data: data.result })));
    this.store.dispatch(retrievedIsMapOpen({ data: true }));
    this.selectInterfacePkConnectPG$ = this.store.select(selectIsInterfaceConnectPG).subscribe(interfacePkConnectPG => {
      this.isInterfaceConnectPG = interfacePkConnectPG;
    })
    this.selectProject$ = this.store.select(selectProject).subscribe(project => {
      if (project) {
        if (this.isHypervisorConnect || this.isConfiguratorConnect) {
          this.vmStatus = project.configuration.vm_status;
          this.store.dispatch(retrievedVMStatus({ vmStatus: project.configuration.vm_status }));
        }
      }
    });
    this.selectInterfacePkConnectNode$ = this.store.select(selectInterfacePkConnectNode).subscribe(interfacePkConnectNode => {
      this.interfacePkConnectNode = interfacePkConnectNode;
    })
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe(mapOption => {
      this.isEdgeDirectionChecked = mapOption?.isEdgeDirectionChecked != undefined ? mapOption.isEdgeDirectionChecked : false;
      this.isGroupBoxesChecked = mapOption?.isGroupBoxesChecked != undefined ? mapOption.isGroupBoxesChecked : false;
      this.groupCategoryId = mapOption?.groupCategoryId;
    });
    this.selectProjectName$ = this.store.select(selectProjectName).subscribe(projectName => {
      if (projectName) {
        this.projectName = projectName;
      }
    })
  }

  ngOnInit(): void {
    this.selectIsMapLoadedSuccess$ = this.store.select(selectIsMapLoadedSuccess).subscribe(isLoaded => {
      if (
        isLoaded &&
        this.defaultPreferences
        && (this.logicalNodes || this.physicalNodes)
        && this.portGroups
        && (this.logicalMapInterfaces || this.physicalInterfaces)
        && this.groupBoxes
        && this.mapLinks
        && this.interfacesCommonMapLinks
      ) {
        this._initCytoscape();
        this._initMouseEvents();
        this._initContextMenu();
        this._initUndoRedo();
        this.mapLinks.map((mapLink: any) => {
          this.store.dispatch(loadLinkedMap({
            projectId: mapLink.linked_project_id,
            mapCategory: 'logical',
            mapLinkId: mapLink.id,
            position: mapLink.position
          }))
        })
      }
    });
  }

  ngAfterViewInit(): void {
    const permissions = this.rolesService.getUserPermissions();
    if (permissions) {
      for (let p of permissions) {
        if (p === "can_write on Project") {
          this.isCanWriteOnProject = true
          break
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.selectDefaultPreferences$.unsubscribe();
    this.selectIsMapLoadedSuccess$.unsubscribe();
    this.selectMapPref$.unsubscribe();
    this.selectMapEdit$.unsubscribe();
    this.selectMapPortGroups$.unsubscribe();
    this.selectIcons$.unsubscribe();
    this.selectDomains$.unsubscribe();
    this.selectSearchText$.unsubscribe();
    this.selectIsHypervisorConnect$.unsubscribe();
    this.selectIsConfiguratorConnect$.unsubscribe();
    this.selectProject$.unsubscribe();
    this.cy?.nodes().forEach((ele: any) => {
      this.helpersService.removeBadge(ele);
    });
    this.store.dispatch(retrievedIsMapOpen({ data: false }));
    this.store.dispatch(mapDestroySuccess());
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.store.dispatch(retrievedMapEdit({ data: undefined }))
    this.store.dispatch(retrievedMapCategory({ mapCategory : undefined}));
    this.deviceId = '';
    this.templateId = '';
    this.projectTemplateId = 0;
    this.linkProjectId = 0;
    this.mapLinks = [];
    this.store.dispatch(clearMapLinks())
    this.selectMapOption$.unsubscribe();
    this.selectLogicalNodes$.unsubscribe();
    this.selectMapPortGroups$.unsubscribe();
    this.selectManagementPGs$.unsubscribe();
    this.selectLogicalMapInterfaces$.unsubscribe();
    this.selectLogicalManagementInterfaces$.unsubscribe();
    this.selectGroups$.unsubscribe();
    this.selectMapImages$.unsubscribe();
    this.selectMapLinks$.unsubscribe();
    this.selectProjectName$.unsubscribe();
    this.store.dispatch(unSelectAllElementsOnMap());
  }

  private _disableMapEditButtons() {
    this.isDisableAddNode = true;
    this.isDisableAddPG = true;
    this.isDisableAddImage = true;
    this.isDisableAddProjectTemplate = true;
    this.isDisableNewFromSelected = true;
    this.isDisableLinkProject = true;
    this.isDisableCancel = false;
  }

  private _enableMapEditButtons() {
    this.isDisableAddNode = !(Boolean(this.templateId) && Boolean(this.deviceId));
    this.isDisableAddProjectTemplate = !(Boolean(this.projectTemplateId));
    this.isDisableLinkProject = !(Boolean(this.linkProjectId));
    this.isDisableNewFromSelected = false;
    this.isDisableAddPG = false;
    this.isDisableAddImage = this.mapImage ? !(Boolean(this.mapImage.id)) : false;
    this.isDisableCancel = true;
  }

  private _dragFreeOnNode($event: any) {
    const node = $event.target;
    const data = node.data();

    if (data.label && data.label == 'group_box') {
      const expandCollapse = this.cy.expandCollapse('get');
      let gbNodes;
      if (!data.collapsedChildren) {
        const d = '"' + data.id + '"';
        gbNodes = this.cy.nodes().filter(`[domain=${d}]`);
      } else {
        gbNodes = expandCollapse.getCollapsedChildrenRecursively($event.target);
      }
    }
    data.updated = true;
  }

  private _zoom() { }

  private _tapNode($event: any) {
    const targetData = $event.target.data();
    if (this.isAddEdge) {
      if (
        $event.target.group() != 'nodes'
        || targetData.label == 'group_box'
        || (this.edgeNode && targetData.elem_category && targetData.elem_category != 'port_group')
        || (this.edgePortGroup && targetData.elem_category && targetData.elem_category == 'port_group')
      ) {
        return this._unqueueEdge();
      }
      let src: any;
      let targ: any;
      if (this.edgePortGroup) {
        src = "'" + this.edgePortGroup.data().id + "'";
        targ = "'" + targetData.id + "'";
      } else {
        src = "'" + this.edgeNode.data().id + "'";
        targ = "'" + targetData.id + "'";
      }
      const el = this.cy.edges().filter(`[source=${src}][target=${targ}]`).length
      if (el > 0) {
        if (targ.includes('tempNode') && this.edgeNode) {
          if (this.edgeNode.data('elem_category') == 'map_link') {
            this.toastr.warning('Please select the common port group that has been highlighted to connect', 'Warning');
            return;
          }
        } else if (!this.edgePortGroup) {
          // Add a new edge connecting to the port group with some of the edges already connected to this port group before.
          return this._addNewEdge($event);
        } else if (targ.includes('node-')) {
          this.toastr.warning('The edge is already existing!', 'Warning');
          return this._unqueueEdge();
        } else {
          this.toastr.warning('Please select a node to create new edge!', 'Warning');
          return this._unqueueEdge();
        }
      }
      this._addNewEdge($event);
    } else if (this.isAddTunnel) {
      if (
        targetData.temp
        || $event.target.group() != 'nodes'
        || targetData.label == 'group_box'
        || targetData.elem_category == 'port_group'
      ) {
        return this._unqueueEdge();
      }
      this._addNewEdge($event);
    } else if (this.isConnectToPG) {
      this._connectEdgeToPG($event)
    } else if (this.isConnectToNode) {
      this._connectEdgeToNode($event)
    }
  }

  private _selectNode($event: any) {
    const t = $event.target;
    const eles = this.logicalNodes.concat(this.portGroups).concat(this.logicalMapInterfaces).concat(this.mapImages)
    const selectedEles = eles.filter((n: any) => n.isSelected)
    if (this.cy.elements().length !== selectedEles.length) {
      const isChildrenOfProjectNode = t.parent()?.data('elem_category') == 'map_link';
      if (isChildrenOfProjectNode) {
        return;
      }
      const d = t.data();
      if (this.isBoxSelecting || this.isSearching) { return; }

      if (this.isAddNode || this.isAddPublicPG || this.isAddPrivatePG) {
        this.isAddNode = false;
        this.isAddPublicPG = false;
        this.isAddPrivatePG = false;
        t.unselect();
        return;
      }
      if (d.label == 'map_background') {
        this.store.dispatch(selectMapImage({ id: d.id }));
      } else if (d.label == 'group_box') {
        this.isBoxSelecting = true;
        t.children().forEach((ele: any) => {
          ele.select();
          this.boxSelectedNodes.add(ele);
        })
        this._selectGroupBox();
        this.isBoxSelecting = false;
        this.isSelectedProcessed = false;
        this.boxSelectedNodes.clear();
        this.store.dispatch(selectGroup({ id: d.id }));
      } else {
        if (d.elem_category == 'node') {
          this.store.dispatch(selectNode({ id: d.id, mapCategory: this.mapCategory }));
        } else if (d.elem_category == 'port_group') {
          this.store.dispatch(selectPG({ id: d.id }));
        } else if (d.elem_category == 'map_link') {
          this.store.dispatch(selectMapLink({ id: d.id }))
        }
      }
      this.contextMenuService.showContextMenu(this.cy, this.isTemplateCategory, this.isGroupBoxesChecked, this.mapCategory);
    }
  }

  private _selectEdge($event: any) {
    const t = $event.target;
    const eles = this.logicalNodes.concat(this.portGroups).concat(this.logicalMapInterfaces).concat(this.mapImages)
    const selectedEles = eles.filter((n: any) => n.isSelected)
    if (this.cy.elements().length !== selectedEles.length) {
      const isChildrenOfProjectNode = t.connectedNodes().some((ele: any) => ele.parent()?.data('elem_category') == 'map_link')
      if (isChildrenOfProjectNode) {
        return;
      }
      if (this.isBoxSelecting || this.isSearching) { return; }
      if (t.isEdge()) {
        if (t.data('category') !== 'link') {
          if (this.mapCategory === 'logical') {
            this.store.dispatch(selectInterface({ id: t.data('id') }));
          } else {
            this.store.dispatch(selectPhysicalInterface({ id: t.data('id') }));
          }
        }
      }
      this.contextMenuService.showContextMenu(this.cy, this.isTemplateCategory, this.isGroupBoxesChecked, this.mapCategory);
    }
  }

  private _unselectNode($event: any) {
    const t = $event.target;
    if (t.data('label') == 'map_background') {
      this.store.dispatch(unSelectMapImage({ id: t.data('id') }));
    } else if (t.data('label') == 'group_box') {
      t.children().forEach((el: any) => {
        el.unselect();
      });
      this.store.dispatch(unSelectGroup({ id: t.data('id') }));
    } else if (t.data('elem_category') == 'port_group') {
      this.store.dispatch(unSelectPG({ id: t.data('id') }));
    } else if (t.data('elem_category') == 'node') {
      this.store.dispatch(unSelectNode({ id: t.data('id') , mapCategory: this.mapCategory}));
    } else {
      this.store.dispatch(unSelectMapLink({ id: t.data('id') }))
    }
  }

  private _unselectEdge($event: any) {
    const t = $event.target;
    if (this.mapCategory === 'logical') {
      this.store.dispatch(unSelectInterface({ id: t.data('id') }));
    } else {
      this.store.dispatch(unSelectPhysicalInterface({ id: t.data('id') }));
    }
  }

  private _boxStart(_$event: any) {
    this.cy.nodes().selectify();
    this.cy.edges().selectify();
    this.isBoxSelecting = true;
    this.isSelectedProcessed = false;
    this.boxSelectedNodes.clear();
    this.activeNodeInBox.splice(0)
  }

  private _boxSelect($event: any) {
    this.cy.nodes().selectify();
    this.cy.edges().selectify();
    this.activeNodeInBox.push($event.target);
    clearTimeout(this.cy.nodesSelectionTimeout);
    this.cy.nodesSelectionTimeout = setTimeout(this._selectNodeAndEdgesInBox.bind(this), 20)
  }

  private _selectNodeAndEdgesInBox() {
    this._processNodeList(this.activeNodeInBox);
  }

  private _selectGroupBox() {
    this.cy.nodes().selectify();
    this.cy.edges().selectify();
    if (this.isSelectedProcessed || this.boxSelectedNodes.size == 0) return;
    this._processNodeList(this.boxSelectedNodes);
  }

  private _boxCheck($event: any) {
    this.cy.nodes().selectify();
    this.cy.edges().selectify();
    const t = $event.target;
    this.boxSelectedNodes.add(t);
  }

  private _processNodeList(elms: any) {
    for (let elm of elms) {
      const d = elm.data();
      if (d.elem_category == 'node') {
        this.store.dispatch(selectNode({ id: d.id, mapCategory: this.mapCategory }));
      } else if (d.elem_category == 'port_group') {
        this.store.dispatch(selectPG({ id: d.id }));
      } else if (d.elem_category == 'map_link') {
        this.store.dispatch(selectMapLink({ id: d.id }))
      } else if (d.elem_category == 'bg_image') {
        this.store.dispatch(selectMapImage({ id: d.id }));
      } else if (elm.isEdge()) {
        this.store.dispatch(selectInterface({ id: d.id }));
      }
    }
    this.isSelectedProcessed = true;
    this.isBoxSelecting = false;
  }

  private _click($event: any) {
    const newNodePosition = { x: Number($event.position.x.toFixed(2)), y: Number($event.position.y.toFixed(2)) }
    if (this.isAddNode && this.deviceId && this.templateId) {
      this.nodeService.genData(this.projectId, this.deviceId, this.templateId)
        .subscribe(genData => {
          const icon = this.helpersService.getOptionById(this.icons, genData.icon_id);
          const icon_src = ICON_PATH + icon.photo;
          const newNodeData = {
            "elem_category": "node",
            "icon": icon_src,
            "type": genData.role,
            "zIndex": 999,
            "background-image": icon_src,
            "background-opacity": 0,
            "shape": "roundrectangle",
            "text-opacity": 1
          }
          if (this.isCustomizeNode) {
            this._openAddUpdateNodeDialog(genData, newNodeData, newNodePosition);
          } else {
            this._addNewNode(genData, newNodeData, newNodePosition);
          }
        });
    } else if (this.isAddPublicPG || this.isAddPrivatePG) {
      const category = this.isAddPrivatePG ? 'private' : 'public';
      this.portgroupService.genData(this.projectId, category)
        .subscribe(genData => {
          const newNodeData = {
            "elem_category": "port_group",
            "zIndex": 999,
            "background-opacity": 1,
            "shape": "ellipse",
            "text-opacity": 0,
          }
          if (this.isCustomizePG) {
            this._openAddUpdatePGDialog(genData, newNodeData, newNodePosition);
          } else {
            this._addNewPortGroup(genData, newNodeData, newNodePosition);
          }
        });
    } else if (this.isAddProjectTemplate) {
      this.addTemplateIntoCurrentProject(this.projectTemplateId, this.isLayoutOnly, newNodePosition);
    } else if (this.isAddProjectNode) {
      this.addProjectNode(this.linkProjectId, this.projectId, newNodePosition);
    } else if (this.isAddMapImage) {
      this.addImage(this.imageWidth, this.imageHeight, this.imageUrl, this.projectId, newNodePosition);
    }
    if ($event.target === this.cy) {
      this.cy.nodes().unselectify();
      this.cy.edges().unselectify();
    } else {
      this.cy.nodes().selectify();
      this.cy.edges().selectify();
    }

  }

  private _nodeEditing() {
    console.log('nodeEditing');
  }

  private _cdndDrop($event: any, dropTarget: any, dropSibling: any) {
    if (this.isGroupBoxesChecked) {
      const target = $event.target;
      const data = target.data();
      if (dropTarget.data('label') && dropTarget.data('label') == 'group_box' && target.data('groups')[0]?.id) {
        if (this.groupCategoryId == 'domain') {
          const g = data.groups.filter((gb: any) => gb.category == 'domain');
          if (g[0]?.id != dropTarget.data('group_id')) {
            data.domain = dropTarget.data('domain');
            data.domain_id = dropTarget.data('domain_id');
            this.updateGroups(data);
            target.move({ 'parent': 'group-' + dropTarget.data('group_id') });
          }
        }
      } else if (dropTarget.data('label') && dropTarget.data('label') != 'group_box') {
        data.domain = 'default.test';
        data.domain_id = this.domains.filter(d => d.name == 'default.test')[0].id;
        this.updateGroups(data);
      }
      this.helpersService.addNewGroupBoxByMovingNodes(this.cy, dropTarget, this.projectId, this.mapCategory);
    }
  }

  private _cdndOut(event: any, dropTarget: any) {
    if (this.isGroupBoxesChecked && this.helpersService.isParentOfOneChild(dropTarget)) {
      this.helpersService.removeParent(dropTarget);
    }
  }

  private _keyDown($event: any) {
    if ($event.ctrlKey && $event.target.nodeName === "BODY") {
      if ($event.which === 90) this.ur.undo();
      else if ($event.which === 89) this.ur.redo();
    }
  }

  private _initCytoscape(): void {
    this.config = {
      default_preferences: {
        ...this.defaultPreferences,
        default_icon_path: "/assets/icons/default_icon.png",
        default_img_path: ICON_PATH,
        public_portgroup_url: '/api/v1/portgroup/gen_data/public',
        private_portgroup_url: '/api/v1/portgroup/gen_data/private',
        node_view_url: '/ap1/v1/node/gen_data',
        enc_node_view_url: '/nodeview/gen_enc_data/',
        save_url: '/api/v1/map/save_data/' + this.mapCategory,
        enclave_save_url: "/enclaveview/save_map/" + this.projectId,
        enc_to_proj: "/enclaveview/enclave_to_project/",
        enc_to_enc: "/enclaveview/enclave_to_enclave/",
        infra_to_proj: "/infraview/infra_to_project/"
      },
      gb_exists: this.groupBoxes?.length > 0 ? true : false,
      live_packets: false,
      styleExists: this.defaultPreferences.accessed,
      cleared: this.defaultPreferences?.cleared,
      grid_settings: this.defaultPreferences?.grid_settings ? this.defaultPreferences.grid_settings : null,
      nodes_size_max: 200,
      text_size_max: 200,
      edge_size_max: 50,
      port_group_max: 200,
      grid_spacing_max: 200,
      display_map_overview: true,
      display_map_grid: false,
      grid_space_default: "100",
      display_status: true,
      range_map_refresh_time: 30000,
      search_color: "rgb(255,255,50)",
      debug_output: false,
      grid_on_options: {
        snapToGridOnRelease: true,
        snapToGridDuringDrag: false,
        snapToAlignmentLocationOnRelease: false,
        snapToAlignmentLocationDuringDrag: false,
        distributionGuidelines: false,
        geometricGuideline: false,
        initPosAlignment: false,
        centerToEdgeAlignment: false,
        resize: false,
        parentPadding: false,
        drawGrid: true,
        gridSpacing: "100",
        snapToGridCenter: false,
        zoomDash: true,
        panGrid: true,
        gridStackOrder: 0,
        gridColor: '#c7c7c7',
        lineWidth: 1.0,
        guidelinesTolerance: 2.00,
        guidelinesStyle: {
          strokeStyle: "#8b7d6b",
          geometricGuidelineRange: 400,
          range: 100,
          minDistRange: 10,
          distGuidelineOffset: 10,
          horizontalDistColor: "#ff0000",
          verticalDistColor: "#00ff00",
          initPosAlignmentColor: "#0000ff",
          lineDash: [0, 0],
          horizontalDistLine: [0, 0],
          verticalDistLine: [0, 0],
          nitPosAlignmentLine: [0, 0],
          parentSpacing: -1
        }
      },
      grid_off_options: {
        drawGrid: false,
        snapToGridOnRelease: false,
        snapToGridDuringDrag: false,
      },
      nav_defaults: {
        container: false,
        viewLiveFramerate: 0,
        thumbnailEventFramerate: 30,
        thumbnailLiveFramerate: false,
        dblClickDelay: 200,
        removeCustomContainer: true,
        rerenderDelay: 100,
        zIndex: -999,
      },
      tool_panel: {
        zIndex: -999,
        isRange: true
      },
      info_panel: {
      },
      cdnd_enable_options: {
        grabbedNode: (_node: any) => !Boolean(_node.data('parent_id')),
        dropTarget: (_node: any) => {
          return this.isGroupBoxesChecked;
        },
        dropSibling: (_node: any) => true,
        newParentNode: (_grabbedNode: any, _dropSibling: any) => ({}),
        overThreshold: 10,
        outThreshold: 10
      }
    }
    this.styleExists = this.config.styleExists;
    this.cleared = this.config.cleared;
    const nodeData = this.mapCategory === 'logical' ? this.logicalNodes : this.physicalNodes
    const interfacesData = this.mapCategory === 'logical' ? this.logicalMapInterfaces : this.physicalInterfaces
    const interfacesValid = this.mapCategory == 'logical' ? interfacesData.filter(i => i.port_group_id) : interfacesData.filter(i => i.data.target)
    const portGroupsData = this.mapCategory === 'logical' ? this.portGroups : []
    const mapLinksData = this.mapCategory === 'logical' ? this.mapLinks : []
    this.eles = JSON.parse(JSON.stringify(
      nodeData.concat(portGroupsData)
        .concat(interfacesValid)
        .concat(mapLinksData)
        .concat(this.mapImages)
        .concat(this.interfacesCommonMapLinks)
    ));
    this.eles.forEach(ele => {
      if (ele.data.elem_category == 'bg_image') {
        if (!ele.data.src.includes(environment.apiBaseUrl)) {
          ele.data.src = environment.apiBaseUrl + ele.data.image;
        }
      }
    });
    this.cy = cytoscape({
      container: document.getElementById("cy"),
      elements: this.eles,
      style: this.helpersService.generateCyStyle(this.config.default_preferences),
      minZoom: 0.1,
      maxZoom: 10,
      layout: (this.styleExists || this.cleared) ? { name: 'preset' } : {
        name: "cose",
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        spacingFactor: 5,
        fit: true,
        animate: false,
      },
      wheelSensitivity: 0.2,
    });

    // Random position for the nodes if the map has layout preset however the nodes don't have the position
    this.helpersService.randomPositionForElementsNoPosition(this.cy)
    // this.cy.nodeEditing({
    //   resizeToContentCueImage: "/static/img/resizeCue.svg",
    //   isNoControlsMode: (node: any) => {
    //     const z = this.cy.zoom();
    //     const cyW = this.cy.container().clientWidth;
    //     const cyH = this.cy.container().clientHeight;
    //     const nW = node.renderedWidth();
    //     const nH = node.renderedHeight();
    //     return ((nW * nH * z) / (cyW * cyH) < .0005) ? true : false;
    //   }
    // });

  }

  private _initUndoRedo() {
    this.cy.panzoom({});
    this.cy.expandCollapse({
      layoutBy: null,
      fisheye: false,
      undoable: false,
      animate: false
    });
    this.cy.nodes().on('expandcollapse.beforecollapse', ($event: any) => {
      let a = this.cy.nodeEditing('get');
      if (a) {
        a.removeGrapples()
      }
      a = null;
    });
    this.cy.compoundDragAndDrop(this.config.cdnd_enable_options);
    this.cy.elements().forEach((ele: any) => {
      const data = ele.data();
      if (ele.group() == "nodes") {
        if (data.locked) {
          ele.lock();
          this.helpersService.addBadge(this.cy, ele);
        }
      }
    });
    this.ur = this.cy.undoRedo({
      isDebug: this.config['debug_output'],
      stackSizeLimit: 20,
    });
    this.commonService.ur = this.ur;
    this.infoPanelService.ur = this.ur;
    this.infoPanelService.cy = this.cy;
    this.helpersService.cy = this.cy;
    this.helpersService.ur = this.ur;
    this.ur.action("removeNodes", this.helpersService.removeNodes.bind(this), this.helpersService.restoreNodes.bind(this));
    this.ur.action("removePGs", this.helpersService.removePGs.bind(this), this.helpersService.restorePGs.bind(this));
    this.ur.action("removeInterfaces", this.helpersService.removeInterfaces.bind(this), this.helpersService.restoreInterfaces.bind(this));
    this.ur.action("removeMapLinks", this.helpersService.removeMapLinks.bind(this), this.helpersService.restoreMapLinks.bind(this));
    this.ur.action("removeMapImages", this.helpersService.removeMapImages.bind(this), this.helpersService.restoreMapImages.bind(this));
    this.ur.action("changeNodeSize", this.toolPanelStyleService.changeNodeSize.bind(this.commonService), this.toolPanelStyleService.restoreNodeSize.bind(this.commonService));
    this.ur.action("changeMapImageSize", this.toolPanelStyleService.changeMapImageSize.bind(this.commonService), this.toolPanelStyleService.restoreMapImageSize.bind(this.commonService));
    this.ur.action("changTextColor", this.toolPanelStyleService.changTextColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextSize", this.toolPanelStyleService.changeTextSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changePGColor", this.toolPanelStyleService.changePGColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restorePGColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changePGSize", this.toolPanelStyleService.changePGSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restorePGSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeEdgeColor", this.toolPanelStyleService.changeEdgeColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreEdgeColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeEdgeSize", this.toolPanelStyleService.changeEdgeSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreEdgeSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeArrowScale", this.toolPanelStyleService.changeArrowScale.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreArrowScale.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeDirection", this.toolPanelStyleService.changeDirection.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreDirection.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextBGColor", this.toolPanelStyleService.changeTextBGColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextBGColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextOutlineColor", this.toolPanelStyleService.changeTextOutlineColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextOutlineColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextOutlineWidth", this.toolPanelStyleService.changeTextOutlineWidth.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextOutlineWidth.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextBGOpacity", this.toolPanelStyleService.changeTextBGOpacity.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextBGOpacity.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextVAlign", this.toolPanelStyleService.changeTextVAlign.bind(this.commonService), this.toolPanelStyleService.restoreTextVAlign.bind(this.commonService));
    this.ur.action("changeTextHAlign", this.toolPanelStyleService.changeTextHAlign.bind(this.commonService), this.toolPanelStyleService.restoreTextHAlign.bind(this.commonService));
    this.ur.action("changeGBOpacity", this.toolPanelStyleService.changeGBOpacity.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBOpacity.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBColor", this.toolPanelStyleService.changeGBColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBBorderColor", this.toolPanelStyleService.changeGBBorderColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBBorderColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBType", this.toolPanelStyleService.changeGBType.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBType.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBBorderSize", this.toolPanelStyleService.changeGBBorderSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBBorderSize.bind(this.commonService).bind(this.commonService));
  }

  private _initMouseEvents() {
    this.cy.removeAllListeners();
    this.cy.on("dragfreeon", "node", this._dragFreeOnNode.bind(this));
    this.cy.on("zoom", this._zoom.bind(this));
    this.cy.on("tap", "node", this._tapNode.bind(this));
    this.cy.on("select", "node", this._selectNode.bind(this));
    this.cy.on("select", "edge", this._selectEdge.bind(this));
    this.cy.on("unselect", "node", this._unselectNode.bind(this));
    this.cy.on("unselect", "edge", this._unselectEdge.bind(this));
    this.cy.on("boxstart", this._boxStart.bind(this));
    this.cy.on("boxselect", this._boxSelect.bind(this));
    this.cy.on("box", this._boxCheck.bind(this));
    this.cy.on("click", this._click.bind(this));
    this.cy.on("cxttap", "node", this._rightClickAndShowContextMenu.bind(this));
    this.cy.on("cxttap", "edge", this._rightClickAndShowContextMenu.bind(this));
    this.cy.on("nodeediting.resizeend", this._nodeEditing.bind(this));
    this.cy.on('cdnddrop', this._cdndDrop.bind(this));
    this.cy.on('cdndout', this._cdndOut.bind(this));
    this.cy.on("noderesize.resizeend", (_e: any, _type: any) => {
      document.body.style.cursor = "initial";
    });
    document.addEventListener("keydown", this._keyDown.bind(this));
  }

  private _initContextMenu() {
    this.cy.contextMenus({
      menuItems: [
        this.cmGroupBoxService.getMoveToFrontMenu(),
        this.cmGroupBoxService.getMoveToBackMenu(),
        this.cmInterfaceService.getNodeInterfaceMenu(this.queueEdge.bind(this), this.cy, this.isCanWriteOnProject, this.mapCategory),
        this.cmProjectNodeService.getLinkProjectMenu(this.queueEdge.bind(this), this.cy),
        // this.cmInterfaceService.getPortGroupInterfaceMenu(this.queueEdge.bind(this)),
        this.cmAddService.getEdgeAddMenu(),
        this.cmActionsService.getNodeActionsMenu(this.isCanWriteOnProject, this.mapCategory),
        this.cmActionsService.getPortGroupActionsMenu(Number(this.projectId)),
        this.cmActionsService.getEdgeActionsMenu(),
        this.cmGroupOptionService.getNodePgGroupMenu(this.cy, this.projectId, this.isCanWriteOnProject),
        this.cmRemoteService.getNodeRemoteMenu(),
        this.cmRemoteService.getPortGroupRemoteMenu(),
        this.cmViewDetailsService.getMenu(this.cy, this.mapCategory, Number(this.projectId)),
        this.cmEditService.getMenu(this.cy, this.isCanWriteOnProject, this.mapCategory, Number(this.projectId)),
        this.cmDeleteService.getMenu(this.isCanWriteOnProject, this.mapCategory),
        this.cmLockUnlockService.getLockMenu(this.cy, this.mapCategory),
        this.cmLockUnlockService.getUnlockMenu(this.cy, this.mapCategory),
        this.cmGroupBoxService.getCollapseMenu(this.cy),
        this.cmGroupBoxService.getExpandMenu(this.cy),
        this.cmProjectNodeService.getCollapseNodeMenu(this.cy),
        this.cmProjectNodeService.getExpandNodeMenu(this.cy),
        this.cmMapService.getSaveChangesMenu(this.isCanWriteOnProject),
        this.cmMapService.getUndoMenu(),
        this.cmMapService.getRedoMenu(),
        this.cmMapService.getDownloadMenu(),
        this.cmMapService.getLockAllMenu(this.cy),
        this.cmMapService.getUnlockAllMenu(this.cy),
        this.cmMapService.getSelectAllMenu(this.cy),
        this.cmMapService.getDeselectAllMenu(this.cy),
      ],
      submenuIndicator: { src: '/assets/icons/submenu-indicator-default.svg', width: 12, height: 12 }
    });
  }

  private _rightClickAndShowContextMenu($event: any) {
    const t = $event.target;
    t.select();
    this.contextMenuService.showContextMenu(this.cy, this.isTemplateCategory, this.isGroupBoxesChecked, this.mapCategory);
  }

  private _openAddUpdateNodeDialog(genData: any, newNodeData: any, newNodePosition: any) {
    const dialogData = {
      mode: 'add',
      projectId: this.projectId,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newNodeData,
      newNodePosition,
      mapCategory: this.mapCategory,
    }
    const dialogRef = this.dialog.open(AddUpdateNodeDialogComponent, { disableClose: true, width: '600px', data: dialogData });
    dialogRef.afterClosed().subscribe((_data: any) => {
      this.isAddNode = false;
      this._enableMapEditButtons();
    });
  }

  private _addNewNode(genData: any, newNodeData: any, newNodePosition: any) {
    const jsonData = {
      name: genData.name,
      notes: genData.notes,
      icon_id: genData.icon_id,
      category: genData.category,
      infrastructure: this.mapCategory === 'physical' ? true : false,
      device_id: genData.device_id,
      template_id: genData.template_id,
      hardware_id: genData.hardware_id,
      folder: genData.folder,
      role: genData.role,
      domain_id: genData.domain_id,
      hostname: genData.hostname,
      project_id: this.projectId,
      logical_map: {
        map_style: {
          "height": this.selectedMapPref.node_size,
          "width": this.selectedMapPref.node_size,
          "text_size": this.selectedMapPref.text_size,
          "text_color": this.selectedMapPref.text_color,
          "text_halign": this.selectedMapPref.text_halign,
          "text_valign": this.selectedMapPref.text_valign,
          "text_outline_color": this.selectedMapPref.text_outline_color,
          "text_outline_width": this.selectedMapPref.text_outline_width,
          "text_bg_color": this.selectedMapPref.text_bg_color,
          "text_bg_opacity": this.selectedMapPref.text_bg_opacity,
          "background-color": "rgb(255,255,255)",
          "background-image": "",
          "background-fit": "contain"
        },
        position: newNodePosition
      },
      physical_map: {
        map_style: {
          "height": this.selectedMapPref.node_size,
          "width": this.selectedMapPref.node_size,
          "text_size": this.selectedMapPref.text_size,
          "text_color": this.selectedMapPref.text_color,
          "text_halign": this.selectedMapPref.text_halign,
          "text_valign": this.selectedMapPref.text_valign,
          "text_outline_color": this.selectedMapPref.text_outline_color,
          "text_outline_width": this.selectedMapPref.text_outline_width,
          "text_bg_color": this.selectedMapPref.text_bg_color,
          "text_bg_opacity": this.selectedMapPref.text_bg_opacity,
          "background-color": "rgb(255,255,255)",
          "background-image": "",
          "background-fit": "contain"
        },
        position: newNodePosition
      }
    };
    this.store.dispatch(addNewNode({ node: jsonData }));
    this.isAddNode = false;
    this._enableMapEditButtons();
  }

  private _openAddUpdatePGDialog(genData: any, newNodeData: any, newNodePosition: any) {
    const dialogData = {
      mode: 'add',
      projectId: this.projectId,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newNodeData,
      newNodePosition,
    }
    const dialogRef = this.dialog.open(AddUpdatePGDialogComponent, {
      disableClose: true,
      width: '600px',
      data: dialogData,
      panelClass: 'custom-node-form-modal'
    });
    dialogRef.afterClosed().subscribe((_data: any) => {
      if (this.isAddPublicPG) this.isAddPublicPG = false;
      if (this.isAddPrivatePG) this.isAddPrivatePG = false;
      this._enableMapEditButtons();
    });
  }

  private _addNewPortGroup(genData: any, newNodeData: any, newNodePosition: any) {
    const jsonData: PortGroupAddModel = {
      name: genData.name,
      vlan: genData.vlan,
      category: genData.category,
      domain_id: genData.domain_id,
      subnet_allocation: genData.subnet_allocation,
      subnet: genData.subnet,
      project_id: Number(this.projectId),
      logical_map: {
        "map_style": {
          "height": this.selectedMapPref.port_group_size,
          "width": this.selectedMapPref.port_group_size,
          "color": this.selectedMapPref.port_group_color,
          "text_size": this.selectedMapPref.text_size,
          "text_color": this.selectedMapPref.text_color,
          "text_halign": this.selectedMapPref.text_halign,
          "text_valign": this.selectedMapPref.text_valign,
          "text_outline_color": this.selectedMapPref.text_outline_color,
          "text_outline_width": this.selectedMapPref.text_outline_width,
          "text_bg_color": this.selectedMapPref.text_bg_color,
          "text_bg_opacity": this.selectedMapPref.text_bg_opacity,
        },
        "position": newNodePosition
      }
    };
    this.store.dispatch(addNewPG({ portGroup: jsonData, message: 'Quick add port group successfully!' }));
    if (this.isAddPublicPG) this.isAddPublicPG = false;
    if (this.isAddPrivatePG) this.isAddPrivatePG = false;
    this._enableMapEditButtons();
  }

  private _openAddUpdateInterfaceDialog(genData: any, newEdgeData: any) {
    const dialogData = {
      mode: 'add',
      projectId: this.projectId,
      portGroups: this.portGroups,
      gateways: this.gateways,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newEdgeData
    }
    const dialogRef = this.dialog.open(AddUpdateInterfaceDialogComponent, { disableClose: true, width: '650px', data: dialogData, autoFocus: false });
    dialogRef.afterClosed().subscribe((_data: any) => {
      this.cy.unbind('mousemove');
      this.inv.remove();
      this.e.remove();
      this.inv = null;
      this.edgePortGroup = null;
      this.edgeNode = null;
      this.isAddEdge = false;
      this._enableMapEditButtons();
    });
  }

  private _quickAddInterfaceLinkProject(genData: any) {
    const nodeData = this.cy.getElementById(`project-link-${genData.node_id}`).data();
    const jsonData = {
      order: genData.order,
      name: genData.name,
      description: genData.description,
      category: genData.category,
      direction: genData.direction,
      mac_address: genData.mac_address,
      port_group_id: genData.port_group_id,
      ip_allocation: genData.ip_allocation,
      ip: genData.ip,
      dns_server: genData.dns_server,
      gateway: genData.gateway,
      is_gateway: genData.is_gateway,
      is_nat: genData.is_nat,
      map_link_id: nodeData.map_link_id,
      netmask_id: genData.netmask_id,
      logical_map: {
        "map_style": {
          'width': '4',
          'color': '#000000',
          'text_size': '25',
          'text_color': '#000000',
          'text_halign': 'center',
          'text_valign': 'bottom',
          'text_bg_color': '#000000',
          'text_bg_opacity': 0,
          'line-style': 'dotted'
        }
      },
      project_id: this.projectId
    }
    this.store.dispatch(addInterfaceMapLinkToPG({ edge: jsonData }));
    this._unQueueLinkProject();
  }

  private _unQueueLinkProject() {
    this.clearSearch();
    this.cy.unbind('mousemove');
    this.inv.remove();
    this.e.remove();
    this.inv = null;
    this.edgePortGroup = null;
    this.edgeNode = null;
    this.isAddEdge = false;
    this._enableMapEditButtons();
  }

  private _openConnectInterfaceToPGDialog(genData: any, newEdgeData: any) {
    const dialogData = {
      mode: 'connect',
      projectId: this.projectId,
      portGroups: this.portGroups,
      gateways: this.gateways,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newEdgeData,
      mapCategory: this.mapCategory
    }
    const dialogRef = this.dialog.open(AddUpdateInterfaceDialogComponent,
      { disableClose: true, width: '800px', data: dialogData, autoFocus: false, panelClass: 'custom-node-form-modal' });
    dialogRef.afterClosed().subscribe(() => {
      this.cy.unbind('mousemove');
      this.inv.remove();
      this.e.remove();
      this.inv = null;
      this.edgeNode = null;
      this.isConnectToPG = false;
      this.store.dispatch(retrievedIsInterfaceConnectPG({ isInterfaceConnectPG: false }));
      this.isConnectToNode = false;
      this.store.dispatch(retrievedInterfacePkConnectNode({ interfacePkConnectNode: undefined }));
    });
  }

  private _addNewEdge($event: any) {
    if (this.isAddEdge) {
      this.cy.unbind('mousemove');
      let targ: any;
      if (this.edgePortGroup) {
        this.edgeNode = $event.target;
        targ = this.edgeNode.data().id;
      } else {
        this.edgePortGroup = $event.target;
        targ = this.edgePortGroup.data().id;
      }
      this.e.move({ target: targ });
      this.newEdgeData.target = targ;
      if (this.edgeNode.data('elem_category') != 'map_link') {
        this.interfaceService.genData(this.edgeNode.data().node_id, this.edgePortGroup.data().pg_id)
          .subscribe(genData => {
            this._openAddUpdateInterfaceDialog(genData, this.newEdgeData);
          });
      } else {
        this.interfaceService.genData(this.edgeNode.data('map_link_id'), this.edgePortGroup.data('pg_id'), 'link')
          .subscribe(genData => {
            this._quickAddInterfaceLinkProject(genData)
          })
      }
    } else if (this.isAddTunnel) {
      this.cy.unbind('mousemove');
      this.isDisableCancel = false;
      this.e.move({ target: $event.target.data().id });
      this.inv.remove();
      this.inv = null;
      this.edgeNode = null;
      this.isDisableCancel = true;
      this.isAddTunnel = false;
    }
  }

  private _connectEdgeToPG($event: any) {
    if (this.isConnectToPG) {
      this.cy.unbind('mousemove');
      const portGroupData = $event.target.data();
      if (portGroupData.elem_category === 'port_group') {
        let targ = portGroupData.id;
        this.e.move({ target: targ });
        this.newEdgeData.target = targ;
        const genData = {
          node_id: this.edgeNode.data().node_id,
          node_name: this.edgeNode.data().name,
          port_group_id: portGroupData.pg_id,
          port_group_name: portGroupData.name
        }
        this._openConnectInterfaceToPGDialog(genData, this.newEdgeData);
      } else {
        this._unqueueEdge();
        this.toastr.warning('Please select a port group to connect', 'Warning');
      }
    }
  }

  private _connectEdgeToNode($event: any) {
    if (this.isConnectToNode) {
      this.cy.unbind('mousemove');
      const nodeData = $event.target.data();
      if (nodeData.elem_category === 'node') {
        let targ = nodeData.id;
        this.e.move({ target: targ });
        this.newEdgeData.target = targ;
        const dialogData = {
          mode: 'connect_node',
          projectId: this.projectId,
          selectedMapPref: this.selectedMapPref,
          cy: this.cy,
          newEdgeData: this.newEdgeData,
          mapCategory: this.mapCategory,
          nameTargetNode: nodeData.name,
          nameSourceNode: this.edgeNode.data().name
        }
        this.interfaceService.getByNode(nodeData.node_id).subscribe(response => {
          this.store.dispatch(retrievedInterfacesByDestinationNode({ interfacesByDestinationNode: response.result }));
          const dialogRef = this.dialog.open(ConnectInterfaceDialogComponent, { disableClose: true, width: '1000px', data: dialogData, autoFocus: false, panelClass: 'custom-connect-interfaces-form-modal' })
          dialogRef.afterClosed().subscribe((_data: any) => {
            this.cy.unbind('mousemove');
            this.inv.remove();
            this.e.remove();
            this.inv = null;
            this.edgeNode = null;
            this.isConnectToNode = false;
            this.store.dispatch(retrievedInterfacePkConnectNode({ interfacePkConnectNode: undefined }));
          });
        })
      } else {
        this._unqueueEdge();
        this.toastr.warning('Please select a node to connect', 'Warning');
      }
    }
  }

  queueEdge(target: any, position: any, category: string) {
    const data = target.data();
    if (data.elem_category === 'port_group') {
      this.edgePortGroup = target;
    } else {
      this.edgeNode = target;
    }
    const invisNode = {
      group: "nodes",
      data: {
        id: "tempNode" + this.helpersService.createUUID(),
        temp: true,
        name: "",
        height: "1px",
        width: "1px",
        zIndex: 10,
      },
      selectable: false,
      position,
    }
    this.inv = this.cy.add(invisNode)[0];
    this.inv.style({ 'zIndex': 10 });
    this.newEdgeData = {
      source: data.id,
      target: invisNode.data.id,
      id: 'new_edge_' + this.helpersService.createUUID(),
      name: "",
      category,
      direction: "both",
      curve_style: 'bezier',
      color: this.selectedMapPref.edge_color,
      width: this.selectedMapPref.edge_width + "px",
    }
    this.e = this.helpersService.addCYEdge(this.newEdgeData)[0];
    if (category == "tunnel") {
      this.isAddTunnel = true
    } else if (this.isInterfaceConnectPG) {
      this.isConnectToPG = true;
    } else if (this.interfacePkConnectNode) {
      this.isConnectToNode = true;
    } else {
      this.isAddEdge = true;
    }
    this.cy.bind('mousemove', (event: any) => {
      this.inv.position(event.position);
    });
  }

  private _unqueueEdge() {
    this.cy.unbind('mousemove');
    this.e.remove()
    this.inv.remove()
    this.edgeNode = null;
    this.edgePortGroup = null;
    this.isAddEdge = false;
    this.isAddTunnel = false;
    this.isConnectToPG = false;
    this.store.dispatch(retrievedIsInterfaceConnectPG({ isInterfaceConnectPG: false }));
    this.isConnectToNode = false;
    this.store.dispatch(retrievedInterfacePkConnectNode({ interfacePkConnectNode: undefined }));
  }

  searchMap(searchText: string) {
    searchText = searchText.trim();
    if (searchText) {
      const jsonData = {
        operator: 'contains',
        value: searchText
      }
      this.searchService.search(jsonData, this.projectId).subscribe(respData => {
        const nodes = respData.nodes
        const pgs = respData.port_groups
        const interfaces = respData.interfaces
        if (nodes.length >= 0) {
          this.cy.nodes().filter('[node_id]').forEach((ele: any) => {
            if (!(nodes.includes(ele.data('node_id')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
        if (interfaces.length >= 0) {
          this.cy.edges().filter('[interface_pk]').forEach((ele: any) => {
            if (!(interfaces.includes(ele.data('interface_pk')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
        if (pgs.length >= 0) {
          this.cy.nodes().filter('[pg_id]').forEach((ele: any) => {
            if (!(pgs.includes(ele.data('pg_id')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
      });
    } else {
      this.clearSearch();
    }
  }

  clearSearch() {
    if (this.cy) {
      this.cy.nodes().forEach((ele: any) => {
        if (ele.data('label') != 'group_box') {
          ele.style('opacity', 1.0);
          ele.unselect();
        }
      })
      this.cy.edges().forEach((ele: any) => {
        ele.style('opacity', 1.0);
        ele.unselect();
      })
    }
  }

  openDashboard() {
    this.router.navigate([RouteSegments.DASHBOARD]);
  }

  switchMap($event: MatButtonToggleChange) {
    this.mapCategory = $event.value
    this.store.dispatch(unSelectAllElementsOnMap());
    this.store.dispatch(mapDestroySuccess());
    this.store.dispatch(retrievedMapCategory({ mapCategory : this.mapCategory}));
    this.store.dispatch(loadMap({ projectId: this.projectId, mapCategory: this.mapCategory }));
  }

  addTemplateIntoCurrentProject(projectTemplateId: Number, layoutOnly: Boolean, newPosition: any) {
    const projectId = this.projectService.getProjectId();
    const jsonData = {
      project_id: projectId,
      template_id: projectTemplateId,
      layout_only: layoutOnly,
      category: 'logical'
    }
    this.store.dispatch(addTemplateIntoProject({ data: jsonData, newPosition, mapCategory: this.mapCategory }));
    this.isAddProjectTemplate = false;
    this.projectTemplateId = 0;
    this._enableMapEditButtons();
  }

  addProjectNode(linkProjectId: number, projectId: any, newNodePosition: any) {
    this.projectService.get(linkProjectId).subscribe(linkProjectResponse => {
      const linkProject = linkProjectResponse.result;
      const jsonData = {
        name: linkProject.name,
        linked_project_id: linkProjectId,
        project_id: projectId,
        logical_map: {
          map_style: {
            height: '70',
            width: '70',
            text_size: '25',
            text_color: '#000000',
            text_halign: 'center',
            text_valign: 'bottom',
            text_bg_color: '#000000',
            text_bg_opacity: 0,
            'background-color': 'rgb(255,255,255)',
            'background-image': '',
            'background-fit': 'contain',
            collapsed: true
          },
          locked: false,
          position: newNodePosition,
        },
      };
      this.store.dispatch(addNewMapLink({ mapLink: jsonData }))
      this._enableMapEditButtons();
      this.isAddProjectNode = false;
      this.linkProjectId = 0;
    })
  }

  addImage(width: any, height: any, url: any, projectId: any, newNodePosition: any) {
    const jsonData = {
      name: this.helpersService.createUUID(),
      project_id: projectId,
      image_id: this.mapImage.id,
      logical_map: {
        map_style: {
          height: height !== 0 ? height : 100,
          width: width !== 0 ? width : 100,
          text_size: '25',
          text_color: '#000000',
          text_halign: 'center',
          text_valign: 'bottom',
          text_bg_color: '#000000',
          src: url,
          zIndex: 998,
          text_bg_opacity: 0,
          label: "map_background",
          elem_category: "bg_image",
          'background-fit': 'contain',
          "scale_image": 100,
          original_width: width !== 0 ? width : 100,
          original_height: height !== 0 ? height : 100,
        },
        locked: false,
        position: newNodePosition,
      },
      physical_map: {
        map_style: {
          height: height !== 0 ? height : 100,
          width: width !== 0 ? width : 100,
          text_size: '25',
          text_color: '#000000',
          text_halign: 'center',
          text_valign: 'bottom',
          text_bg_color: '#000000',
          src: url,
          zIndex: 998,
          text_bg_opacity: 0,
          label: "map_background",
          elem_category: "bg_image",
          'background-fit': 'contain',
          "scale_image": 100,
          original_width: width !== 0 ? width : 100,
          original_height: height !== 0 ? height : 100,
        },
        locked: false,
        position: newNodePosition,
      }
    }
    this.store.dispatch(addNewMapImage({ mapImage: jsonData, mapCategory: this.mapCategory }))
    this.isAddMapImage = false;
    this._enableMapEditButtons();
  }

  private updateGroups(data: any) {
    if (data.elem_category === 'port_group') {
      this.store.dispatch(updatePG({
        id: data.pg_id,
        data: { domain_id: data.domain_id, is_add_log: false }
      }));
      this.store.dispatch(loadGroups({ projectId: this.projectId }));
      this.helpersService.reloadGroupBoxes();
    } else if (data.elem_category === 'node') {
      this.store.dispatch(updateNode({
        id: data.node_id,
        data: { domain_id: data.domain_id, is_add_log: false }
      }));
      this.store.dispatch(loadGroups({ projectId: this.projectId }));
      this.helpersService.reloadGroupBoxes();
    }
  }
}
