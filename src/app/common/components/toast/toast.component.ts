import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ToastService, Toast, ToastType } from '../../services/toast.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import {
  CheckCircleOutline,
  CloseCircleOutline,
  ExclamationCircleOutline,
  InfoCircleOutline,
  CloseOutline
} from '@ant-design/icons-angular/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconDirective],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;

  toasts: Toast[] = [];

  constructor() {
    // Register icons
    this.iconService.addIcon(
      CheckCircleOutline,
      CloseCircleOutline,
      ExclamationCircleOutline,
      InfoCircleOutline,
      CloseOutline
    );
  }

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      // Trigger change detection to ensure UI updates immediately
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  getToastIcon(type: ToastType): string {
    switch (type) {
      case ToastType.SUCCESS:
        return 'check-circle';
      case ToastType.ERROR:
        return 'close-circle';
      case ToastType.WARNING:
        return 'exclamation-circle';
      case ToastType.INFO:
        return 'info-circle';
      default:
        return 'info-circle';
    }
  }

  getToastIconTheme(type: ToastType): 'fill' | 'outline' | 'twotone' {
    return type === ToastType.SUCCESS || type === ToastType.ERROR ? 'fill' : 'outline';
  }

  getToastClass(type: ToastType): string {
    switch (type) {
      case ToastType.SUCCESS:
        return 'toast-success';
      case ToastType.ERROR:
        return 'toast-error';
      case ToastType.WARNING:
        return 'toast-warning';
      case ToastType.INFO:
        return 'toast-info';
      default:
        return 'toast-info';
    }
  }
}

