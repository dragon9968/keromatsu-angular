import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { Store } from '@ngrx/store';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorMessages } from 'src/app/shared/enums/error-messages.enum';
import { retrievedMapEdit } from 'src/app/store/map-edit/map-edit.actions';
import { selectDevices } from 'src/app/store/device/device.selectors';
import { selectTemplates } from 'src/app/store/template/template.selectors';
import { Observable, Subscription } from 'rxjs';
import { selectMapOption } from 'src/app/store/map-option/map-option.selectors';
import { ICON_PATH } from 'src/app/shared/contants/icon-path.constant';
import { autoCompleteValidator } from 'src/app/shared/validations/auto-complete.validation';
import { selectImages, selectSelectedMapImages } from 'src/app/store/map-image/map-image.selectors';
import { selectMapPref } from 'src/app/store/map-style/map-style.selectors';
import { MatDialog } from "@angular/material/dialog";
import { ProjectService } from "../../../project/services/project.service";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { RouteSegments } from "../../../core/enums/route-segments.enum";
import {
  selectActiveTemplates,
  selectProjectsNotLinkYet,
} from "../../../store/project/project.selectors";
import { AuthService } from "../../../core/services/auth/auth.service";
import { selectSelectedLogicalNodes } from 'src/app/store/node/node.selectors';
import { selectSelectedPortGroups } from 'src/app/store/portgroup/portgroup.selectors';
import { loadProjects } from 'src/app/store/project/project.actions';

