import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CourtSearchRequest } from '../../../models/court.model';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { SearchOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-court-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconDirective],
  templateUrl: './court-search-bar.component.html',
  styleUrls: ['./court-search-bar.component.scss']
})
export class CourtSearchBarComponent {
  private iconService = inject(IconService);
  
  @Output() search = new EventEmitter<CourtSearchRequest>();
  
  searchForm: FormGroup;
  todayDate: string;

  constructor(private fb: FormBuilder) {
    this.iconService.addIcon(SearchOutline);
    this.todayDate = this.getTodayDate();
    this.searchForm = this.fb.group({
      district: [''],
      city: [''],
      date: [this.todayDate],
      startTime: [''],
      endTime: ['']
    });
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      const searchRequest: CourtSearchRequest = {
        district: this.searchForm.value.district || undefined,
        city: this.searchForm.value.city || undefined,
        date: this.searchForm.value.date || undefined,
        startTime: this.searchForm.value.startTime || undefined,
        endTime: this.searchForm.value.endTime || undefined
      };
      this.search.emit(searchRequest);
    }
  }
}

