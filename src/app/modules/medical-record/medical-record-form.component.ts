import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MedicalRecord, MedicalRecordSummaryDto } from '@app/core/models';

@Component({
  selector: 'app-medical-record-form',
  standalone: true,
  templateUrl: './medical-record-form.component.html',
  styleUrls: ['./medical-record-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalRecordFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() record: MedicalRecord | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<MedicalRecordSummaryDto>();

  form = this.fb.group({
    bloodGroup: [''],
    allergies: [''],
    chronicDiseases: [''],
    familyHistory: ['']
  });

  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  hasChanges = false;

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.hasChanges = true;
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['record']) {
      this.patchForm();
    }

    if (changes['saving'] && this.saving) {
      this.form.disable({ emitEvent: false });
    } else if (changes['saving'] && !this.saving) {
      this.form.enable({ emitEvent: false });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    const value = this.form.getRawValue() as MedicalRecordSummaryDto;
    this.save.emit(value);
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  resetForm(): void {
    this.patchForm();
  }

  private patchForm(): void {
    this.form.patchValue(
      {
        bloodGroup: this.record?.bloodGroup ?? '',
        allergies: this.record?.allergies ?? '',
        chronicDiseases: this.record?.chronicDiseases ?? '',
        familyHistory: this.record?.familyHistory ?? ''
      },
      { emitEvent: false }
    );
    this.hasChanges = false;
    this.cdr.markForCheck();
  }
}
