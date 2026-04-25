import { Component } from '@angular/core';
import { Purchase, PurchaseOrigin, PurchasePrice } from '@app/models/purchase.model';
import { OrderType, Price } from '@app/models/shop.model';
import { Modal } from '@shared/modal/models/modal.model';
import type { EChartsOption } from 'echarts';

// ── Labels ────────────────────────────────────────────────────────────────────

export const PRICE_LABELS: Record<Price, string> = {
  [Price.PLAT]: 'Platinum',
  [Price.ECTO]: 'Ecto',
  [Price.ZKEY]: 'Zkey',
  [Price.ARM]: 'Armbrace',
  [Price.BD]: 'Bone Dragon'
};

const ORIGIN_LABELS: Record<PurchaseOrigin, string> = {
  [PurchaseOrigin.CLIENT]: 'Customer request',
  [PurchaseOrigin.SHOP]: 'Shop confirmation',
  [PurchaseOrigin.TOOLBOX]: 'Toolbox request',
  [PurchaseOrigin.MERCHANT]: 'Merchant data',
  [PurchaseOrigin.KAMADAN]: 'Kamadan chat'
};

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.SELL]: 'Sell',
  [OrderType.BUY]: 'Buy',
  [OrderType.AUCTION]: 'Auction'
};

const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  [OrderType.SELL]: '#22c55e',
  [OrderType.BUY]: '#f97316',
  [OrderType.AUCTION]: '#a78bfa'
};

// ── Colors per origin ─────────────────────────────────────────────────────────

const ORIGIN_COLORS: Record<PurchaseOrigin, string> = {
  [PurchaseOrigin.CLIENT]: '#d4a853',
  [PurchaseOrigin.SHOP]: '#60a5fa',
  [PurchaseOrigin.TOOLBOX]: '#22c55e',
  [PurchaseOrigin.MERCHANT]: '#f97316',
  [PurchaseOrigin.KAMADAN]: '#a78bfa'
};

// ── Default multipliers (everything expressed in Platinum equivalent) ─────────

const DEFAULT_MULTIPLIERS: Record<Price, number> = {
  [Price.PLAT]: 1,
  [Price.ECTO]: 9,
  [Price.ZKEY]: 6,
  [Price.ARM]: 100,
  [Price.BD]: 1
};

// ── Data point stored per ECharts point ───────────────────────────────────────

interface ChartDataPoint {
  value: [number, number]; // [timestamp, normalizedPrice (plat equiv)]
  prices: PurchasePrice[];
  orderType: OrderType;
  origin: PurchaseOrigin;
  shop: string;
}

@Component({
  selector: 'app-history-modal',
  templateUrl: './history-modal.component.html',
  styleUrls: ['./history-modal.component.scss']
})
export class HistoryModalComponent extends Modal {
  public name: string;
  public history: Array<Purchase>;
  public chartOptions: EChartsOption;
  public hasData = false;
  public showRates = false;

  // Exposed to template for editable rate inputs
  public multipliers: Record<Price, number> = { ...DEFAULT_MULTIPLIERS };
  public presentTypes: Price[] = [];
  public readonly priceLabels = PRICE_LABELS;

  constructor() {
    super();
  }

  onInjectInputs(inputs: any): void {
    this.name = inputs.name;
    this.history = inputs.history ?? [];
    this.buildChart();
  }

  onMultipliersChange(): void {
    this.buildChart();
  }

  // ── Chart builder ───────────────────────────────────────────────────────────

  private buildChart(): void {
    if (!this.history.length) return;

    const sorted = [...this.history].sort((a, b) => a.date - b.date);

    // Collect present currency types (for multiplier inputs)
    const typeSet = new Set<Price>();
    sorted.forEach(p => p.prices.forEach(pp => typeSet.add(pp.type)));
    this.presentTypes = Array.from(typeSet).filter(t => t !== Price.PLAT); // Plat is always 1, skip it

    // Group data points by PurchaseOrigin
    const originSet = new Set<PurchaseOrigin>();
    sorted.forEach(p => originSet.add(p.origin));
    const origins = Array.from(originSet);

    const seriesMap = new Map<PurchaseOrigin, ChartDataPoint[]>();
    origins.forEach(o => seriesMap.set(o, []));

    sorted.forEach(purchase => {
      if (!purchase.prices.length) return;

      // Normalize: sum all price components → platinum equiv → convert to ecto equiv
      const normalizedPlat = purchase.prices.reduce((sum, pp) => sum + pp.unitPrice * (this.multipliers[pp.type] ?? 1), 0);
      const normalizedEcto = Math.round((normalizedPlat / this.multipliers[Price.ECTO]) * 100) / 100;

      seriesMap.get(purchase.origin)?.push({
        value: [purchase.date, normalizedEcto],
        prices: purchase.prices,
        orderType: purchase.orderType,
        origin: purchase.origin,
        shop: purchase.shop
      });
    });

    this.hasData = true;

    this.chartOptions = this.buildOptions(origins, seriesMap);
  }

