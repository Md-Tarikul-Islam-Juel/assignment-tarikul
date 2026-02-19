import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const DEFAULT_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private add(message: string, type: ToastType, duration = DEFAULT_DURATION): void {
    const id = this.generateId();
    const toast: Toast = { id, message, type, duration };
    this.toastsSignal.update((list) => [...list, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  showError(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'error', duration);
  }

  showSuccess(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'success', duration);
  }

  showInfo(message: string, duration = DEFAULT_DURATION): void {
    this.add(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }
}
