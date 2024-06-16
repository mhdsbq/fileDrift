import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PeersGalleryComponent } from './components/peers-gallery/peers-gallery.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { SignalRService } from './services/signalr.service';
import { Observable, combineLatest, take } from 'rxjs';
import { PeerService } from './services/peer.service';
import { ConnectionManagerService } from './services/connection-manager.service';

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
export class AppComponent implements OnInit, OnDestroy {
  public connectionId: string;
  public connections$: Observable<string[]>;

  @HostListener('window:beforeunload')
  leaveRoomBeforeUnload() {
    this._signalRService.leaveRoom(this.connectionId);
  }

  public constructor(
    private _signalRService: SignalRService,
    private _peerService: PeerService,
    private _connectionsManager: ConnectionManagerService
  ) {
    this.connections$ = this._connectionsManager.connections$;
    this.connectionId = this._peerService.id;
  }

  public async ngOnInit() {
    this._handleConnection();
    this._handleJoinRoomMessage();
    this._handleLeaveRoomMessage();
    this._signalRService.initializeConnection();
  }

  public ngOnDestroy(): void {
    this._signalRService.leaveRoom(this.connectionId);
  }

  private _handleConnection() {
    combineLatest([
      this._signalRService.onConnection,
      this._peerService.onOpen$,
    ]).subscribe(([_, isPeerOpen]) => {
      if (!isPeerOpen) {
        console.info('[app] waiting for peer to open');
        return;
      }
      this._signalRService.joinRoom(this.connectionId);
      console.info('[sig] Sent connection request to server.');
    });
  }

  private _handleJoinRoomMessage() {
    this._signalRService.joinRoomMessage.subscribe((joinRoomMessage) => {
      this._peerService.connect(joinRoomMessage.from);
      console.info(`[sig] Connected to ${joinRoomMessage.from}`);
    });
  }

  private _handleLeaveRoomMessage() {
    this._signalRService.leaveRoomMessage.subscribe((leaveRoomMessage) => {
      this._peerService.disconnect(leaveRoomMessage.from);
      console.info(`[sig] Disconnected from ${leaveRoomMessage.from}`);
    });
  }
}