  private computeTrend(points: ChartDataPoint[]): [number, number][] {
    if (points.length < 2) return [];
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    return points.map(p => {
      const t = p.value[0];
      const win = points.filter(q => Math.abs(q.value[0] - t) <= WEEK);
      const avg = win.reduce((s, q) => s + q.value[1], 0) / win.length;
      return [t, Math.round(avg * 100) / 100];
    });
  }

  private buildOptions(origins: PurchaseOrigin[], seriesMap: Map<PurchaseOrigin, ChartDataPoint[]>): EChartsOption {
    return {
      backgroundColor: '#1a1410',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#2a241f',
        borderColor: '#d4a853',
        borderWidth: 1,
        textStyle: { color: '#f4e8c1', fontSize: 12 },
        formatter: (params: any): string => {
          const d: ChartDataPoint = params.data;
          const date = new Date(d.value[0]).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const orderColor = ORDER_TYPE_COLORS[d.orderType];
          const orderLabel = ORDER_TYPE_LABELS[d.orderType];

          const pricesHtml = d.prices
            .map(
              pp =>
                `<span style="color:#a08060">${PRICE_LABELS[pp.type]}:</span> ` +
                `<strong style="color:#f4e8c1">${pp.unitPrice}</strong>` +
                (pp.quantity > 1 ? ` <span style="color:#8b7355">×${pp.quantity}</span>` : '')
            )
            .join('<br/>');

          return `
            <div style="min-width:180px">
              <div style="color:#d4a853;font-weight:600;margin-bottom:6px">${date}</div>
              <div style="margin-bottom:6px">${pricesHtml}</div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
                <span style="color:#a08060">≈</span>
                <strong style="color:#22c55e">${d.value[1]} Ecto</strong>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="color:#a08060">Order:</span>
                <span style="color:${orderColor};font-weight:600">${orderLabel}</span>
              </div>
            </div>`;
        }
      },
      legend: {
        data: origins.map(o => ORIGIN_LABELS[o]), // one entry per origin; toggling hides both scatter + trend
        textStyle: { color: '#f4e8c1' },
        top: 8,
        inactiveColor: '#3a3430'
      },
      grid: { left: 70, right: 30, top: 48, bottom: 36, containLabel: false },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#3a3430' } },
        axisLabel: {
          color: '#a08060',
          formatter: (v: number): string => new Date(v).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
        },
        splitLine: { lineStyle: { color: '#2a241f' } }
      },
      yAxis: {
        type: 'value',
        name: 'Ecto equiv.',
        nameTextStyle: { color: '#a08060', fontSize: 11 },
        axisLine: { lineStyle: { color: '#3a3430' } },
        axisLabel: { color: '#a08060' },
        splitLine: { lineStyle: { color: '#2a241f' } }
      },
      series: origins.flatMap(origin => {
        const points = seriesMap.get(origin)!;
        const color = ORIGIN_COLORS[origin];
        const label = ORIGIN_LABELS[origin];
        const trend = this.computeTrend(points);
        return [
          // ── Scatter cloud (no connecting line) ─────────────────────────────
          {
            name: label,
            type: 'line' as const,
            data: points as any[],
            lineStyle: { width: 0, opacity: 0 },
            showSymbol: true,
            symbol: (value: any, params: any): string => {
              const d = params.data as ChartDataPoint;
              if (d.orderType === OrderType.BUY) return 'rect';
              if (d.orderType === OrderType.AUCTION) return 'diamond';
              return 'circle';
            },
            symbolSize: 10,
            itemStyle: { color },
            emphasis: { scale: 1.4 }
          },
          // ── 7-day rolling average trend (same name → same legend toggle) ───
          {
            name: label,
            type: 'line' as const,
            data: trend as any[],
            smooth: true,
            showSymbol: false,
            lineStyle: { color, width: 2, opacity: 0.4 },
            itemStyle: { color, opacity: 0 },
            silent: true,
            tooltip: { show: false } as any,
            emphasis: { disabled: true } as any
          }
        ];
      })
    };
  }

  cancel(): void {
    this.dismiss();
  }
}
