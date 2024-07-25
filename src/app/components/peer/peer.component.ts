import { Component, effect, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { FileShareDialogComponent } from '../file-share-dialog/file-share-dialog.component';
import { NgIf } from '@angular/common';
import { DataConnection } from 'peerjs';
import { SignalRService } from '../../services/root-services/signalr.service';
import { PeerService } from '../../services/root-services/peer.service';
import { ConnectionDirectoryService } from '../../services/root-services/connection-directory.service';
import {
  MessageType,
  ReadyToReceive,
  SignalMessage,
  TransferComplete,
  TransferRequest,
  TransferResponse,
  TransferStatistics,
} from '../../types/signal-r/signal-message/signal-message';
import { filter } from 'rxjs';
import { TransferInfo } from '../../models/file-transfer-info';
import { TransferStatusEnum } from '../../models/transfer-status-enum';

@Component({
  selector: 'peer',
  standalone: true,
  imports: [FileShareDialogComponent, NgIf],
  templateUrl: './peer.component.html',
  styleUrl: './peer.component.scss',
  providers: [],
})
export class PeerComponent implements OnInit {
  @Input() connectionId!: string;

  private readonly statisticsUpdateTimeMilliSeconds = 1000 / 5; // 5 times in a second

  public fileTransferSignals: WritableSignal<TransferInfo>[] = [];
  public operationIdToSignalsMap: Record<string, WritableSignal<TransferInfo>> = {};
  public ongoingTransfer?: WritableSignal<TransferInfo>;
  public operationIdToFileMap: Record<string, File> = {};

  public showFileShareDialog: boolean = false;
  public showNotificationBlinker: boolean = false;
  public isConnected: WritableSignal<boolean> = signal(false);

  private _conn?: DataConnection;
  private _lastStatisticsUpdatedTimeMilliSeconds = 0;
  private _liveTransferredByteSize = 0;

  constructor(
    private _connectionsDirectory: ConnectionDirectoryService,
    private _signalRService: SignalRService,
    private _peerService: PeerService
  ) {
    effect(() => {
      // Need to do effects only once, might need some updates later.
      if (this.isConnected()) {
        this._handleData();
        this._conn!.dataChannel.bufferedAmountLowThreshold = 10000;
      }
    });
  }

  public ngOnInit(): void {
    this._conn = this._connectionsDirectory.getConnectionById(this.connectionId);
    this._trackConnectionStatus();
    this._onSignalMessage();
  }

  public onProfileClick() {
    this.showFileShareDialog = !this.showFileShareDialog;
    this.showNotificationBlinker = false;
  }

  public onFileSelection(file: File): void {
    const operationId = crypto.randomUUID();
    this.operationIdToFileMap[operationId] = file;
    this._sendTransferRequest(operationId, file);
    this._createTransferSignal(operationId, file.name, file.size, TransferStatusEnum.RemoteAcceptPending);
  }

  public onDialogClose() {
    this.showFileShareDialog = false;
  }

  public onAcceptOrReject(operationId: string, isAccepted: boolean): void {
    this._sendTransferResponse(operationId, isAccepted);
    this._updateTransferStatus(operationId, isAccepted ? TransferStatusEnum.Accepted : TransferStatusEnum.Rejected);

    if (!isAccepted || this.ongoingTransfer) {
      return;
    }

    // Get ready to receive if no ongoing transfer
    this.ongoingTransfer = this._getTransferSignal(operationId);
    this._updateTransferStatus(operationId, TransferStatusEnum.Receiving);
  }

  private _handleTransferRequest(message: SignalMessage<TransferRequest>) {
    this._createTransferSignal(
      message.payload.operationId,
      message.payload.itemName,
      message.payload.itemSizeBytes,
      TransferStatusEnum.AcceptPending
    );
  }

  private _handleTransferResponse(message: SignalMessage<TransferResponse>) {
    const isAccepted = message.payload.isApproved;
    const operationId = message.payload.operationId;
    this._updateTransferStatus(
      operationId,
      isAccepted ? TransferStatusEnum.RemoteAccepted : TransferStatusEnum.RemoteRejected
    );

    if (!isAccepted || this.ongoingTransfer) {
      return;
    }

    // Initiate file transfer if no transfer is ongoing.
    this._updateTransferStatus(message.payload.operationId, TransferStatusEnum.Sending);
    const file = this.operationIdToFileMap[operationId];
    this._conn!.send(file);
  }
  private _handleTransferComplete(message: SignalMessage<TransferComplete>) {
    this._updateTransferStatus(message.payload.operationId, TransferStatusEnum.Sent);
    this._startNextTransfer({ readyToSend: true, sendReadyToReceive: true });
  }

  private _handleReadyToReceive(message: SignalMessage<ReadyToReceive>) {
    this._startNextTransfer({ readyToSend: true });
  }

  private _handleTransferStatistics(message: SignalMessage<TransferStatistics>) {
    this.operationIdToSignalsMap[message.payload.operationId].update((info) => ({
      ...info,
      transferredBytes: message.payload.transferredSizeBytes,
    }));
  }

  private _onSignalMessage() {
    this._signalRService.signalMessage
      .pipe(filter((message) => message.senderId === this.connectionId))
      .subscribe((message) => {
        this.showNotificationBlinker = !this.showFileShareDialog;
        switch (message.messageType) {
          case MessageType.TransferRequest:
            this._handleTransferRequest(message);
            break;
          case MessageType.TransferResponse:
            this._handleTransferResponse(message);
            break;
          case MessageType.TransferComplete:
            this._handleTransferComplete(message);
            break;
          case MessageType.ReadyToReceive:
            this._handleReadyToReceive(message);
            break;
          case MessageType.TransferStatistics:
            this._handleTransferStatistics(message);
            break;
        }
      });
  }

  private _sendTransferRequest(operationId: string, file: File) {
    this._signalRService.SendSignalMessage<TransferRequest>({
      messageType: MessageType.TransferRequest,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      sentAt: null,
      payload: {
        operationId,
        itemName: file.name,
        itemSizeBytes: file.size,
      },
    });
  }

  private _sendTransferResponse(operationId: string, isApproved: boolean) {
    this._signalRService.SendSignalMessage<TransferResponse>({
      messageType: MessageType.TransferResponse,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      sentAt: null,
      payload: {
        operationId,
        isApproved,
      },
    });
  }

  private _sendTransferCompleteMessage(operationId: string, isSuccess: boolean) {
    this._signalRService.SendSignalMessage<TransferComplete>({
      messageType: MessageType.TransferComplete,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      payload: {
        durationSeconds: 0,
        isSuccessful: isSuccess,
        operationId: operationId,
      },
      sentAt: null,
    });
  }

  private _sendReadyToReceiveMessage(operationId: string) {
    this._signalRService.SendSignalMessage<ReadyToReceive>({
      messageType: MessageType.ReadyToReceive,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      payload: {
        operationId,
      },
      sentAt: null,
    });
  }

  private _sendTransferStatisticsMessage(operationId: string, transferredSizeBytes: number) {
    this._signalRService.SendSignalMessage<TransferStatistics>({
      messageType: MessageType.TransferStatistics,
      senderId: this._peerService.id,
      receiverId: this.connectionId,
      payload: {
        operationId,
        transferredSizeBytes,
      },
      sentAt: null,
    });
  }

  private _createTransferSignal(
    operationId: string,
    fileName: string,
    fileSize: number,
    transferStatus: TransferStatusEnum
  ) {
    const transferInfoSignal = signal<TransferInfo>({
      fileName,
      fileSize,
      operationId,
      transferredBytes: 0,
      transferStatus: transferStatus,
    });

    this.fileTransferSignals.push(transferInfoSignal);
    this.operationIdToSignalsMap[operationId] = transferInfoSignal;
  }

  private _getTransferSignal(operationId: string): WritableSignal<TransferInfo> {
    return this.operationIdToSignalsMap[operationId];
  }

  private _updateTransferStatus(operationId: string, transferStatus: TransferStatusEnum) {
    this.operationIdToSignalsMap[operationId].update((transferInfo) => ({ ...transferInfo, transferStatus }));
  }

  private _handleData() {
    if (!this._conn) {
      return;
    }

    this._handleStats();

    this._conn.on('data', (data) => {
      if (!this.ongoingTransfer) {
        alert('File received while no ongoing transfers are there. May be speed test- TODO');
        return;
      }

      console.log(data);

      this.operationIdToFileMap[this.ongoingTransfer().operationId] = data as File;
      const byteData = data as Uint8Array;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([data as Uint8Array], { type: 'application/octet-stream' }));
      link.download = this.ongoingTransfer().fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this._sendTransferCompleteMessage(this.ongoingTransfer().operationId, true);
      this._updateTransferStatus(this.ongoingTransfer!().operationId, TransferStatusEnum.Received);
      this.ongoingTransfer = undefined;
      this._startNextTransfer({ readyToSend: false });
    });
  }

  private _handleStats() {
    if (!this._conn) {
      return;
    }

    this._conn!.dataChannel.onmessage = (e) => {
      if (!this.ongoingTransfer) {
        // May be speed test
        alert('chunks received with no ongoing transfer, speedTest: TODO');
        return;
      }

      const data = e.data as ArrayBuffer;
      const transferInfo = this.ongoingTransfer();
      this._liveTransferredByteSize += data.byteLength;

      const time = Date.now();
      if (time - this._lastStatisticsUpdatedTimeMilliSeconds < this.statisticsUpdateTimeMilliSeconds) {
        return;
      }

      this.ongoingTransfer.update((transfer) => ({
        ...transfer,
        transferredBytes: this._liveTransferredByteSize,
      }));

      this._sendTransferStatisticsMessage(transferInfo.operationId, this._liveTransferredByteSize);

      this._lastStatisticsUpdatedTimeMilliSeconds = time;
    };
  }

  private _trackConnectionStatus() {
    setTimeout(() => {
      this.isConnected.set(this._conn?.peerConnection?.iceConnectionState === 'connected');
      this._trackConnectionStatus();
    }, 1000);
  }

  private _startNextTransfer(options: { readyToSend: boolean; sendReadyToReceive?: boolean }) {
    if (this.ongoingTransfer) {
      return;
    }

    // Signals should not be updated during this - I guess it will not be since there will be no ongoing transfer.
    const nextTransfer = this.fileTransferSignals.find(
      (transfer) =>
        transfer().transferStatus === TransferStatusEnum.Accepted ||
        transfer().transferStatus === TransferStatusEnum.RemoteAccepted
    );

    if (!nextTransfer) {
      return;
    }

    this.ongoingTransfer = nextTransfer;

    // Send.
    if (nextTransfer().transferStatus === TransferStatusEnum.RemoteAccepted) {
      if (options.readyToSend) {
        this._conn!.send(this.operationIdToFileMap[nextTransfer().operationId]);
        this._updateTransferStatus(this.ongoingTransfer().operationId, TransferStatusEnum.Sending);
      }
    }
    // Receive
    else {
      this._updateTransferStatus(this.ongoingTransfer().operationId, TransferStatusEnum.Receiving);
      if (options.sendReadyToReceive) {
        this._sendReadyToReceiveMessage(nextTransfer().operationId);
      }
    }
  }
}
