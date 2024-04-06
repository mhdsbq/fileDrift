import { Component, Input } from '@angular/core';
import { PeerComponent } from '../peer/peer.component';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'peers-gallery',
  standalone: true,
  imports: [PeerComponent, CommonModule],
  templateUrl: './peers-gallery.component.html',
  styleUrl: './peers-gallery.component.scss',
})
export class PeersGalleryComponent {
  @Input() connections$!: Observable<string[]>;
}
