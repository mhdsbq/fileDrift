import { Component, Input, OnInit } from '@angular/core';
import { FileShareDialogComponent } from '../file-share-dialog/file-share-dialog.component';
import { NgIf } from '@angular/common';
import { ConnectionManagerService } from '../../services/connection-manager.service';
import { DataConnection } from 'peerjs';

@Component({
  selector: 'peer',
  standalone: true,
  imports: [FileShareDialogComponent, NgIf],
  templateUrl: './peer.component.html',
  styleUrl: './peer.component.scss',
})
export class PeerComponent implements OnInit {
  @Input() connectionId!: string;

  public showFileShareDialog: boolean = false;
  public isConnected: boolean = false;

  private _conn?: DataConnection;

  constructor(private _connectionsManager: ConnectionManagerService) {}

  public ngOnInit(): void {
    this._conn = this._connectionsManager.getConnectionById(this.connectionId);
    this._trackConnectionStatus();

    this._conn.on('data', (data) => {
      console.log(typeof data, data);
      alert('message received');
    });
  }

  public onProfileClick() {
    this.showFileShareDialog = !this.showFileShareDialog;
  }

  public onFileSelection(file: File): void {
    this._conn?.send(file);
    alert('message sent');
  }

  public onDialogClose() {
    this.showFileShareDialog = false;
  }

  private _trackConnectionStatus() {
    setTimeout(() => {
      this.isConnected = this._conn?.peerConnection?.iceConnectionState === 'connected';
      this._trackConnectionStatus();
    }, 1000);
  }
}
