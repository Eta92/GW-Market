import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaderboardShop, Overview, OverviewData } from '@app/models/overview.model';
import { StoreService } from '@app/services/store.service';
import type { EChartsOption } from 'echarts';
import { ToastrService } from 'ngx-toastr';

// Series definition helper
interface OverviewSeries {
  name: string;
  color: string;
  data: Array<OverviewData>;
}

interface OverviewRepartition {
  value: number;
  label: string;
  color: string;
}

export type OverviewRange = 'all' | 'week' | 'day';

const RANGE_MS: Record<OverviewRange, number | null> = {
  all: null,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 1 * 24 * 60 * 60 * 1000,
};

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  public overview: Overview;
  public range: OverviewRange = 'all';

  public chartPurchase: EChartsOption;
  public chartReputation: EChartsOption;
  public chartConnections: EChartsOption;
  public chartRefreshes: EChartsOption;

  public repartitionType: EChartsOption;
  public repartitionOrigin: EChartsOption;
  public repartitionRecent: EChartsOption;
  public repartitionCurrency: EChartsOption;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private storeService: StoreService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.storeService.getOverview().subscribe((overview: Overview) => {
      this.overview = overview;
      this.buildCharts();
      this.cdr.detectChanges();
    });
    this.storeService.requestSocket('getOverview');
  }

  public setRange(r: OverviewRange): void {
    this.range = r;
    this.buildCharts();
    this.cdr.detectChanges();
  }

  goToShop(entry: LeaderboardShop): void {
    if (entry.publicId) {
      window.open(`https://gwmarket.net/shop/showcase?public=${entry.publicId}`, '_blank');
    }
  }

  private filterAndAggregate(data: Array<OverviewData>): Array<OverviewData> {
    const now = Date.now();
    const cutoff = RANGE_MS[this.range];

    // 1. Filter by time window
    const filtered = cutoff ? data.filter((d) => d.date >= now - cutoff) : data;

    // 2. When range is 'day', keep hourly resolution; otherwise aggregate to daily buckets
    if (this.range === 'day') return filtered;

    const DAY_MS = 24 * 60 * 60 * 1000;
    const buckets = new Map<number, number>();
    for (const d of filtered) {
      const key = Math.floor(d.date / DAY_MS) * DAY_MS;
      buckets.set(key, (buckets.get(key) ?? 0) + d.value);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, value]) => ({ date, value }));
  }

  private buildCharts(): void {
    const o = this.overview;
    if (!o) return;

    this.chartPurchase = this.buildChart([
      { name: 'Customer requests', color: '#d4a853', data: this.filterAndAggregate(o.customerHistory ?? []) },
      { name: 'Shops confirmations', color: '#60a5fa', data: this.filterAndAggregate(o.shopHistory ?? []) },
      { name: 'Total', color: '#22c55e', data: this.filterAndAggregate(o.mergedHistory ?? []) },
    ]);

    this.chartReputation = this.buildChart([
      { name: 'Reputations', color: '#a78bfa', data: this.filterAndAggregate(o.reputationHistory ?? []) },
      { name: 'Certifications', color: '#60a5fa', data: this.filterAndAggregate(o.certificationAllHistory ?? []) },
      //{ name: 'Unique certifications', color: '#10b981', data: this.filterAndAggregate(o.certificationUniqueHistory ?? []) }
    ]);

    this.chartConnections = this.buildChart([
      { name: 'All market connections', color: '#d4a853', data: this.filterAndAggregate(o.connectionsAllHistory ?? []) },
      { name: 'Unique market connections', color: '#60a5fa', data: this.filterAndAggregate(o.connectionsUniqueHistory ?? []) },
    ]);

    this.chartRefreshes = this.buildChart([
      { name: 'All shop updates', color: '#22c55e', data: this.filterAndAggregate(o.refreshesAllHistory ?? []) },
      { name: 'Unique shop updates', color: '#f97316', data: this.filterAndAggregate(o.refreshesUniqueHistory ?? []) },
    ]);

    this.buildRepartitions();
  }

  private buildChart(series: OverviewSeries[]): EChartsOption {
    // One independent yAxis per series so each curve uses its own scale
    const yAxes = series.map(() => ({
      type: 'value' as const,
      show: false,
      splitLine: { show: false },
      scale: true,
    }));

    const builtSeries = series.map((s, i) => ({
      name: s.name,
      type: 'line' as const,
      yAxisIndex: i,
      data: (s.data ?? []).map((d) => [d.date, d.value]),
      smooth: true,
      showSymbol: false,
      lineStyle: { color: s.color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: s.color + '55' },
            { offset: 1, color: s.color + '05' },
          ],
        },
      },
      itemStyle: { color: s.color },
      emphasis: { focus: 'series' as const },
    }));

    return {
      backgroundColor: 'transparent',
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: '#e8dcc4', fontSize: 11 },
        top: 4,
        inactiveColor: '#3a3430',
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#2a241f',
        borderColor: '#d4a853',
        borderWidth: 1,
        textStyle: { color: '#f4e8c1', fontSize: 12 },
        axisPointer: { lineStyle: { color: '#d4a853', opacity: 0.5 } },
        formatter: (params: any): string => {
          const date = new Date(params[0].axisValue).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const rows = params
            .map((p: any) => `<span style="color:${p.color}">${p.seriesName}:</span> <strong style="color:#f4e8c1">${p.value[1]}</strong>`)
            .join('<br/>');
          return `<div style="color:#d4a853;margin-bottom:4px">${date}</div>${rows}`;
        },
      },
      grid: { left: 8, right: 8, top: 36, bottom: 28, containLabel: false },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#3a3430' } },
        axisLabel: {
          color: '#a08060',
          fontSize: 10,
          formatter: (v: number): string => new Date(v).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
        },
        splitLine: { lineStyle: { color: '#2a241f' } },
      },
      yAxis: yAxes,
      series: builtSeries,
    };
  }

  private buildRepartitions(): void {
    const o = this.overview;
    if (!o) return;

    this.repartitionType = this.buildPieChart([
      { value: o.repartitionTypeBuy, label: 'Buy', color: '#f97316' },
      { value: o.repartitionTypeSell, label: 'Sell', color: '#22c55e' },
      { value: o.repartitionTypeAuction, label: 'Auction', color: '#7311d4' },
    ]);

    this.repartitionOrigin = this.buildPieChart([
      { value: o.repartitionOriginMarket, label: 'Market', color: '#60a5fa' },
      { value: o.repartitionOriginToolBox, label: 'ToolBox', color: '#22c55e' },
      { value: o.repartitionOriginKamdan, label: 'Kamdan', color: '#d4a853' },
    ]);

    this.repartitionRecent = this.buildPieChart([
      { value: o.repartitionRecentFree, label: 'None', color: '#888888' },
      { value: o.repartitionRecentCertified, label: 'Certified', color: '#60a5fa' },
      { value: o.repartitionRecentOnline, label: 'Online', color: '#22c55e' },
      { value: o.repartitionRecentKamdan, label: 'Kamdan', color: '#d4a853' },
    ]);

    this.repartitionCurrency = this.buildPieChart([
      { value: o.repartitionCurrencyPlatinium, label: 'Plat', color: '#bbbbaa' },
      { value: o.repartitionCurrencyEcto, label: 'Ecto', color: '#60a5fa' },
      { value: o.repartitionCurrencyArmbrace, label: 'Arm', color: '#22c55e' },
      { value: o.repartitionCurrencyBlackDye, label: 'B. Dye', color: '#222233' },
    ]);
  }

  private buildPieChart(items: OverviewRepartition[]): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#2a241f',
        borderColor: '#d4a853',
        borderWidth: 1,
        textStyle: { color: '#f4e8c1', fontSize: 12 },
        formatter: (p: any) => `${p.name}: <strong>${Math.round(p.value)}</strong> (${p.percent?.toFixed(1)}%)`,
      },
      legend: {
        orient: 'horizontal',
        bottom: 2,
        textStyle: { color: '#e8dcc4', fontSize: 9 },
        inactiveColor: '#3a3430',
        itemWidth: 10,
        itemHeight: 8,
        data: items.map((i) => ({ name: i.label, itemStyle: { color: i.color } })),
      },
      series: [
        {
          type: 'pie',
          radius: ['38%', '68%'],
          center: ['50%', '38%'],
          minAngle: 5,
          data: items.map((i) => ({
            value: i.value === 0 ? 0.001 : i.value,
            name: i.label,
            itemStyle: { color: i.color },
          })),
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.4)',
            },
          },
        },
      ],
    };
  }
}
