import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { JoinRoomMessage } from './../models/join-room-message';
import { PeerRequestMessage } from '../models/peer-request-message';
import { LeaveRoomMessage } from '../models/leave-room-message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  public joinRoomMessage: Observable<JoinRoomMessage>;
  public peerRequestMessage: Observable<PeerRequestMessage>;
  public leaveRoomMessage: Observable<LeaveRoomMessage>;
  public userId$: Observable<string>;

  private signalRConn: HubConnection;
  private _joinRoomMessage = new Subject<JoinRoomMessage>();
  private _peerRequestMessage = new Subject<PeerRequestMessage>();
  private _leaveRoomMessage = new Subject<LeaveRoomMessage>();
  private _userId = new Subject<string>();

  public constructor() {
    this.joinRoomMessage = this._joinRoomMessage.asObservable();
    this.peerRequestMessage = this._peerRequestMessage.asObservable();
    this.leaveRoomMessage = this._leaveRoomMessage.asObservable();
    this.userId$ = this._userId.asObservable();

    this.signalRConn = new HubConnectionBuilder()
      .withUrl('http://localhost:5044')
      .build();
  }

  public initializeConnection() {
    this._onJoinRoomMessage();
    this._onPeerRequestMessage();
    this._onLeaveRoomMessage();

    try {
      this.signalRConn.start().then(() => {
        this._joinRoom();
        this._userId.next(this.signalRConn.connectionId ?? '');
      });
      console.log('SignalR connection Started...');
    } catch {
      console.error('SignalR connection Failed...');
    }
  }

  public sendPeerRequest(toConnectionId: string, networkPeerId: string) {
    this.signalRConn.invoke(
      'RequestPeerConnection',
      toConnectionId,
      networkPeerId
    );
  }

  private _onJoinRoomMessage() {
    this.signalRConn.on(
      'JoinRoomMessage',
      (joinRoomMessage: JoinRoomMessage) => {
        this._joinRoomMessage.next(joinRoomMessage);
      }
    );
  }

  private _onPeerRequestMessage() {
    this.signalRConn.on(
      'PeerRequestMessage',
      (peerRequestMessage: PeerRequestMessage) => {
        this._peerRequestMessage.next(peerRequestMessage);
      }
    );
  }

  private _onLeaveRoomMessage() {
    this.signalRConn.on(
      'LeaveRoomMessage',
      (leaveRoomMessage: LeaveRoomMessage) => {
        this._leaveRoomMessage.next(leaveRoomMessage);
      }
    );
  }

  private _joinRoom() {
    this.signalRConn.invoke('JoinRoom');
  }
}
