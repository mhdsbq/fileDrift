import { HostListener, Injectable } from '@angular/core';
import { PeerService } from './root-services/peer.service';
import { SignalRService } from './root-services/signalr.service';
import { combineLatest } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppService {
  @HostListener('window:beforeunload')
  leaveRoomBeforeUnload() {
    console.warn('Leaving the room since app has been quit.');
    this._signalRService.leaveRoom(this.connectionId);
  }

  private readonly connectionId;
  public isInitialized: boolean = false;

  public constructor(private _signalRService: SignalRService, private _peerService: PeerService) {
    this.connectionId = this._peerService.id;
    this.initialize();
  }

  public initialize(): void {
    this._handleConnection();
    this._handleJoinRoomMessage();
    this._handleLeaveRoomMessage();
    this._signalRService.initializeConnection();
    this.isInitialized = true;
  }

  private _handleConnection() {
    combineLatest([this._signalRService.onConnection, this._peerService.onOpen$]).subscribe(([_, isPeerOpen]) => {
      if (!isPeerOpen) {
        console.info('[app] waiting for peer to open');
        return;
      }
      this._signalRService.joinRoom(this.connectionId);
      console.info('[sig] Sent connection request to server.');
    });
  }

  private _handleJoinRoomMessage() {
    this._signalRService.joinRoomMessage.subscribe((joinRoomMessage) => {
      if (joinRoomMessage.from === this.connectionId) {
        console.warn('[app] Self connection message was forwarded.');
        return;
      }

      this._peerService.connect(joinRoomMessage.from);
      console.info(`[sig] Connected to ${joinRoomMessage.from}`);
    });
  }

  private _handleLeaveRoomMessage() {
    this._signalRService.leaveRoomMessage.subscribe((leaveRoomMessage) => {
      this._peerService.disconnect(leaveRoomMessage.from);
      console.info(`[sig] Disconnected from ${leaveRoomMessage.from}`);
    });
  }
}
