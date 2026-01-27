import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Court } from '../../../models/court.model';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { EnvironmentOutline, EyeOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-court-list',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  templateUrl: './court-list.component.html',
  styleUrls: ['./court-list.component.scss']
})
export class CourtListComponent {
  private iconService = inject(IconService);
  
  @Input() courts: Court[] = [];
  @Input() isLoading = false;

  constructor() {
    this.iconService.addIcon(EnvironmentOutline, EyeOutline);
  }

  getCourtImage(court: Court): string {
    return court.images && court.images.length > 0 
      ? court.images[0] 
      : './assets/img/default-court.jpg';
  }
}

