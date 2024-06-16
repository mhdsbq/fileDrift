import { Injectable } from '@angular/core';
import { DataConnection } from 'peerjs';
import { ConnectionManagerService } from './connection-manager.service';

/**
 * Handle file transfer through peer js DataConnection.
 */
@Injectable()
class fileTransferService {
  constructor(private _connectionManager: ConnectionManagerService) {}

  public dataConnection?: DataConnection;
  public initialize(connectionId: string) {
    this.dataConnection = this._connectionManager.getConnectionById(connectionId);
  }
}
