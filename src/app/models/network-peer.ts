import { BehaviorSubject, Observable } from 'rxjs';
import { PeerState } from './peer-state-enum';
import Peer, { DataConnection } from 'peerjs';

export class NetworkPeer {
  public id: string;
  public state: Observable<PeerState>;

  private _state = new BehaviorSubject<PeerState>(PeerState.Disconnected);
  private _peer: Peer;
  private _conn!: DataConnection;

  public constructor(remoteNetworkPeerId?: string) {
    this.state = this._state.asObservable();
    this.id = crypto.randomUUID();
    this._peer = new Peer(this.id);
    this._onConnection();
    this._onDisconnection();
    this._onError();
    this._onOpen();

    if (remoteNetworkPeerId) {
      this._peer.connect(remoteNetworkPeerId);
    }
  }

  private _onConnection() {
    this._peer.on('connection', (conn) => {
      this._conn = conn;
      this._state.next(PeerState.Connected);
      this._onData();
    });
  }

  private _onDisconnection() {
    this._peer.on('disconnected', () => {
      this._state.next(PeerState.Disconnected);
    });
  }

  private _onOpen() {
    this._peer.on('open', () => {
      this._state.next(PeerState.Open);
    });
  }

  private _onError() {
    this._peer.on('error', () => {
      this._state.next(PeerState.Error);
    });
  }

  private _onData() {
    if (!this._conn || this._state.value != PeerState.Connected) {
      throw new Error('peer is not connected.');
    }
    this._conn.on('data', (data) => {
      // handle incoming data.
    });
  }
}

/*
    Development Notes. Remove on commit

    - Peer is an abstraction of a remote connection.
    - When a user join the network group, a peer object will be created.
    - A peer will have 5 states -- all this from current user perspective.
        0. Disconnected
        1. Idle
        2. SendingToPeer
        3. ReceivingFromPeer
        4. Waiting to receive
        5. Waiting to send

    - Functionalities needed.
        1. Send a file.
        2. Receive a file.

*/
