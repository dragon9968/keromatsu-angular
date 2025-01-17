import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconRegistry } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { MapPrefService } from 'src/app/core/services/map-pref/map-pref.service';
import { retrievedMapPref } from 'src/app/store/map-style/map-style.actions';
import { CommonService } from 'src/app/map/context-menu/cm-common-service/common.service';
import { selectMapPref } from 'src/app/store/map-style/map-style.selectors';
import { ToastrService } from 'ngx-toastr';
import { CMGroupBoxService } from '../../context-menu/cm-groupbox/cm-groupbox.service';
import { CMLockUnlockService } from '../../context-menu/cm-lock-unlock/cm-lock-unlock.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ErrorMessages } from "../../../shared/enums/error-messages.enum";
import { selectMapOption } from "../../../store/map-option/map-option.selectors";
import { selectSelectedLogicalNodes, selectSelectedPhysicalNodes } from 'src/app/store/node/node.selectors';
import { selectSelectedLogicalInterfaces, selectSelectedPhysicalInterfaces } from 'src/app/store/interface/interface.selectors';
import { selectSelectedPortGroups } from 'src/app/store/portgroup/portgroup.selectors';
import { selectSelectedMapImages } from 'src/app/store/map-image/map-image.selectors';
import { selectGroups } from 'src/app/store/group/group.selectors';
import { selectSelectedMapLinks } from 'src/app/store/map-link/map-link.selectors';
import { selectDefaultPreferences } from 'src/app/store/project/project.selectors';

@Component({
  selector: 'app-tool-panel-style',
  templateUrl: './tool-panel-style.component.html',
  styleUrls: ['./tool-panel-style.component.scss']
})
export class ToolPanelStyleComponent implements OnInit, OnDestroy {
  @Input() cy: any;
  @Input() ur: any;
  @Input() config: any;
  @Input() mapCategory: any;
  errorMessages = ErrorMessages;
  mapPrefCtr = new FormControl();
  mapPrefs!: any[];
  nodeSize = 70;
  mapImageSize: any;
  edgeColor = '#000000';
  edgeSize = 2;
  arrowSize = 3;
  pgColor = '#0000FF';
  pgSize = 20;
  gbColor = '#00DCFF';
  gbOpacity = 0.0;
  gbOpacityLabel = 0;
  gbBorderSize = 0;
  gbBorderSizeLabel = 0;
  textOutlineWidth = 3;
  textOutlineWidthLabel = 3;
  gbBorderColor = '#CCCCCC';
  textSize = 25;
  textColor = '#000000';
  textBGColor = '#000000';
  textOutlineColor = '#fff000';
  textBGOpacity = 0.0;
  textBGOpacityLabel = 0;
  selectDefaultPreferences$ = new Subscription();
  selectMapPref$ = new Subscription();
  isEdgeDirectionChecked = false;
  isGroupBoxesChecked = false;
  selectMapOption$ = new Subscription();
  isHideNode: boolean = true;
  isHidePGs: boolean = true;
  isHideText: boolean = true;
  isHideEdge: boolean = true;
  isHideGBs: boolean = true;
  isHideMBs: boolean = true;
  isHideIndex: boolean = true;
  vAlignSelect!: string;
  hAlignSelect!: string;
  arrowActivated?: string;
  gbBorderTypeActivated?: string;
  selectedMapPref: any;
  positionForm!: FormGroup;
  selectMapSelection$ = new Subscription();
  selectLogicalInterfaces$ = new Subscription();
  selectPortGroups$ = new Subscription();
  selectLogicalNodes$ = new Subscription();
  selectPhysicalNodes$ = new Subscription();
  selectMapImages$ = new Subscription();
  selectGroups$ = new Subscription();
  selectMapLinks$ = new Subscription();
  selectSelectedPhysicalInterfaces$ = new Subscription();
  filteredMapPrefs!: Observable<any[]>;
  selectedNodes: any[] = [];
  selectedLogicalNodes: any[] = [];
  selectedPhysicalNodes: any[] = [];
  selectedInterfaces: any[] = [];
  selectedLogicalInterfaces: any[] = [];
  selectedPhysicalInterfaces: any[] = [];
  selectedPortGroups: any[] = [];
  selectedMapImages: any[] = [];
  selectedGroups: any[] = [];
  selectedMapLinks: any[] = [];

