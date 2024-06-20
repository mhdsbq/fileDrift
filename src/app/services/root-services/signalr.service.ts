import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { JoinRoomMessage } from '../../types/signal-r/join-room-message';
import { LeaveRoomMessage } from '../../types/signal-r/leave-room-message';
import { FileSendRequest } from '../../types/signal-r/file-send-request';
import { FileSendResponse } from '../../types/signal-r/file-send-response';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  public onConnection: Observable<void>;
  public joinRoomMessage: Observable<JoinRoomMessage>;
  public leaveRoomMessage: Observable<LeaveRoomMessage>;
  public fileSendRequest: Observable<FileSendRequest>;
  public fileSendResponse: Observable<FileSendResponse>;

  private signalRConn: HubConnection;
  private _onConnection = new Subject<void>();
  private _joinRoomMessage = new Subject<JoinRoomMessage>();
  private _leaveRoomMessage = new Subject<LeaveRoomMessage>();
  private _fileSendRequest = new Subject<FileSendRequest>();
  private _fileSendResponse = new Subject<FileSendResponse>();

  public constructor() {
    this.onConnection = this._onConnection.asObservable();
    this.joinRoomMessage = this._joinRoomMessage.asObservable();
    this.leaveRoomMessage = this._leaveRoomMessage.asObservable();
    this.fileSendRequest = this._fileSendRequest.asObservable();
    this.fileSendResponse = this._fileSendResponse.asObservable();

    this.signalRConn = new HubConnectionBuilder().withUrl('http://localhost:5044').build();
  }

  public initializeConnection() {
    this._onJoinRoomMessage();
    this._onLeaveRoomMessage();
    this._onFileSendRequest();
    this._onFileSendResponse();

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

  public sendfileSendRequest(fileSendRequest: FileSendRequest): void {
    this._invokeWithErrorLogging('FileSendRequest', fileSendRequest);
  }

  public sendFileSendResponse(fileSendResponse: FileSendResponse): void {
    this._invokeWithErrorLogging('FileSendResponse', fileSendResponse);
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

  private _onFileSendRequest() {
    this.signalRConn.on('FileSendRequest', (fileSendRequest: FileSendRequest) => {
      this._fileSendRequest.next(fileSendRequest);
    });
  }

  private _onFileSendResponse() {
    this.signalRConn.on('FileSendResponse', (fileSendResponse: FileSendResponse) => {
      this._fileSendResponse.next(fileSendResponse);
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
