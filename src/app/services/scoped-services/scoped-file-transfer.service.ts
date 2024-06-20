import { Injectable } from '@angular/core';
import { DataConnection } from 'peerjs';
import { ConnectionDirectoryService } from '../root-services/connection-directory.service';

/**
 * Handle file transfer through peer js DataConnection.
 */
@Injectable()
export class ScopedFileTransferService {
  // constructor(private _connectionDirectory: ConnectionDirectoryService) {}

  public dataConnection?: DataConnection;
  public initialize(connectionId: string) {
    // this.dataConnection = this._connectionDirectory.getConnectionById(connectionId);
  }
}
