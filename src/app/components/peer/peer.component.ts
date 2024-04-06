import { Component, Input, OnInit } from '@angular/core';
import { PeerManagerService } from '../../services/peer-manager.service';
import { NetworkPeer } from '../../models/network-peer';
import { FileShareDialogComponent } from '../file-share-dialog/file-share-dialog.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'peer',
  standalone: true,
  imports: [FileShareDialogComponent, NgIf],
  templateUrl: './peer.component.html',
  styleUrl: './peer.component.scss',
})
export class PeerComponent implements OnInit {
  @Input() userId!: string;

  public networkPeer?: NetworkPeer;
  public showFileShareDialog: boolean = false;

  constructor(private _peerManager: PeerManagerService) {}

  public ngOnInit(): void {
    this.networkPeer = this._peerManager.getPeerByUserId(this.userId);
    this.networkPeer.state.subscribe();
  }

  public onProfileClick() {
    this.showFileShareDialog = !this.showFileShareDialog;
  }

  public onDialogClose() {
    this.showFileShareDialog = false;
  }
}
