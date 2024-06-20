import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FileTransferStatusEnum } from '../../models/transfer-status-enum';
import { FileTransferInfo } from '../../models/file-transfer-info';
import { NgIf } from '@angular/common';

const statusMessageMap: Record<FileTransferStatusEnum, string> = {
  [FileTransferStatusEnum.Accepted]: 'Transfer will beguin soon.',
  [FileTransferStatusEnum.RemoteAccepted]: 'Transfer will beguin soon.',
  [FileTransferStatusEnum.AcceptPending]: 'Please accept to download.',
  [FileTransferStatusEnum.RemoteAcceptPending]: 'Waiting for download.',
  [FileTransferStatusEnum.Sending]: 'Sending.',
  [FileTransferStatusEnum.Receiving]: 'Receiving.',
  [FileTransferStatusEnum.Rejected]: 'File transfer closed.',
  [FileTransferStatusEnum.RemoteRejected]: 'File transfer closed.',
};

@Component({
  selector: 'transfer-status',
  standalone: true,
  imports: [NgIf],
  templateUrl: './transfer-status.component.html',
  styleUrl: './transfer-status.component.scss',
})
export class TransferStatusComponent implements OnInit, OnChanges {
  @Input() fileTransferInfo?: FileTransferInfo;

  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  public statusMessage: string = '';
  public showDownloadButton: boolean = false;

  public ngOnInit(): void {
    if (!this.fileTransferInfo) {
      throw new Error('File transfer info should be passed from the parent.');
    }

    this.statusMessage = statusMessageMap[this.fileTransferInfo.transferStatus];
    this.showDownloadButton = this.fileTransferInfo.transferStatus === FileTransferStatusEnum.AcceptPending;
  }
  public ngOnChanges(): void {
    if (!this.fileTransferInfo) {
      throw new Error('File transfer info should not be empty.');
    }
    this.statusMessage = statusMessageMap[this.fileTransferInfo.transferStatus];
    this.showDownloadButton = this.fileTransferInfo.transferStatus === FileTransferStatusEnum.AcceptPending;
  }

  public onDownload(): void {
    this.accept.emit();
  }

  public onReject(): void {
    this.reject.emit();
  }
}