  constructor(
    private mapPrefService: MapPrefService,
    private store: Store,
    public helpers: HelpersService,
    private commonService: CommonService,
    iconRegistry: MatIconRegistry,
    private toastr: ToastrService,
    private cmGroupBoxService: CMGroupBoxService,
    private cmLockUnlockService: CMLockUnlockService,
  ) {
    iconRegistry.addSvgIcon('dashed', this.helpers.setIconPath('/assets/icons/dashed.svg'));
    iconRegistry.addSvgIcon('double', this.helpers.setIconPath('/assets/icons/double.svg'));
    this.selectDefaultPreferences$ = this.store.select(selectDefaultPreferences).subscribe(defaultPref => {
      if (defaultPref) {
        this.mapPrefService.get(defaultPref.default_map_pref_id).subscribe(data => {
          this.mapPrefCtr.setValue({
            id: data.result.id,
            name: data.result.name
          });
          this.store.dispatch(retrievedMapPref({ data: data.result }));
        });
      }
    });
    this.selectMapPref$ = this.store.select(selectMapPref).subscribe((selectedMapPref: any) => {
      this.selectedMapPref = selectedMapPref;
    });
    this.selectLogicalNodes$ = this.store.select(selectSelectedLogicalNodes).subscribe(selectedLogicalNodes => {
      if (selectedLogicalNodes && this.mapCategory === 'logical') {
        this.selectedLogicalNodes = selectedLogicalNodes
        this.isHideNode = this.selectedLogicalNodes.length == 0;
        this.isHideText = this.selectedLogicalNodes.length + this.selectedInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedLogicalNodes.length + this.selectedPortGroups.length + this.selectedInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
        if (this.selectedLogicalNodes.length >= 1) {
          const ele = this.cy.getElementById(this.selectedLogicalNodes[0].data.id);
          if (ele.length > 0) {
            const data = ele.data();
            this.nodeSize = this.removePx(data.height);
            this.xCtr?.setValue(ele.position().x.toFixed(2));
            this.yCtr?.setValue(ele.position().y.toFixed(2));
            this.textOutlineColor = data.text_outline_color ? data.text_outline_color : data.logical_map.map_style.text_outline_color;
            this.textOutlineWidth = this.removePx(data.text_outline_width ? data.text_outline_width : data.logical_map.map_style.text_outline_width);
            this._setPropertiesCommon(data);
          }
        }
      }
    });
    this.selectPhysicalNodes$ = this.store.select(selectSelectedPhysicalNodes).subscribe(selectedPhysicalNodes => {
      if (selectedPhysicalNodes && this.mapCategory === 'physical') {
        this.selectedPhysicalNodes = selectedPhysicalNodes
        this.isHideNode = this.selectedPhysicalNodes.length == 0;
        this.isHideText = this.selectedPhysicalNodes.length + this.selectedInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedPhysicalNodes.length + this.selectedPortGroups.length + this.selectedInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
        if (this.selectedPhysicalNodes.length >= 1) {
          const ele = this.cy.getElementById(this.selectedPhysicalNodes[0].data.id);
          if (ele.length > 0) {
            const data = ele.data();
            this.nodeSize = this.removePx(data.height);
            this.xCtr?.setValue(ele.position().x.toFixed(2));
            this.yCtr?.setValue(ele.position().y.toFixed(2));
            this.textOutlineColor = data.text_outline_color ? data.text_outline_color : data.physical_map.map_style.text_outline_color;
            this.textOutlineWidth = this.removePx(data.text_outline_width ? data.text_outline_width : data.physical_map.map_style.text_outline_width);
            this._setPropertiesCommon(data);
          }
        }
      }
    });
    this.selectLogicalInterfaces$ = this.store.select(selectSelectedLogicalInterfaces).subscribe(selectedLogicalInterfaces => {
      if (selectedLogicalInterfaces && this.mapCategory === 'logical') {
        this.selectedLogicalInterfaces = selectedLogicalInterfaces;
        this.isHideEdge = this.selectedLogicalInterfaces.length == 0;
        if (this.selectedLogicalInterfaces.length >= 1) {
          const ele = this.cy.getElementById(this.selectedLogicalInterfaces[0].data.id);
          const data = ele.data();
          this.edgeColor = data.color;
          this.edgeSize = this.removePx(data.width);
          this.arrowActivated = this.isEdgeDirectionChecked ? data.direction : data.prev_direction;
          this.arrowSize = data.arrow_scale ? this.removePx(data.arrow_scale) : 1;
          this.textOutlineColor = data.text_outline_color ? data.text_outline_color : data.logical_map.map_style.text_outline_color;
          this.textOutlineWidth = this.removePx(data.text_outline_width ? data.text_outline_width : data.logical_map.map_style.text_outline_width);
          this._setPropertiesCommon(data);
        }
        this._getSelectedNodeAndEdgeByMapCategory();
        this.isHideText = this.selectedNodes.length + this.selectedLogicalInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedNodes.length + this.selectedPortGroups.length + this.selectedLogicalInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
      }
    });
    this.selectSelectedPhysicalInterfaces$ = this.store.select(selectSelectedPhysicalInterfaces).subscribe(selectSelectedPhysicalInterfaces => {
      if (selectSelectedPhysicalInterfaces && this.mapCategory === 'physical') {
        this.selectedPhysicalInterfaces = selectSelectedPhysicalInterfaces;
        this.isHideEdge = this.selectedPhysicalInterfaces.length == 0;
        if (this.selectedPhysicalInterfaces.length >= 1) {
          const ele = this.cy.getElementById(this.selectedPhysicalInterfaces[0].data.id);
          const data = ele.data();
          this.edgeColor = data.color;
          this.edgeSize = this.removePx(data.width);
          this.arrowActivated = this.isEdgeDirectionChecked ? data.direction : data.prev_direction;
          this.arrowSize = data.arrow_scale ? this.removePx(data.arrow_scale) : 1;
          this.textOutlineColor = data?.text_outline_color ? data.text_outline_color : data.physical_map.map_style.text_outline_color;
          this.textOutlineWidth = data?.text_outline_width ? data.text_outline_width : data.physical_map.map_style.text_outline_width;
          this._setPropertiesCommon(data);
        }
        this._getSelectedNodeAndEdgeByMapCategory();
        this.isHideText = this.selectedNodes.length + this.selectedPhysicalInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedNodes.length + this.selectedPortGroups.length + this.selectedPhysicalInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
      }
    });
    this.selectPortGroups$ = this.store.select(selectSelectedPortGroups).subscribe(selectedPortGroups => {
      if (selectedPortGroups) {
        this.selectedPortGroups = selectedPortGroups;
        this.isHidePGs = this.selectedPortGroups.length == 0;
        this._getSelectedNodeAndEdgeByMapCategory();
        this.isHideText = this.selectedNodes.length + this.selectedInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedNodes.length + this.selectedPortGroups.length + this.selectedInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
        if (this.selectedPortGroups.length >= 1) {
          const ele = this.cy.getElementById(this.selectedPortGroups[0].data.id);
          const data = ele.data();
          this.pgColor = data.color;
          this.pgSize = this.removePx(data.height);
          this.xCtr?.setValue(ele.position().x.toFixed(2));
          this.yCtr?.setValue(ele.position().y.toFixed(2));
          this.textOutlineColor = data.text_outline_color ? data.text_outline_color : data.logical_map.map_style.text_outline_color;
          this.textOutlineWidth = this.removePx(data.text_outline_width ? data.text_outline_width : data.logical_map.map_style.text_outline_width);
          this._setPropertiesCommon(data);
        }
      }
    });
    this.selectMapImages$ = this.store.select(selectSelectedMapImages).subscribe(selectedMapImages => {
      if (selectedMapImages) {
        this.selectedMapImages = selectedMapImages;
        this.isHideMBs = this.selectedMapImages.length == 0;
        if (this.selectedMapImages.length >= 1) {
          const ele = this.cy.getElementById(this.selectedMapImages[0].data.id);
          const data = ele.data();
          this.xCtr?.setValue(ele.position().x.toFixed(2));
          this.yCtr?.setValue(ele.position().y.toFixed(2));
          this.mapImageSize = ele.data('scale_image')
          this._setPropertiesCommon(data);
        }
        this._getSelectedNodeAndEdgeByMapCategory();
        this.isHideIndex = this.selectedNodes.length + this.selectedPortGroups.length + this.selectedInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
      }
    });
    this.selectGroups$ = this.store.select(selectGroups).subscribe(groups => {
      if (groups && this.isGroupBoxesChecked) {
        this.selectedGroups = groups.filter((n: any) => n.isSelected);
        if (this.selectedGroups.length >= 1) {
          const ele = this.cy.getElementById(this.selectedGroups[0].data.id);
          const data = ele.data();
          this.gbColor = data.color;
          this.gbOpacity = data.group_opacity;
          this.gbOpacityLabel = this.gbOpacity ? Math.round(this.gbOpacity * 100) : 0;
          this.gbBorderSize = this.removePx(data.border_width);
          this.gbBorderSizeLabel = this.gbBorderSize ? this.gbBorderSize : 0;
          this.gbBorderColor = data.border_color;
          this.gbBorderTypeActivated = data.border_style;
          this.textColor = data.text_color;
        }
        this.isHideGBs = this.selectedGroups.length == 0;
        this._getSelectedNodeAndEdgeByMapCategory();
        this.isHideText = this.selectedNodes.length + this.selectedInterfaces.length + this.selectedPortGroups.length + this.selectedGroups.length == 0;
        this.isHideIndex = this.selectedNodes.length + this.selectedPortGroups.length + this.selectedInterfaces.length + this.selectedGroups.length + this.selectedMapImages.length == 0;
      }
    })
    this.selectMapLinks$ = this.store.select(selectSelectedMapLinks).subscribe(selectedMapLinks => {
      if (selectedMapLinks) {
        this.selectedMapLinks = selectedMapLinks;
      }
    })
    this.positionForm = new FormGroup({
      xCtr: new FormControl('', []),
      yCtr: new FormControl('', []),
    });
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe(mapOption => {
      if (mapOption) {
        this.isEdgeDirectionChecked = mapOption.isEdgeDirectionChecked
        this.isGroupBoxesChecked = mapOption.isGroupBoxesChecked
      }
    })
  }

