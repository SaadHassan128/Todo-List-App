import { Injectable, signal } from '@angular/core';
import { ConfirmationDialogData } from '../components/confirmation-dialog/confirmation-dialog.component';

export type { ConfirmationDialogData };

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private _dialogData = signal<ConfirmationDialogData | null>(null);
  private _isVisible = signal(false);
  private resolvePromise?: (value: boolean) => void;

  public readonly dialogData$ = this._dialogData.asReadonly();
  public readonly isVisible$ = this._isVisible.asReadonly();

  show(data: ConfirmationDialogData): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this._dialogData.set(data);
      this._isVisible.set(true);
    });
  }

  confirm(): void {
    this._isVisible.set(false);
    this._dialogData.set(null);
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = undefined;
    }
  }

  cancel(): void {
    this._isVisible.set(false);
    this._dialogData.set(null);
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = undefined;
    }
  }

  hide(): void {
    this._isVisible.set(false);
    this._dialogData.set(null);
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = undefined;
    }
  }
}
