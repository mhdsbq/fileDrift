import {
  Component,
  computed,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  Signal,
  SimpleChanges,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { TransferStatusEnum } from '../../models/transfer-status-enum';
import { TransferInfo } from '../../models/file-transfer-info';

const statusMessageMap: Record<TransferStatusEnum, string> = {
  [TransferStatusEnum.Sent]: 'File sent successfully.',
  [TransferStatusEnum.Received]: 'File received successfully',
  [TransferStatusEnum.Accepted]: 'Transfer will beguin soon.',
  [TransferStatusEnum.RemoteAccepted]: 'Transfer will beguin soon.',
  [TransferStatusEnum.AcceptPending]: 'Please accept to download.',
  [TransferStatusEnum.RemoteAcceptPending]: 'Waiting for download.',
  [TransferStatusEnum.Sending]: 'Sending.',
  [TransferStatusEnum.Receiving]: 'Receiving.',
  [TransferStatusEnum.Rejected]: 'File transfer closed.',
  [TransferStatusEnum.RemoteRejected]: 'File transfer closed.',
};

@Component({
  selector: 'transfer-status',
  standalone: true,
  imports: [NgIf],
  templateUrl: './transfer-status.component.html',
  styleUrl: './transfer-status.component.scss',
})
export class TransferStatusComponent implements OnInit {
  @Input() transferInfo?: Signal<TransferInfo>;

  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  public statusMessage: Signal<string> = signal('');
  public showDownloadButton: Signal<boolean> = signal(false);
  public progressPercentage: Signal<string> = signal('0');

  public ngOnInit(): void {
    if (!this.transferInfo) {
      throw new Error('File transfer info should be passed from the parent.');
    }

    this.statusMessage = computed(() => statusMessageMap[this.transferInfo!().transferStatus]);
    this.showDownloadButton = computed(() => this.transferInfo!().transferStatus === TransferStatusEnum.AcceptPending);
    this.progressPercentage = computed(() => this._calculateProgress(this.transferInfo!()).toString() + '%');
  }

  public onDownload(): void {
    this.accept.emit();
  }

  public onReject(): void {
    this.reject.emit();
  }

  private _calculateProgress(transferInfo: TransferInfo): number {
    if (
      transferInfo.transferStatus === TransferStatusEnum.Sent ||
      transferInfo.transferStatus === TransferStatusEnum.Received
    ) {
      return 100;
    }
    if (transferInfo.transferredBytes === 0) {
      return 0;
    }
    return Math.ceil((transferInfo.transferredBytes / transferInfo.fileSize) * 100);
  }
}
