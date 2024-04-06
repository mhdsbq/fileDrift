import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeersGalleryComponent } from './peers-gallery.component';

describe('PeersGalleryComponent', () => {
  let component: PeersGalleryComponent;
  let fixture: ComponentFixture<PeersGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeersGalleryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PeersGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
