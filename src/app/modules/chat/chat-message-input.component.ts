import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';

import { ChatMessageDraft } from '@app/core/models';

@Component({
  selector: 'chat-message-input',
  standalone: true,
  templateUrl: './chat-message-input.component.html',
  styleUrls: ['./chat-message-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ]
})
export class ChatMessageInputComponent {
  @Input() disabled = false;
  @Output() readonly sendMessage = new EventEmitter<ChatMessageDraft>();

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.maxLength(2000)]]
  });

  readonly selectedFiles: File[] = [];

  constructor(private readonly fb: FormBuilder) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    Array.from(input.files).forEach(file => {
      this.selectedFiles.push(file);
    });

    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  submit(): void {
    if (this.disabled) {
      return;
    }

    const content = this.form.value.content?.trim();
    if (!content && this.selectedFiles.length === 0) {
      return;
    }

    this.sendMessage.emit({
      content: content ?? '',
      files: [...this.selectedFiles]
    });
  }

  reset(): void {
    this.form.reset({ content: '' });
    this.selectedFiles.splice(0);
  }
}
