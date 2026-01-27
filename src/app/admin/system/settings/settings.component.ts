import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { SettingOutline, DollarOutline, CreditCardOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(SettingOutline, DollarOutline, CreditCardOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}



