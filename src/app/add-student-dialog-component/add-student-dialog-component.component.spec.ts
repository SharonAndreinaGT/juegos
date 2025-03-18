import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentDialogComponentComponent } from './add-student-dialog-component.component';

describe('AddStudentDialogComponentComponent', () => {
  let component: AddStudentDialogComponentComponent;
  let fixture: ComponentFixture<AddStudentDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentDialogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStudentDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
