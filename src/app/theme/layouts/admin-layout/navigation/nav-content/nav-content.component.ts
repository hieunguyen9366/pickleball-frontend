// Angular import
import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { NavigationItem, NavigationItems } from '../navigation';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../../../player/services/auth.service';
import { UserRole } from '../../../../../player/models/user.model';

import { NavGroupComponent } from './nav-group/nav-group.component';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline,
  CreditCardOutline,
  LoginOutline,
  QuestionOutline,
  ChromeOutline,
  FontSizeOutline,
  ProfileOutline,
  BgColorsOutline,
  AntDesignOutline,
  DeploymentUnitOutline,
  ShopOutline,
  ThunderboltOutline,
  ClockCircleOutline,
  MoneyCollectOutline,
  DollarOutline,
  CalendarOutline,
  ScheduleOutline,
  PlusCircleOutline,
  ShoppingCartOutline,
  LineChartOutline,
  PieChartOutline,
  TrophyOutline,
  UserOutline,
  CustomerServiceOutline,
  TeamOutline,
  SafetyCertificateOutline,
  SettingOutline
} from '@ant-design/icons-angular/icons';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-nav-content',
  imports: [CommonModule, RouterModule, NavGroupComponent, NgScrollbarModule],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private iconService = inject(IconService);
  private authService = inject(AuthService);

  // public props
  NavCollapsedMob = output();

  navigations: NavigationItem[];

  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  navigation: NavigationItem[] = [];
  windowWidth = window.innerWidth;

  // Constructor
  constructor() {
    this.iconService.addIcon(
      ...[
        DashboardOutline,
        CreditCardOutline,
        FontSizeOutline,
        LoginOutline,
        ProfileOutline,
        BgColorsOutline,
        AntDesignOutline,
        ChromeOutline,
        QuestionOutline,
        DeploymentUnitOutline,
        ShopOutline,
        ThunderboltOutline,
        ClockCircleOutline,
        MoneyCollectOutline,
        DollarOutline,
        CalendarOutline,
        ScheduleOutline,
        PlusCircleOutline,
        ShoppingCartOutline,
        LineChartOutline,
        PieChartOutline,
        TrophyOutline,
        UserOutline,
        CustomerServiceOutline,
        TeamOutline,
        SafetyCertificateOutline,
        SettingOutline
      ]
    );
    this.filterNavigationByRole();
  }

  // Filter navigation based on user role
  private filterNavigationByRole(): void {
    const user = this.authService.getCurrentUser();
    const userRole = user?.role;

    if (!userRole) {
      this.navigation = [];
      this.navigations = [];
      return;
    }

    // Filter navigation items based on role
    this.navigation = NavigationItems.filter(item => {
      // If item has roles restriction, check if user role is allowed
      if (item.roles && item.roles.length > 0) {
        if (!item.roles.includes(userRole)) {
          return false;
        }
      }

      // Filter children if they exist
      if (item.children && item.children.length > 0) {
        item.children = item.children.filter(child => {
          if (child.roles && child.roles.length > 0) {
            return child.roles.includes(userRole);
          }
          return true;
        });
        // Hide parent if no children visible
        if (item.children.length === 0) {
          return false;
        }
      }

      return true;
    });

    this.navigations = this.navigation;
  }

  // Life cycle events
  ngOnInit() {
    if (this.windowWidth < 1025) {
      (document.querySelector('.coded-navbar') as HTMLDivElement)?.classList.add('menupos-static');
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar').classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }
}
