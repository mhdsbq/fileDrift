import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { JoinRoomMessage } from '../../types/signal-r/join-room-message';
import { LeaveRoomMessage } from '../../types/signal-r/leave-room-message';
import { PayloadBase, SignalMessage } from '../../types/signal-r/signal-message/signal-message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  public onConnection: Observable<void>;
  public joinRoomMessage: Observable<JoinRoomMessage>;
  public leaveRoomMessage: Observable<LeaveRoomMessage>;
  public signalMessage: Observable<SignalMessage<any>>;

  private signalRConn: HubConnection;
  private _onConnection = new Subject<void>();
  private _joinRoomMessage = new Subject<JoinRoomMessage>();
  private _leaveRoomMessage = new Subject<LeaveRoomMessage>();
  private _signalMessage = new Subject<SignalMessage<any>>();

  public constructor() {
    this.onConnection = this._onConnection.asObservable();
    this.joinRoomMessage = this._joinRoomMessage.asObservable();
    this.leaveRoomMessage = this._leaveRoomMessage.asObservable();
    this.signalMessage = this._signalMessage.asObservable();

    this.signalRConn = new HubConnectionBuilder().withUrl('http://localhost:5044').build();
  }

  public initializeConnection() {
    this._onJoinRoomMessage();
    this._onLeaveRoomMessage();
    this._onSignalMessage();

    try {
      this.signalRConn.start().then(() => {
        this._onConnection.next();
        console.info('SignalR connection Started...');
      });
    } catch {
      console.error('SignalR connection Failed...');
    }
  }

  public joinRoom(connectionId: string) {
    this._invokeWithErrorLogging('JoinRoom', connectionId);
  }

  public leaveRoom(connectionId: string) {
    this._invokeWithErrorLogging('LeaveRoom', connectionId);
  }

  public SendSignalMessage<T extends PayloadBase>(signalMessage: SignalMessage<T>) {
    // console.log('[SigRService] Signal Message Sent', signalMessage);
    this._invokeWithErrorLogging('SendSignalMessage', signalMessage);
  }

  private _onJoinRoomMessage() {
    this.signalRConn.on('JoinRoomMessage', (joinRoomMessage: JoinRoomMessage) => {
      this._joinRoomMessage.next(joinRoomMessage);
    });
  }

  private _onLeaveRoomMessage() {
    this.signalRConn.on('LeaveRoomMessage', (leaveRoomMessage: LeaveRoomMessage) => {
      this._leaveRoomMessage.next(leaveRoomMessage);
    });
  }

  private _onSignalMessage() {
    this.signalRConn.on('SignalMessage', (signalMessage: SignalMessage<any>) => {
      // console.log('[SigRService] Signal Message received', signalMessage);
      this._signalMessage.next(signalMessage);
    });
  }

  private _invokeWithErrorLogging(route: string, ...args: any[]) {
    this.signalRConn.invoke(route, ...args).catch((err) => {
      this._log('Invocations failed.', { route }, err);
    });
  }

  private _log(message: string, ...args: any[]): void {
    console.log(`[SigRService] ${message}`, ...args);
  }
}
