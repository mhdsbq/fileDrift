import { Component, ElementRef, EventEmitter, Input, output, Output, Signal, ViewChild } from '@angular/core';
import { TransferStatusComponent } from '../transfer-status/transfer-status.component';
import { NgFor, NgIf } from '@angular/common';
import { ReadableQueue } from '../../models/queue';
import { TransferInfo } from '../../models/file-transfer-info';
import { SpeedTestComponent } from '../speed-test/speed-test.component';

@Component({
  selector: 'file-share-dialog',
  standalone: true,
  imports: [TransferStatusComponent, NgIf, NgFor, SpeedTestComponent],
  templateUrl: './file-share-dialog.component.html',
  styleUrl: './file-share-dialog.component.scss',
})
export class FileShareDialogComponent {
  @Input() public username!: string;
  @Input() public fileTransfers!: Signal<TransferInfo>[];

  @Output() public close = new EventEmitter<void>();
  @Output() public fileSelection = new EventEmitter<File>();
  @Output() public accepted = new EventEmitter<string>();
  @Output() public rejected = new EventEmitter<string>();

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

    this.fileSelection.emit(files[0]);
  }

  public onAccept(operationId: string): void {
    this.accepted.emit(operationId);
  }
  public onReject(operationId: string): void {
    this.rejected.emit(operationId);
  }
}
