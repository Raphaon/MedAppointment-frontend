import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MedicalDocument } from '@app/core/models';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-medical-document-viewer',
  standalone: true,
  templateUrl: './medical-document-viewer.component.html',
  styleUrls: ['./medical-document-viewer.component.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, SafeUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalDocumentViewerComponent {
  @Input() document!: MedicalDocument | null;
  @Output() close = new EventEmitter<void>();

  get isPdf(): boolean {
    if (!this.document?.url) {
      return false;
    }
    return this.document.url.toLowerCase().endsWith('.pdf');
  }

  get isImage(): boolean {
    if (!this.document?.url) {
      return false;
    }

    return /(jpg|jpeg|png|gif|bmp|webp)$/i.test(this.document.url);
  }

  onClose(): void {
    this.close.emit();
  }
}