  get xCtr() { return this.positionForm.get('xCtr'); }
  get yCtr() { return this.positionForm.get('yCtr'); }

  private _setPropertiesCommon(data: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textColor = data.text_color ? data.text_color : data.logical_map.map_style.text_color;
    this.textSize = this.removePx(data.text_size ? data.text_size : data.logical_map.map_style.text_size);
    this.textBGColor = data.text_bg_color ? data.text_bg_color : data.logical_map?.map_style?.text_bg_color;
    this.textBGOpacity = data.text_bg_opacity != undefined ? data.text_bg_opacity : data.logical_map?.map_style?.text_bg_opacity;
    this.textBGOpacityLabel = this.textBGOpacity ? Math.round(this.textBGOpacity * 100) : 0;
    this.vAlignSelect = data.text_valign ? data.text_valign : data.logical_map?.map_style?.text_valign;
    this.hAlignSelect = data.text_halign ? data.text_halign : data.logical_map?.map_style?.text_halign;
    this.textOutlineWidthLabel = this.textOutlineWidth ? this.textOutlineWidth : 0;
  }

  removePx(value: any) {
    return value ? (typeof value === 'number' && !isNaN(value) ? value : value.replace('px', '')) : value;
  }

  ngOnInit(): void {
    this.mapPrefService.getAll().subscribe(data => {
      this.mapPrefs = data.result;
      this.filteredMapPrefs = this.helpers.filterOptions(this.mapPrefCtr, this.mapPrefs);
    });
  }

