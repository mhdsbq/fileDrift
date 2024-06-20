import { Injectable } from '@angular/core';
import { DataConnection } from 'peerjs';
import { BehaviorSubject, Observable } from 'rxjs';

// Handles DataConnections with various peers  - DataConnection a peerJs connection abstraction.
@Injectable({
  providedIn: 'root',
})
export class ConnectionDirectoryService {
  public connections$: Observable<string[]>;

  private _dataConnectionDictionary: Record<string, DataConnection> = {};
  private _connections$ = new BehaviorSubject<string[]>([]);

  constructor() {
    this.connections$ = this._connections$.asObservable();
  }

  public getConnectionById(connectionId: string): DataConnection {
    if (connectionId in this._dataConnectionDictionary) {
      return this._dataConnectionDictionary[connectionId];
    }
    throw new Error(`Cannot get connection. Connection with connection id ${connectionId} does not exist`);
  }

  public addConnection(connection: DataConnection): void {
    if (connection.peer in this._dataConnectionDictionary) {
      throw new Error(`Cannot add connection. A connection already exist with connection id: ${connection.peer}`);
    }
    this._dataConnectionDictionary[connection.peer] = connection;
    this._connections$.next(Object.keys(this._dataConnectionDictionary));
  }

  public removeConnection(connectionId: string): void {
    if (!(connectionId in this._dataConnectionDictionary)) {
      return;
    }
    delete this._dataConnectionDictionary[connectionId];
    this._connections$.next(Object.keys(this._dataConnectionDictionary));
  }
}
