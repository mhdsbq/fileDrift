import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileShareDialogComponent } from './file-share-dialog.component';

describe('FileShareDialogComponent', () => {
  let component: FileShareDialogComponent;
  let fixture: ComponentFixture<FileShareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileShareDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileShareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