  ngOnDestroy(): void {
    this.selectDefaultPreferences$.unsubscribe();
    this.selectMapOption$.unsubscribe();
    this.selectMapPref$.unsubscribe();
    this.selectMapSelection$.unsubscribe();
    this.selectLogicalNodes$.unsubscribe();
    this.selectLogicalInterfaces$.unsubscribe();
    this.selectPortGroups$.unsubscribe();
    this.selectMapImages$.unsubscribe();
    this.selectGroups$.unsubscribe();
    this.selectMapLinks$.unsubscribe();
    this.selectPhysicalNodes$.unsubscribe();
  }

  applyMapPref() {
    this._getSelectedNodeAndEdgeByMapCategory();
    const selectedEles = this.selectedNodes.concat(this.selectedPortGroups, this.selectedInterfaces, this.selectedGroups);
    const newTextColor = this.selectedMapPref.text_color;
    const newTextSize = this.selectedMapPref.text_size + 'px';
    const newTextBGColor = this.selectedMapPref.text_bg_color;
    const newTextBGOpacity = this.selectedMapPref.text_bg_opacity;
    const newTextHAlign = this.selectedMapPref.text_halign;
    const newTextVAlign = this.selectedMapPref.text_valign;
    const newNodeSize = this.selectedMapPref.node_size + 'px';
    const newPGSize = this.selectedMapPref.port_group_size + 'px';
    const newEdgeSize = this.selectedMapPref.edge_width + 'px';
    const newDirection = this.selectedMapPref.edge_arrow_direction;
    const newArrowScale = this.selectedMapPref.edge_arrow_size + 'px';
    const newPGColor = this.selectedMapPref.port_group_color;
    const newEdgeColor = this.selectedMapPref.edge_color;
    const newGBColor = this.selectedMapPref.group_box_color;
    const newGBOpacity = this.selectedMapPref.group_box_opacity;
    const newGBBorderType = this.selectedMapPref.group_box_border;
    const newGBBorderColor = this.selectedMapPref.group_box_border_color;
    const newGBBorderSize = this.selectedMapPref.group_box_border_size;
    const newMapImageSize = this.selectedMapPref.scale_image;
    const newTextOutlineColor = this.selectedMapPref.text_outline_color;
    const newTextOutlineWidth = this.selectedMapPref.text_outline_width;
    this.ur.do("changTextColor", { selectedEles, newTextColor, cy: this.cy });
    this.ur.do("changeTextSize", { selectedEles, newTextSize, cy: this.cy });
    this.ur.do("changeTextBGColor", { selectedEles, newTextBGColor, cy: this.cy });
    this.ur.do("changeTextBGOpacity", { selectedEles, newTextBGOpacity, cy: this.cy });
    this.ur.do("changeTextHAlign", { selectedEles, newTextHAlign, cy: this.cy });
    this.ur.do("changeTextVAlign", { selectedEles, newTextVAlign, cy: this.cy });
    this.ur.do("changeNodeSize", { selectedNodes: this.selectedNodes, newNodeSize, cy: this.cy });
    this.ur.do("changePGSize", { selectedPortGroups: this.selectedPortGroups, newPGSize, cy: this.cy });
    this.ur.do("changeEdgeSize", { selectedInterfaces: this.selectedInterfaces, newEdgeSize, cy: this.cy });
    this.ur.do("changeDirection", { selectedInterfaces: this.selectedInterfaces, newDirection, cy: this.cy });
    this.ur.do("changeArrowScale", { selectedInterfaces: this.selectedInterfaces, newArrowScale, cy: this.cy });
    this.ur.do("changePGColor", { selectedPortGroups: this.selectedPortGroups, newPGColor, cy: this.cy });
    this.ur.do("changeEdgeColor", { selectedInterfaces: this.selectedInterfaces, newEdgeColor, cy: this.cy });
    this.ur.do("changeGBColor", { selectedGroups: this.selectedGroups, newGBColor, cy: this.cy });
    this.ur.do("changeGBOpacity", { selectedGroups: this.selectedGroups, newGBOpacity, cy: this.cy });
    this.ur.do("changeGBType", { selectedGroups: this.selectedGroups, newGBBorderType, cy: this.cy });
    this.ur.do("changeGBBorderColor", { selectedGroups: this.selectedGroups, newGBBorderColor, cy: this.cy });
    this.ur.do("changeGBBorderSize", { selectedGroups: this.selectedGroups, newGBBorderSize, cy: this.cy });
    this.ur.do("changeMapImageSize", { selectedMapImages: this.selectedMapImages, newMapImageSize, cy: this.cy });
    this.ur.do("changeTextOutlineColor", { selectedEles, newTextOutlineColor, cy: this.cy });
    this.ur.do("changeTextOutlineWidth", { selectedEles, newTextOutlineWidth, cy: this.cy });
  }

