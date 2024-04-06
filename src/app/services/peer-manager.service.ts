import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { NetworkPeer } from '../models/network-peer';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PeerManagerService {
  public connections$: Observable<string[]>;

  private _peerDictionary: Record<string, NetworkPeer> = {};
  private _connections$ = new BehaviorSubject<string[]>([]);
  private peerConnections = new Set<string>();

  constructor() {
    this.connections$ = this._connections$.asObservable();
  }

  public getPeerByUserId(userId: string): NetworkPeer {
    if (userId in this._peerDictionary) {
      return this._peerDictionary[userId];
    }
    throw new Error('Peer is not available.');
  }

  public addPeer(userId: string, peer: NetworkPeer): void {
    if (userId in this._peerDictionary) {
      throw new Error('A network peer already exist for this user.');
    }
    this._peerDictionary[userId] = peer;
    this.peerConnections.add(userId);
    this._connections$.next(Array.from(this.peerConnections));
  }

  public removePeer(userId: string): void {
    if (!(userId in this._peerDictionary)) {
      throw new Error('Network peer does not exist to delete.');
    }
    delete this._peerDictionary[userId];
    this.peerConnections.delete(userId);
    this._connections$.next(Array.from(this.peerConnections));
  }
}
