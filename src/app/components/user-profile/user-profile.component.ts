import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'user-profile',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  @Input() public userId$!: Observable<string>;
}
