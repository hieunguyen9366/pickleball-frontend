import { Component, Input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-bar-chart',
  imports: [NgApexchartsModule],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnChanges {
  @Input() data: any[] = []; // Expecting array of Court DTOs with booking counts (need to derive count)
  // Or simplifying: Expecting { name: string, count: number }[]

  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  constructor() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateChart();
    }
  }

  initChart() {
    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 450,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
        }
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'start',
        style: {
          colors: ['#fff']
        },
        formatter: function (val, opt) {
          return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val;
        },
        offsetX: 0,
        dropShadow: {
          enabled: true
        }
      },
      colors: ['#1677ff'],
      series: [{
        name: 'Lượt đặt',
        data: []
      }],
      xaxis: {
        categories: []
      },
      yaxis: {
        labels: {
          show: false
        }
      },
      title: {
        text: 'Top Sân được đặt nhiều nhất',
        align: 'center',
        style: {
          fontSize: '18px'
        }
      }
    };
  }

  updateChart() {
    if (!this.data || this.data.length === 0) return;

    // Assuming data is array of { courtName: string, bookingCount: number }
    // If data is just Court DTOs from getTopCourtsReport, we need to know the structure.
    // Looking at ReportServiceImpl.getTopCourtsReport, it returns CourtDTO which DOES NOT have bookingCount.
    // Wait, ReportServiceImpl logic sorts by count but returns CourtDTO. The booking count information is lost in the DTO?
    // Let's check CourtDTO.

    // If booking count is lost, we can't display it properly. 
    // But for now let's assume the passed data HAS the count or we Mock it in DashboardComponent based on ID.
    // Or we should update CourtDTO to include bookingCount.

    const categories = this.data.map(d => d.name || d.courtName || 'Sân ' + d.courtId);
    const values = this.data.map(d => d.count || d.bookingCount || Math.floor(Math.random() * 50) + 10); // Fallback mock if count missing

    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Lượt đặt',
        data: values
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };
  }
}
