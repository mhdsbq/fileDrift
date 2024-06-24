import { Component, Input, OnInit } from '@angular/core';
import { FileShareDialogComponent } from '../file-share-dialog/file-share-dialog.component';
import { NgIf } from '@angular/common';
import { DataConnection } from 'peerjs';
import { ScopedFileTransferService } from '../../services/scoped-services/scoped-file-transfer.service';
import { SignalRService } from '../../services/root-services/signalr.service';
import { filter } from 'rxjs';
import { FileInfo } from '../../types/signal-r/file-info';
import { PeerService } from '../../services/root-services/peer.service';
import { ReadableQueue } from '../../models/queue';
import { FileTransferInfo } from '../../models/file-transfer-info';
import { FileTransferStatusEnum } from '../../models/transfer-status-enum';
import { ConnectionDirectoryService } from '../../services/root-services/connection-directory.service';
import { ResponseStatusEnum } from '../../types/signal-r/response-status-enum';

@Component({
  selector: 'peer',
  standalone: true,
  imports: [FileShareDialogComponent, NgIf],
  templateUrl: './peer.component.html',
  styleUrl: './peer.component.scss',
  providers: [ScopedFileTransferService],
})
export class PeerComponent implements OnInit {
  @Input() connectionId!: string;

  public fileTransferQueue = new ReadableQueue<FileTransferInfo>();
  public showFileShareDialog: boolean = false;
  public showNotificationBlinker: boolean = false;
  public isConnected: boolean = false;

  private _conn?: DataConnection;

  constructor(
    private _connectionsDirectory: ConnectionDirectoryService,
    private _fileTransferService: ScopedFileTransferService,
    private _signalRService: SignalRService,
    private _peerService: PeerService
  ) {}

  public ngOnInit(): void {
    this._fileTransferService.initialize(this.connectionId);
    this._conn = this._connectionsDirectory.getConnectionById(this.connectionId);
    this._trackConnectionStatus();

    this._conn.on('data', (data) => {
      const byteData = data as Uint8Array;
      console.log(byteData.length);
    });

    this._subscribeIncomingFileSendRequests();
    this._subscribeIncomingFileSendResponse();
  }

  public onProfileClick() {
    this.showFileShareDialog = !this.showFileShareDialog;
    this.showNotificationBlinker = false;
  }

  public onFileSelection(file: File): void {
    const isFileAlreadyInQueue = this.fileTransferQueue.queue.some(
      (fileTransfer) => fileTransfer.fileName === file.name && fileTransfer.fileSize == file.size
    );

    if (isFileAlreadyInQueue) {
      // TODO: rename file transfer queue to appropriate name,
      // TODO: instead of alert crate some toast error message system;
      // OR MAY BE INTRODUCE A FILE TRANSFER ID - uuid
      alert('file already sending.');
      return;
    }

    const fileInfo: FileInfo = { name: file.name, size: file.size };
    this._signalRService.sendfileSendRequest({
      fileInfo,
      fileReceiverId: this.connectionId,
      fileSenderId: this._peerService.id,
    });

    this.fileTransferQueue.enqueue({
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      isSender: true,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      transferredBytes: 0,
      transferStartTime: new Date(0),
      transferStatus: FileTransferStatusEnum.RemoteAcceptPending,
    });
  }

  public onDialogClose() {
    this.showFileShareDialog = false;
  }

  public onFileTransferResponse(res: { response: 'accepted' | 'rejected'; transferInfo: FileTransferInfo }): void {
    const response = res.response;
    const transferInfo = res.transferInfo;
    this._signalRService.sendFileSendResponse({
      fileInfo: { name: transferInfo.fileName, size: transferInfo.fileSize },
      fileReceiverId: transferInfo.receiverId,
      fileSenderId: transferInfo.senderId,
      responseStatus: response === 'accepted' ? ResponseStatusEnum.Accepted : ResponseStatusEnum.Rejected,
    });
  }

  private _trackConnectionStatus() {
    setTimeout(() => {
      this.isConnected = this._conn?.peerConnection?.iceConnectionState === 'connected';
      this._trackConnectionStatus();
    }, 1000);
  }

  private _subscribeIncomingFileSendRequests() {
    //TODO: Rename all connection id to peer id if it is right.
    this._signalRService.fileSendRequest
      .pipe(filter((r) => r.fileSenderId === this.connectionId))
      .subscribe((fileSendRequest) => {
        this.showNotificationBlinker = !this.showFileShareDialog;
        const fileInfo = fileSendRequest.fileInfo;

        this.fileTransferQueue.enqueue({
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          isSender: false,
          senderId: fileSendRequest.fileSenderId,
          receiverId: fileSendRequest.fileReceiverId,
          transferredBytes: 0,
          transferStartTime: new Date(0),
          transferStatus: FileTransferStatusEnum.AcceptPending,
        });
      });
  }

  private _subscribeIncomingFileSendResponse() {
    this._signalRService.fileSendResponse
      .pipe(filter((r) => r.fileReceiverId === this.connectionId))
      .subscribe((fileSendResponse) => {
        const fileTransfer = this.fileTransferQueue.queue.find(
          (fileTransfer) =>
            fileTransfer.fileName === fileSendResponse.fileInfo.name &&
            fileTransfer.fileSize === fileSendResponse.fileInfo.size
        );

        if (!fileTransfer) {
          return;
        }

        fileTransfer.transferStatus =
          fileSendResponse.responseStatus === ResponseStatusEnum.Accepted
            ? FileTransferStatusEnum.RemoteAccepted
            : FileTransferStatusEnum.RemoteRejected;

        // start sending file if accepted.

        if (!fileTransfer.transferStatus) {
        }
      });
  }
}
