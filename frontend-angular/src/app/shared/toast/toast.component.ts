import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" role="alert">
          <span class="toast-icon">
            @switch (t.type) {
              @case ('error') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
              @case ('success') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              }
              @default {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            }
          </span>
          <span class="toast-message">{{ t.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(t.id)" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: 100%;
      pointer-events: none;
    }
    .toast-container > * {
      pointer-events: auto;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1rem 1rem 1.25rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08);
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      animation: toast-in 0.35s ease-out;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .toast-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }
    .toast-message {
      flex: 1;
      font-size: 0.9375rem;
      line-height: 1.4;
      color: #1a1a1a;
    }
    .toast-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border: none;
      background: transparent;
      color: #737373;
      cursor: pointer;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .toast-close:hover {
      color: #1a1a1a;
      background: rgba(0, 0, 0, 0.06);
    }
    .toast-error {
      border-left: 4px solid #dc2626;
    }
    .toast-error .toast-icon { color: #dc2626; }
    .toast-success {
      border-left: 4px solid #16a34a;
    }
    .toast-success .toast-icon { color: #16a34a; }
    .toast-info {
      border-left: 4px solid #0ea5e9;
    }
    .toast-info .toast-icon { color: #0ea5e9; }
  `],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
