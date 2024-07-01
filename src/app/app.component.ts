import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PeersGalleryComponent } from './components/peers-gallery/peers-gallery.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { Observable } from 'rxjs';
import { PeerService } from './services/root-services/peer.service';
import { ConnectionDirectoryService } from './services/root-services/connection-directory.service';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, PeersGalleryComponent, UserProfileComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public connectionId: string;
  public connections$: Observable<string[]>;

  public constructor(
    private _appService: AppService,
    private _peerService: PeerService,
    private _connectionDirectory: ConnectionDirectoryService
  ) {
    if (!_appService.isInitialized) {
      console.error('[APP] App service has not been initialized!!!');
    }
    this.connections$ = this._connectionDirectory.connections$;
    this.connectionId = this._peerService.id;
  }
}
