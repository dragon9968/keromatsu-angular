import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { catchError, forkJoin, Subscription, throwError } from 'rxjs';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { ImageService } from 'src/app/core/services/image/image.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ICON_PATH } from 'src/app/shared/contants/icon-path.constant';
import { retrievedImages } from 'src/app/store/map-image/map-image.actions';
import { selectImages } from 'src/app/store/map-image/map-image.selectors';
import { AddEditImagesDialogComponent } from './add-edit-images-dialog/add-edit-images-dialog.component';
import { WIDTH_DIALOG } from 'src/app/shared/contants/image.constant';
import { PageName } from 'src/app/shared/enums/page-name.enum';
import { ImportDialogComponent } from 'src/app/shared/components/import-dialog/import-dialog.component';

@Component({
  selector: 'app-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.scss']
})
export class ImagesComponent implements OnInit, OnDestroy {
  id: any;
  checked = false;
  selectedImage: any[] = [];
  selectedImage$ = new Subscription();
  listImages!: any[];
  ICON_PATH = ICON_PATH;
  pageIndex = 0;
  pageSize = 25;
  totalSize = 0;
  cols: any;
  gridByBreakpoint = {
    xl: 5,
    lg: 4,
    md: 3,
    sm: 3,
    xs: 1
  }
  activePageDataChunk: any[] = [];
  constructor(
    private store: Store,
    private toastr: ToastrService,
    private imageService: ImageService,
    private helpers: HelpersService,
    private dialog: MatDialog,
    iconRegistry: MatIconRegistry,
    private breakpointObserver: BreakpointObserver
  ) {
    this.selectedImage$ = this.store.select(selectImages).subscribe((images: any) => {
      if (images) {
        this.listImages = images;
        this.totalSize = this.listImages.length;
        this.activePageDataChunk = this.listImages.slice(0, this.pageSize);
        this.selectedImage = [];
      }
    });
    iconRegistry.addSvgIcon('export-json', this.helpers.setIconPath('/assets/icons/export-json.svg'));
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge,
    ]).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.cols = this.gridByBreakpoint.xs;
        }
        if (result.breakpoints[Breakpoints.Small]) {
          this.cols = this.gridByBreakpoint.sm;
        }
        if (result.breakpoints[Breakpoints.Medium]) {
          this.cols = this.gridByBreakpoint.md;
        }
        if (result.breakpoints[Breakpoints.Large]) {
          this.cols = this.gridByBreakpoint.lg;
        }
        if (result.breakpoints[Breakpoints.XLarge]) {
          this.cols = this.gridByBreakpoint.xl;
        }
      }
    })
    
   }

  ngOnInit(): void {
    this.imageService.getByCategory('image').subscribe((data: any) => this.store.dispatch(retrievedImages({data: data.result})));
  }

  ngOnDestroy(): void {
    this.selectedImage$.unsubscribe();
  }

  getId(obj: any, e: any) {
    if (e.checked) {
      this.selectedImage.push(obj.id);
    } else {
      this.selectedImage = this.selectedImage.filter(i => i !== obj.id);
    }
  }

  selectAll(event: any) {
    if (event.checked) {
      this.listImages.forEach(element => {
        this.selectedImage.push(element.id);
      })
    } else {
      this.selectedImage.splice(0, this.selectedImage.length);
    }
  }

  addImage() {
    const dialogData = {
      mode: 'add',
      genData: {
        name:  '',
        photo: '',
        ext: ''
      }
    }
    this.dialog.open(AddEditImagesDialogComponent, {
      disableClose: true,
      autoFocus: false,
      width: WIDTH_DIALOG,
      data: dialogData
    });
  }

  updateImage() {
    if (this.selectedImage.length === 0) {
      this.toastr.info('No row selected');
    } else if (this.selectedImage.length === 1) {
      this.imageService.get(this.selectedImage[0]).subscribe(imageData => {
        const dialogData = {
          mode: 'update',
          genData: imageData.result
        }
        this.dialog.open(AddEditImagesDialogComponent, {
          disableClose: true,
          autoFocus: false,
          width: WIDTH_DIALOG,
          data: dialogData
        });
      });
    } else {
      this.toastr.info('Bulk edits do not apply to image.<br> Please select only one image',
        'Info', { enableHtml: true });
    }
  }


  deleteImage() {
    if (this.selectedImage.length === 0) {
      this.toastr.info('No row selected');
    } else {
      const suffix = this.selectedImage.length === 1 ? 'this item' : 'these items';
      const dialogData = {
        title: 'User confirmation needed',
        message: `Are you sure you want to delete ${suffix}?`,
        submitButtonName: 'OK'
      }
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, { disableClose: true, width: '400px', data: dialogData });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          forkJoin(this.selectedImage.map(id => {
            return this.imageService.delete(id).pipe(
              catchError((response: any) => {
                if (response.status == 400) {
                  const message = response.error.message.split(':')[1];
                  this.toastr.warning(message, 'Warning');
                } else {
                  this.toastr.error('Delete image failed', 'Error');
                }
                return throwError(() => response.error);
              })
            );
          })).subscribe(() =>{
            this.imageService.getByCategory('image').subscribe((data: any) => this.store.dispatch(retrievedImages({data: data.result})));
            this.toastr.success('Deleted image(s) successfully', 'Success');
            this.selectedImage = [];
            this.checked = false;
          })
        }
      })
    }
  }

  exportJson() {
    if (this.selectedImage.length == 0) {
      this.toastr.info('No row selected');
    } else {
      let file = new Blob();
      this.imageService.export(this.selectedImage).subscribe(response => {
        file = new Blob([JSON.stringify(response, null, 4)], {type: 'application/json'});
        this.helpers.downloadBlob('Image.json', file);
        this.toastr.success(`Exported Image as ${'json'.toUpperCase()} file successfully`);
      })
    }
  }

  showImage(icon: any) {
    this.id = icon.id;
    this.imageService.get(this.id).subscribe(imageData => {
      const dialogData = {
        mode: 'view',
        genData: imageData.result
      }
      this.dialog.open(AddEditImagesDialogComponent, {
        disableClose: true,
        autoFocus: false,
        width: '600px',
        data: dialogData
      });
    });
  }

  onPageChanged(event: PageEvent) {
    const firstCut = event.pageIndex * event.pageSize;
    const secondCut = firstCut + event.pageSize;
    this.activePageDataChunk = this.listImages.slice(firstCut, secondCut);
  }

  importImage() {
    const dialogData = {
      pageName: PageName.IMAGES
    }
    this.dialog.open(ImportDialogComponent, {
      disableClose: true,
      autoFocus: false,
      width: '450px',
      data: dialogData
    });
  }
}