@Component({
  selector: 'app-tool-panel-edit',
  templateUrl: './tool-panel-edit.component.html',
  styleUrls: ['./tool-panel-edit.component.scss']
})
export class ToolPanelEditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cy: any;
  @Input() config: any;
  @Input() isDisableAddNode = true;
  @Input() isDisableAddPG = false;
  @Input() isDisableAddImage = true;
  @Input() isDisableAddProjectTemplate = true;
  @Input() isDisableNewFromSelected = true;
  @Input() isDisableLinkProject = true;
  @Input() isTemplateCategory = false;
  @Input() isAddNode = false;
  @Input() isAddPublicPG = false;
  @Input() isAddPrivatePG = false;
  @Input() isAddMapImage = false;
  @Input() isAddProjectNode = false;
  @Input() isAddProjectTemplate = false;
  @Input() mapCategory: any;
  status = 'active';
  category = 'template';
  nodeAddForm!: FormGroup;
  mapImageForm!: FormGroup;
  addTemplateForm: FormGroup;
  linkProjectForm!: FormGroup;
  isCustomizePG = true;
  isDisableCustomizePG = false;
  errorMessages = ErrorMessages;
  selectDevices$ = new Subscription();
  selectTemplates$ = new Subscription();
  selectImages$ = new Subscription();
  selectMapOption$ = new Subscription();
  selectMapPref$ = new Subscription();
  selectProjectsNotLinkYet$ = new Subscription();
  selectActiveTemplates$ = new Subscription();
  selectSelectedLogicalNodes$ = new Subscription();
  selectSelectedMapImages$ = new Subscription();
  selectSelectedPortGroups$ = new Subscription();
  selectedNodes: any[] = [];
  selectedPGs: any[] = [];
  selectedMapImages: any[] = [];
  devices!: any[];
  templates!: any[];
  mapImages!: any[];
  projectsNotLinkYet: any[] = [];
  projectTemplates: any[] = [];
  filteredTemplatesByDevice!: any[];
  isGroupBoxesChecked!: boolean;
  ICON_PATH = ICON_PATH;
  selectedMapPref: any;
  filteredDevices!: Observable<any[]>;
  filteredTemplates!: Observable<any[]>;
  filteredMapImages!: Observable<any[]>;
  filteredProjectTemplates!: Observable<any[]>;
  filteredProjectsNotLinkYet!: Observable<any[]>;

  constructor(
    private store: Store,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService,
    public helpers: HelpersService,
    private authService: AuthService,
    private projectService: ProjectService
  ) {
    this.nodeAddForm = new FormGroup({
      deviceCtr: new FormControl(''),
      templateCtr: new FormControl(''),
      isCustomizeNodeCtr: new FormControl(true)
    });
    this.mapImageForm = new FormGroup({
      mapImageCtr: new FormControl(''),
    })
    this.addTemplateForm = new FormGroup({
      projectTemplateCtr: new FormControl(''),
      isLayoutOnlyCtr: new FormControl(''),
    })
    this.linkProjectForm = new FormGroup({
      linkProjectCtr: new FormControl('')
    })
    this.selectDevices$ = this.store.select(selectDevices).subscribe((devices: any) => {
      if (devices) {
        this.devices = devices;
        this.deviceCtr?.setValidators([autoCompleteValidator(this.devices)]);
        this.filteredDevices = this.helpers.filterOptions(this.deviceCtr, this.devices);
      }
    });
    this.selectTemplates$ = this.store.select(selectTemplates).subscribe((templates: any) => {
      if (templates) {
        this.templates = templates;
        this.templateCtr?.setValidators([autoCompleteValidator(this.templates, 'display_name')]);
        this.filteredTemplatesByDevice = templates
        this.filteredTemplates = this.helpers.filterOptions(this.templateCtr, this.filteredTemplatesByDevice, 'display_name');
      }
    });
    this.selectImages$ = this.store.select(selectImages).subscribe((images: any) => {
      if (images) {
        this.mapImages = images;
        this.mapImageCtr?.setValidators([autoCompleteValidator(this.mapImages)]);
        this.filteredMapImages = this.helpers.filterOptions(this.mapImageCtr, this.mapImages);
      }
    });
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe((mapOption: any) => {
      if (mapOption) {
        this.isGroupBoxesChecked = mapOption.isGroupBoxesChecked;
      }
    });
    this.selectMapPref$ = this.store.select(selectMapPref).subscribe((selectedMapPref: any) => {
      this.selectedMapPref = selectedMapPref;
    });
    this.selectActiveTemplates$ = this.store.select(selectActiveTemplates).subscribe(projectTemplates => {
      if (projectTemplates != undefined) {
        this.projectTemplates = projectTemplates;
        this.projectTemplateCtr.setValidators([autoCompleteValidator(this.projectTemplates)]);
        this.filteredProjectTemplates = this.helpers.filterOptions(this.projectTemplateCtr, this.projectTemplates)
      }
    });
    this.selectProjectsNotLinkYet$ = this.store.select(selectProjectsNotLinkYet).subscribe(projectsNotLinkYet => {
      if (projectsNotLinkYet) {
        let projectsNotIncludeCurrentProject: any[];
        const projectId = this.projectService.getProjectId();
        projectsNotIncludeCurrentProject = projectsNotLinkYet.filter(project => project.id !== Number(projectId));
        this.projectService.getShareProject(this.status, 'project').subscribe((resp: any) => {
          const shareProject = resp.result;
          if (shareProject.length > 0) {
            this.projectsNotLinkYet = [...projectsNotIncludeCurrentProject, ...shareProject];
          } else {
            this.projectsNotLinkYet = projectsNotIncludeCurrentProject;
          }
          this.linkProjectCtr.setValidators([autoCompleteValidator(this.projectsNotLinkYet)]);
          this.filteredProjectsNotLinkYet = this.helpers.filterOptions(this.linkProjectCtr, this.projectsNotLinkYet);
        })
      }
    });
    this.selectSelectedLogicalNodes$ = this.store.select(selectSelectedLogicalNodes).subscribe(selectedNodes => {
      if (selectedNodes) {
        this.selectedNodes = selectedNodes;
      }
    });
    this.selectSelectedPortGroups$ = this.store.select(selectSelectedPortGroups).subscribe(selectedPGs => {
      if (selectedPGs) {
        this.selectedPGs = selectedPGs;
      }
    });
    this.selectSelectedMapImages$ = this.store.select(selectSelectedMapImages).subscribe(selectedMapImages => {
      if (selectedMapImages) {
        this.selectedMapImages = selectedMapImages;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isAddNode || this.isAddPrivatePG || this.isAddPublicPG || this.isAddMapImage
      || this.isAddProjectNode || this.isAddProjectTemplate) {
      this.isCustomizeNodeCtr?.disable();
      this.deviceCtr?.disable();
      this.templateCtr?.disable();
      this.isDisableCustomizePG = true;
      this.mapImageCtr?.disable();
      this.linkProjectCtr?.disable();
      this.projectTemplateCtr?.disable();
      this.isLayoutOnlyCtr?.disable();
    } else {
      this.isCustomizeNodeCtr?.enable();
      this.deviceCtr?.enable();
      this.templateCtr?.enable();
      this.isDisableCustomizePG = false;
      this.mapImageCtr?.setValue('');
      this.mapImageCtr?.enable();
      this.linkProjectCtr?.setValue('');
      this.linkProjectCtr?.enable();
      this.projectTemplateCtr?.setValue('');
      this.projectTemplateCtr?.enable();
      this.isLayoutOnlyCtr?.enable();
    }
  }


  get deviceCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('deviceCtr'), this.devices); }
  get templateCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('templateCtr'), this.templates); }
  get mapImageCtr() { return this.helpers.getAutoCompleteCtr(this.mapImageForm.get('mapImageCtr'), this.mapImages); }
  get isCustomizeNodeCtr() { return this.nodeAddForm.get('isCustomizeNodeCtr'); }
  get projectTemplateCtr() {
    return this.helpers.getAutoCompleteCtr(this.addTemplateForm.get('projectTemplateCtr'), this.projectTemplates);
  }
  get isLayoutOnlyCtr() { return this.addTemplateForm.get('isLayoutOnlyCtr'); }
  get linkProjectCtr() { return this.helpers.getAutoCompleteCtr(this.linkProjectForm.get('linkProjectCtr'), this.projectsNotLinkYet) };

  ngOnInit(): void {
    this.templateCtr?.disable();
    this.store.dispatch(loadProjects());
  }

  ngOnDestroy(): void {
    this.selectDevices$.unsubscribe();
    this.selectProjectsNotLinkYet$.unsubscribe();
    this.selectTemplates$.unsubscribe();
    this.selectMapOption$.unsubscribe();
    this.selectMapPref$.unsubscribe();
    this.selectActiveTemplates$.unsubscribe();
    this.selectImages$.unsubscribe();
  }

  disableTemplate(deviceId: string) {
    this.filteredTemplatesByDevice = this.templates.filter(template => template.device.id == deviceId);
    this.filteredTemplates = this.helpers.filterOptions(this.templateCtr, this.filteredTemplatesByDevice, 'display_name');
    this.templateCtr?.setValue('');
    this.isDisableAddNode = true;
    if (this.filteredTemplatesByDevice.length > 0) {
      this.templateCtr?.enable();
    } else {
      this.templateCtr?.disable();
    }
  }

  changeDevice() {
    this.disableTemplate(this.deviceCtr?.value.id);
  }

  selectDevice($event: MatAutocompleteSelectedEvent) {
    this.disableTemplate($event.option.value.id);
  }

  changeTemplate() {
    this.isDisableAddNode = false;
  }

  selectTemplate($event: MatAutocompleteSelectedEvent) {
    this.isDisableAddNode = false;
  }

  addNode() {
    this.isDisableAddNode = true;
    this.store.dispatch(retrievedMapEdit({
      data: {
        isAddNode: true,
        deviceId: this.deviceCtr?.value.id,
        templateId: this.templateCtr?.value.id,
        isCustomizeNode: this.isCustomizeNodeCtr?.value
      }
    }));
  }

  addPublicPG() {
    this.store.dispatch(retrievedMapEdit({
      data: {
        isAddPublicPG: true,
        isAddPrivatePG: false,
        isCustomizePG: this.isCustomizePG
      }
    }));
  }

  addPrivatePG() {
    this.store.dispatch(retrievedMapEdit({
      data: {
        isAddPublicPG: false,
        isAddPrivatePG: true,
        isCustomizePG: this.isCustomizePG
      }
    }));
  }

  selectMapImage() {
    this.isDisableAddImage = false;
  }

  addImage() {
    const mapImage = this.mapImages.filter(image => image.id === this.mapImageCtr.value.id)[0];
    const background = new Image();
    background.src = ICON_PATH + mapImage.photo;
    let width: any;
    let height: any;
    background.onload = () => {
      width = background.width;
      height = background.height;
      this.isDisableAddImage = true;
      this.store.dispatch(retrievedMapEdit({
        data: {
          isAddMapImage: true,
          imageWidth: width,
          imageHeight: height,
          imageUrl: background.src,
          mapImage: mapImage,
        }
      }));
    };
  }

  selectProjectTemplate() {
    this.isDisableAddProjectTemplate = false;
  }

  addTemplate() {
    this.isDisableAddProjectTemplate = true;
    this.store.dispatch(retrievedMapEdit({
      data: {
        isAddTemplateProject: true,
        isLayoutOnly: this.isLayoutOnlyCtr?.value != '',
        projectTemplateId: this.projectTemplateCtr?.value?.id
      }
    }));
  }

  selectProject() {
    this.isDisableLinkProject = false;
  }

  addProjectNode() {
    const linkProjectId = this.linkProjectCtr?.value?.id;
    if (linkProjectId > 0) {
      this.isDisableLinkProject = true;
      this.store.dispatch(retrievedMapEdit({
        data: {
          isAddProjectNode: true,
          linkProjectId: linkProjectId
        }
      }));
    } else {
      this.toastr.warning('Please select a project to link!', 'Warning')
    }
  }

  addNewProjectFromSelected() {
    const nodeIds = this.selectedNodes.map(node => node.id);
    const portGroupIds = this.selectedPGs.map(pg => pg.id);
    const mapImageIds = this.selectedMapImages.map(m => m.id);
    if (nodeIds.length > 0 || portGroupIds.length > 0 || mapImageIds.length > 0) {
      const nodeDomains = this.selectedNodes.filter(node => node.domain_id && node.domain_id !== null)
      const nodeDomainIds = nodeIds.length > 0 ? nodeDomains.map(node => node.domain_id) : [];

      const portGroupDomains = this.selectedPGs.filter(pg => pg.domain_id && pg.domain_id !== null)
      const portGroupDomainIds = portGroupIds.length > 0 ? portGroupDomains.map(pg => pg.domain_id) : [];

      const mapImageDomains = this.selectedMapImages.filter(mi => mi.domain_id && mi.domain_id !== null)
      const mapImageDomainIds = mapImageIds.length > 0 ? mapImageDomains.map(mi => mi.domain_id) : [];

      const domainIds = [...new Set([...nodeDomainIds, ...portGroupDomainIds, ...mapImageDomainIds])];
      const jsonData = {
        option: 'clone',
        node_ids: nodeIds,
        port_group_ids: portGroupIds,
        domain_ids: domainIds,
        map_image_ids: mapImageIds
      };
      this.router.navigate([RouteSegments.ADD_PROJECT], { state: jsonData });
    } else {
      this.toastr.warning('Please select node(s), port group(s) to clone into new a project', 'Warning');
    }
  }
}
