import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  FacebookOutline,
  InstagramOutline,
  TwitterOutline,
  YoutubeOutline,
  PhoneOutline,
  MailOutline,
  EnvironmentOutline,
  ClockCircleOutline,
  CreditCardOutline,
  WalletOutline,
  HomeOutline,
  SearchOutline,
  CalendarOutline,
  BellOutline,
  UserOutline,
  DownOutline,
  LockOutline,
  LogoutOutline,
  LoginOutline,
  UserAddOutline,
  QuestionCircleOutline,
  BookOutline,
  CustomerServiceOutline,
  FileTextOutline,
  FileProtectOutline,
  KeyOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-player-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, IconDirective, NgbDropdownModule],
  templateUrl: './player-layout.component.html',
  styleUrls: ['./player-layout.component.scss']
})
export class PlayerLayoutComponent implements OnInit {
  private iconService = inject(IconService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  unreadCount = signal<number>(0);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    // Register icons
    this.iconService.addIcon(
      FacebookOutline,
      InstagramOutline,
      TwitterOutline,
      YoutubeOutline,
      PhoneOutline,
      MailOutline,
      EnvironmentOutline,
      ClockCircleOutline,
      CreditCardOutline,
      WalletOutline,
      HomeOutline,
      SearchOutline,
      CalendarOutline,
      BellOutline,
      UserOutline,
      DownOutline,
      LockOutline,
      LogoutOutline,
      LoginOutline,
      UserAddOutline,
      QuestionCircleOutline,
      BookOutline,
      CustomerServiceOutline,
      FileTextOutline,
      FileProtectOutline,
      KeyOutline
    );
    
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    this.currentUser$ = this.authService.currentUser$;
    this.updateAuthStatus();
  }

  ngOnInit(): void {
    this.updateAuthStatus();
    
    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(() => {
      this.updateAuthStatus();
      if (this.authService.isAuthenticated()) {
        this.loadUnreadCount();
      } else {
        this.unreadCount.set(0);
      }
    });

    if (this.authService.isAuthenticated()) {
      this.loadUnreadCount();
    }
  }

  updateAuthStatus(): void {
    this.isAuthenticatedSubject.next(this.authService.isAuthenticated());
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount.set(count || 0);
      },
      error: () => {
        this.unreadCount.set(0);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.updateAuthStatus();
    this.unreadCount.set(0);
    this.router.navigate(['/player']);
  }
}

