import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TransferStatusComponent } from '../transfer-status/transfer-status.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'file-share-dialog',
  standalone: true,
  imports: [TransferStatusComponent, NgIf],
  templateUrl: './file-share-dialog.component.html',
  styleUrl: './file-share-dialog.component.scss',
})
export class FileShareDialogComponent {
  @Input() public username!: string;
  @Output() public close = new EventEmitter<void>();

  @ViewChild('fileInput') public fileInput?: ElementRef<HTMLInputElement>;

  public onClose() {
    this.close.emit();
  }

  public openFilePicker() {
    if (!this.fileInput) {
      throw new Error('File input is not loaded...');
    }

    this.fileInput.nativeElement.click();
  }

  public onFileSelection() {
    if (!this.fileInput) {
      throw new Error('File input is not available.');
    }

    // Currently only supporting single file upload.
    const files = this.fileInput.nativeElement.files;

    if (!files || files.length == 0) {
      return;
    }

    const file = files[0];
  }
}
