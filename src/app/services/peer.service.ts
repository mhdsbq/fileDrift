import { Injectable } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { ConnectionManagerService } from './connection-manager.service';
import { BehaviorSubject, Observable } from 'rxjs';

// Handles connection with peer js servers.
@Injectable({
  providedIn: 'root',
})
export class PeerService {
  public id = crypto.randomUUID();
  public onOpen$: Observable<boolean>;

  private _peer: Peer;
  private _onOpen$ = new BehaviorSubject<boolean>(false);
  public constructor(private _connectionsManager: ConnectionManagerService) {
    this.onOpen$ = this._onOpen$.asObservable();
    this._peer = new Peer(this.id);
    this._onOpen();
    this._onConnection();
    this._onDisconnection();
    this._onError();
  }

  public connect(connectionId: string) {
    const conn = this._peer.connect(connectionId);
    this._connectionsManager.addConnection(conn);
  }

  public disconnect(connectionId: string) {
    this._connectionsManager.getConnectionById(connectionId).close();
    this._connectionsManager.removeConnection(connectionId);
  }

  private _onConnection() {
    this._peer.on('connection', (conn: DataConnection) => {
      console.info(`[peer] Incoming connection from ${conn.peer}`);
      this._connectionsManager.addConnection(conn);
      conn.on('close', () => {
        this._connectionsManager.removeConnection(conn.peer);
      });
    });
  }

  private _onDisconnection() {
    this._peer.on('disconnected', (conn) => {
      // this._state.next(PeerState.Disconnected);
    });
  }

  private _onOpen() {
    this._peer.on('open', () => {
      console.info('[peer] Connected to peer server.');
      this._onOpen$.next(true);
    });
  }

  private _onError() {
    this._peer.on('error', (error) => {
      console.info(`[peer] Peer error. Type: ${error.type}`);
      switch (error.type) {
        case 'network':
          this._handleNetworkError();
          break;
        default:
          break;
      }
    });
  }

  private _handleNetworkError() {
    console.info('[peer] Reconnecting to signaling server.');
    setTimeout(() => {
      this._peer.reconnect();
    }, 50);
  }
}
