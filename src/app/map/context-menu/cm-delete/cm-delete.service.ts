import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectMapOption } from 'src/app/store/map-option/map-option.selectors';
import { CommonService } from 'src/app/map/context-menu/cm-common-service/common.service';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { selectSelectedLogicalNodes } from 'src/app/store/node/node.selectors';
import { selectSelectedPortGroups } from 'src/app/store/portgroup/portgroup.selectors';
import { selectSelectedLogicalInterfaces } from 'src/app/store/interface/interface.selectors';

@Injectable({
  providedIn: 'root'
})
export class CMDeleteService {
  isGroupBoxesChecked!: boolean;
  selectedNodeIds!: any[];
  selectedPGIds!: any[];
  selectedInterfaceIds!: any[];
  selectMapOption$ = new Subscription();
  selectSelectedLogicalNodes$ = new Subscription();
  selectSelectedPortGroups$ = new Subscription();
  selectSelectedLogicalInterfaces$ = new Subscription();
  public ur: any;

  constructor(
    private store: Store,
    private commonService: CommonService,
    private helpersService: HelpersService,
  ) {
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe((mapOption: any) => {
      if (mapOption) {
        this.isGroupBoxesChecked = mapOption.isGroupBoxesChecked;
      }
    });
    this.selectSelectedLogicalNodes$ = this.store.select(selectSelectedLogicalNodes).subscribe(selectedNodes => {
      if (selectedNodes) {
        this.selectedNodeIds = selectedNodes.map(n => n.id);
      }
    });
    this.selectSelectedPortGroups$ = this.store.select(selectSelectedPortGroups).subscribe(selectedPGs => {
      if (selectedPGs) {
        this.selectedPGIds = selectedPGs.map(pg => pg.id);
      }
    });
    this.selectSelectedLogicalInterfaces$ = this.store.select(selectSelectedLogicalInterfaces).subscribe(selectedInterfaces => {
      if (selectedInterfaces) {
        this.selectedInterfaceIds = selectedInterfaces.map(i => i.id);
      }
    });
  }

  getMenu(cy: any, activeGBs: any[], activeMBs: any[],
    activeMapLinks: any[], isCanWriteOnProject: boolean) {
    return {
      id: "delete",
      content: "Delete",
      selector: "node[label!='group_box'], edge",
      onClickFunction: (event: any) => {
        this.helpersService.removeNodesOnMap(this.selectedNodeIds);
        this.helpersService.removePGsOnMap(this.selectedPGIds);
        this.helpersService.removeInterfacesOnMap(this.selectedInterfaceIds);
        this.commonService.delete(cy, activeGBs, activeMBs, activeMapLinks);
      },
      hasTrailingDivider: true,
      disabled: !isCanWriteOnProject,
    }
  }
}
