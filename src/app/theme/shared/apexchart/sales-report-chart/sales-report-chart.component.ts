import { Component, Input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-sales-report-chart',
  imports: [NgApexchartsModule],
  templateUrl: './sales-report-chart.component.html',
  styleUrl: './sales-report-chart.component.scss'
})
export class SalesReportChartComponent implements OnChanges {
  @Input() data: any[] = []; // Expecting array of { date, revenue, bookingCount }

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
        height: 430,
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          columnWidth: '40%',
          borderRadius: 4
        }
      },
      stroke: {
        show: true,
        width: 4,
        colors: ['transparent']
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        show: true,
        fontFamily: `'Public Sans', sans-serif`,
        offsetX: 10,
        offsetY: 10,
        labels: {
          useSeriesColors: false
        },
        itemMargin: {
          horizontal: 15,
          vertical: 5
        }
      },
      yaxis: [
        {
          title: {
            text: 'Doanh thu (VNĐ)'
          },
          labels: {
            formatter: (value) => {
              return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumSignificantDigits: 3 }).format(value);
            }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Lượt đặt'
          }
        }
      ],
      series: [
        {
          name: 'Doanh thu',
          type: 'column',
          data: []
        },
        {
          name: 'Lượt đặt',
          type: 'line', // Display bookings as line for better visualization
          data: []
        }
      ],
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#222'
          }
        }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val, opts) {
            if (opts.seriesIndex === 0) {
              return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
            }
            return val + " lượt";
          }
        }
      },
      colors: ['#1677ff', '#faad14'],
      grid: {
        borderColor: '#f5f5f5'
      }
    };
  }

  updateChart() {
    if (!this.data || this.data.length === 0) return;

    // Sort by date just in case
    // Assuming data is RevenueByDate format
    const categories = this.data.map(item => {
      const d = new Date(item.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const revenueData = this.data.map(item => item.revenue || 0);
    const bookingData = this.data.map(item => item.bookingCount || 0);

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Doanh thu',
          type: 'column',
          data: revenueData
        },
        {
          name: 'Lượt đặt',
          type: 'line',
          data: bookingData
        }
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: categories
      }
    };
  }
}
