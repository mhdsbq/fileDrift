import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { JoinRoomMessage } from '../types/signal-r/join-room-message';
import { LeaveRoomMessage } from '../types/signal-r/leave-room-message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  public onConnection: Observable<void>;
  public joinRoomMessage: Observable<JoinRoomMessage>;
  public leaveRoomMessage: Observable<LeaveRoomMessage>;

  private signalRConn: HubConnection;
  private _onConnection = new Subject<void>();
  private _joinRoomMessage = new Subject<JoinRoomMessage>();
  private _leaveRoomMessage = new Subject<LeaveRoomMessage>();

  public constructor() {
    this.onConnection = this._onConnection.asObservable();
    this.joinRoomMessage = this._joinRoomMessage.asObservable();
    this.leaveRoomMessage = this._leaveRoomMessage.asObservable();

    this.signalRConn = new HubConnectionBuilder()
      .withUrl('http://localhost:5044')
      .build();
  }

  public initializeConnection() {
    this._onJoinRoomMessage();
    this._onLeaveRoomMessage();

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

  private _onJoinRoomMessage() {
    this.signalRConn.on(
      'JoinRoomMessage',
      (joinRoomMessage: JoinRoomMessage) => {
        this._joinRoomMessage.next(joinRoomMessage);
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

  private _invokeWithErrorLogging(route: string, ...args: any[]) {
    this.signalRConn.invoke(route, ...args).catch((err) => {
      this._log('Invocations failed.', { route }, err);
    });
  }

  private _log(message: string, ...args: any[]): void {
    console.log(`[SigRService] ${message}`, ...args);
  }
}