  selectMapPref($event: MatAutocompleteSelectedEvent) {
    this.mapPrefService.get($event.option.value.id).subscribe(data => {
      this.store.dispatch(retrievedMapPref({ data: data.result }));
    });
  }

  setTextVAlign($event: MatButtonToggleChange) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.vAlignSelect = $event.value;
    this.commonService.textVAlign(this.vAlignSelect, this.selectedNodes, this.selectedPortGroups, this.cy);
  }

  setTextHAlign($event: MatButtonToggleChange) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.hAlignSelect = $event.value;
    this.commonService.textHAlign(this.hAlignSelect, this.selectedNodes, this.selectedPortGroups, this.cy);
  }

  setDirection($event: MatButtonToggleChange) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.commonService.edgeDirection($event.value, this.selectedInterfaces, this.cy);
  }

  setGBType($event: MatButtonToggleChange) {
    this.gbBorderTypeActivated = $event.value;
    this.commonService.gBType($event.value, this.selectedGroups, this.cy);
  }

  setNodeSize(size: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.nodeSize = size.value <= 100 ? size.value : 100;
    this.commonService.changeNodeSize(size, this.selectedNodes, this.cy);
  }

  setTextColor(color: string) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textColor = this.helpers.fullColorHex(color);
    this.commonService.textColor(color, this.selectedNodes, this.selectedPortGroups, this.selectedInterfaces, this.selectedGroups, this.cy);
  }

  setTextSize(size: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textSize = size.value <= 100 ? size.value : 100;
    this.commonService.textSize(size, this.selectedNodes, this.selectedInterfaces, this.selectedPortGroups, this.cy);
  }

  setTextBGOpacity(opacity: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textBGOpacity = opacity.value;
    this.textBGOpacityLabel = Math.round(this.textBGOpacity * 100);
    this.commonService.textBGOpacity(opacity, this.selectedNodes, this.selectedInterfaces, this.selectedPortGroups, this.cy);
  }

  setTextBGColor(color: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textBGColor = this.helpers.fullColorHex(color);
    this.commonService.textBGColor(color, this.selectedNodes, this.selectedInterfaces, this.selectedPortGroups, this.selectedGroups, this.cy);
  }

  setTextOutlineColor(color: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textOutlineColor = this.helpers.fullColorHex(color);
    this.commonService.textOutlineColor(color, this.selectedNodes, this.selectedInterfaces, this.selectedPortGroups, this.selectedGroups, this.cy);
  }

  setTextOutlineWidth(width: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.textOutlineWidth = width.value <= 10 ? width.value : 10;
    this.textOutlineWidthLabel = this.textOutlineWidth ? this.textOutlineWidth : 0;
    this.commonService.textOutlineWidth(width, this.selectedNodes, this.selectedInterfaces, this.selectedPortGroups, this.selectedGroups, this.cy);
  }

  setPGColor(color: string) {
    this.pgColor = this.helpers.fullColorHex(color);
    this.commonService.pgColor(color, this.selectedPortGroups, this.cy);
  }


  setPGSize(size: any) {
    this.pgSize = size.value <= 100 ? size.value : 100;
    this.commonService.pgSize(size, this.selectedPortGroups, this.cy);
  }

  setEdgeColor(color: string) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.edgeColor = this.helpers.fullColorHex(color);
    this.commonService.edgeColor(color, this.selectedInterfaces, this.cy);
  }

  setEdgeSize(size: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.edgeSize = size.value <= 100 ? size.value : 100;
    this.commonService.edgeSize(size, this.selectedInterfaces, this.cy);
  }

  setArrowScale(size: any) {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.arrowSize = size.value <= 200 ? size.value : 200;
    this.commonService.arrowScale(size, this.selectedInterfaces, this.cy);
  }

  setGBColor(newGbColor: string) {
    this.gbColor = this.helpers.fullColorHex(newGbColor);
    this.commonService.gBColor(newGbColor, this.selectedGroups, this.cy);
  }

  setGBOpacity(event: any) {
    this.gbOpacity = event.value;
    this.gbOpacityLabel = Math.round(event.value * 100);
    this.commonService.gbOpacity(event, this.selectedGroups, this.cy);
  }

  setGBBorderColor(newGbBorderColor: string) {
    this.gbBorderColor = this.helpers.fullColorHex(newGbBorderColor);
    this.commonService.gBBorderColor(newGbBorderColor, this.selectedGroups, this.cy);
  }

  setGBBorderSize(event: any) {
    this.gbBorderSize = event.value <= 20 ? event.value : 20;
    this.gbBorderSizeLabel = this.gbBorderSize ? this.gbBorderSize : 0;
    this.commonService.gbBorderSize(event, this.selectedGroups, this.cy);
  }

  increaseZIndex() {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.selectedNodes.concat(this.selectedPortGroups, this.selectedInterfaces, this.selectedGroups, this.selectedMapImages).map(ele => {
      const selectedEle = this.cy.getElementById(ele.data.id);
      this.cmGroupBoxService.moveUp(selectedEle);
    });
  }

  decreaseZIndex() {
    this._getSelectedNodeAndEdgeByMapCategory();
    this.selectedNodes.concat(this.selectedPortGroups, this.selectedInterfaces, this.selectedGroups, this.selectedMapImages).map(ele => {
      const selectedEle = this.cy.getElementById(ele.data.id);
      selectedEle._private['data'] = { ...selectedEle._private['data'] };
      const label = selectedEle.data('label');
      if (label == 'map_background') {
        if (this.config.gb_exists) {
          // const g = ele.parent();
          if (selectedEle.data('zIndex') == -998) {
            this.toastr.warning('group box zIndex out of bounds');
            return;
          }
          selectedEle.data('zIndex', selectedEle.data('zIndex') - 1);
        }
      } else {
        if (selectedEle.data('zIndex') == -998) {
          this.toastr.warning('group box zIndex out of bounds');
          return;
        }
      }
      selectedEle.data('zIndex', selectedEle.data('zIndex') - 1);
    });
  }

  lockNodes() {
    this.cmLockUnlockService.lockNodes(this.cy, this.mapCategory);
  }

  unlockNodes() {
    this.cmLockUnlockService.unlockNodes(this.cy, this.mapCategory);
  }

  setMapImageSize(size: any) {
    this.mapImageSize = size.value <= 200 ? size.value : 200;
    this.commonService.changeMapImageSize(size, this.selectedMapImages, this.cy);
  }

  updatePosition() {
    this._getSelectedNodeAndEdgeByMapCategory();
    let data: any;
    if (this.selectedNodes.length >= 1) {
      data = this.selectedNodes[0].data;
    } else if (this.selectedPortGroups.length >= 1) {
      data = this.selectedPortGroups[0].data;
    } else if (this.selectedMapImages.length >= 1) {
      data = this.selectedMapImages[0].data;
    }
    const ele = this.cy.getElementById(data.id);
    ele.position('x', +this.xCtr?.value);
    ele.position('y', +this.yCtr?.value);
    ele.data('updated', true);
    this.toastr.success('Updated element\'s position on map successfully', 'Success');
  }

  private _getSelectedNodeAndEdgeByMapCategory() {
    this.selectedNodes = this.mapCategory === 'logical' ? this.selectedLogicalNodes : this.selectedPhysicalNodes;
    this.selectedInterfaces = this.mapCategory === 'logical' ? this.selectedLogicalInterfaces : this.selectedPhysicalInterfaces;
  }
}
