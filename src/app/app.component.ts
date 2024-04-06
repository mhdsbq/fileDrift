import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PeersGalleryComponent } from './components/peers-gallery/peers-gallery.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { SignalRService } from './services/signalr.service';
import { PeerManagerService } from './services/peer-manager.service';
import { NetworkPeer } from './models/network-peer';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    PeersGalleryComponent,
    UserProfileComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  public userId$: Observable<string>;
  public connections$: Observable<string[]>;

  public constructor(
    private _signalRService: SignalRService,
    private _peerManager: PeerManagerService
  ) {
    this.connections$ = this._peerManager.connections$;
    this.userId$ = this._signalRService.userId$;
  }

  public async ngOnInit() {
    this._handleJoinRoomMessage();
    this._handlePeerRequestMessage();
    this._handleLeaveRoomMessage();
    this._signalRService.initializeConnection();
  }

  private _handleJoinRoomMessage() {
    this._signalRService.joinRoomMessage.subscribe((joinRoomMessage) => {
      const networkPeer = new NetworkPeer();
      this._peerManager.addPeer(joinRoomMessage.from, networkPeer);
      this._signalRService.sendPeerRequest(
        joinRoomMessage.from,
        networkPeer.id
      );
    });
  }

  private _handlePeerRequestMessage() {
    this._signalRService.peerRequestMessage.subscribe((peerRequestMessage) => {
      const networkPeer = new NetworkPeer(peerRequestMessage.networkPeerId);
      this._peerManager.addPeer(peerRequestMessage.from, networkPeer);
    });
  }

  private _handleLeaveRoomMessage() {
    this._signalRService.leaveRoomMessage.subscribe((leaveRoomMessage) => {
      this._peerManager.removePeer(leaveRoomMessage.from);
    });
  }
}
