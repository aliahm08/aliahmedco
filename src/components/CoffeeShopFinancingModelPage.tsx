import {type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  Receipt,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const DEFAULTS = {
  buyoutPrice: 150000,
  retrofitCost: 200000,
  franchiseFee: 40000,
  monthlyRevenue: 75000,
  cogsPct: 0.25,
  labor: 24000,
  rent: 8000,
  utilities: 3000,
  insuranceMisc: 1500,
  taxRate: 0.27,
  annualGrowthRate: 3,
  ownerDistribution: 100,
  reinvestmentRate: 15,
  downYear: 2,
  downturnImpact: 20,
  targetPaybackMonths: 30,
} as const;

type MilestoneColor = 'red' | 'amber' | 'green' | 'violet';

type Row = {
  year: number;
  annualNetProfit: number;
  investorShare: number;
  reinvested: number;
  takeHome: number;
  cumulativeTakeHome: number;
  cumulativeValue: number;
  cumulativeTakeHomeNegative: number | null;
  cumulativeTakeHomePositive: number | null;
  roiOnOriginalCapital: number;
  milestone: string;
  milestoneColor: MilestoneColor;
  isSynthetic?: boolean;
};

type ProjectionResult = {
  rows: Row[];
  paybackYear: number | null;
  paybackMonth: string | null;
  paybackMonthsExact: number | null;
};

type DrilldownCardProps = {
  title: string;
  icon: ComponentType<{size?: number; className?: string}>;
  value: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
};

type FilterCardProps = {
  title: string;
  icon: ComponentType<{size?: number; className?: string}>;
  value: string;
  subtitle?: string;
  children: ReactNode;
};

type EditableLineItemProps = {
  label: string;
  value: number;
  onSave: (value: number) => void;
  formatter?: (value: number) => string;
  step?: string;
  min?: number;
  max?: number;
};

type ReportMetric = {label: string; value: string};

function milestoneLabel(cumulativeCash: number, initialInvestment: number) {
  if (cumulativeCash < 0) return 'Underwater';
  if (cumulativeCash < initialInvestment) return 'Recovering capital';
  if (cumulativeCash < initialInvestment * 2) return 'Capital repaid';
  if (cumulativeCash < initialInvestment * 4) return 'Compounding';
  return 'High-return asset';
}

function milestoneColor(cumulativeCash: number, initialInvestment: number): MilestoneColor {
  if (cumulativeCash < 0) return 'red';
  if (cumulativeCash < initialInvestment) return 'amber';
  if (cumulativeCash < initialInvestment * 2) return 'green';
  return 'violet';
}

function computeMonthlyNetProfit(args: {
  monthlyRevenue: number;
  cogsPct: number;
  labor: number;
  rent: number;
  utilities: number;
  insuranceMisc: number;
  taxRate: number;
}) {
  const cogs = args.monthlyRevenue * args.cogsPct;
  const pretaxProfit =
    args.monthlyRevenue - cogs - args.labor - args.rent - args.utilities - args.insuranceMisc;
  const taxes = pretaxProfit > 0 ? pretaxProfit * args.taxRate : 0;
  const netProfit = pretaxProfit - taxes;
  return {cogs, pretaxProfit, taxes, netProfit};
}

function buildProjection(args: {
  monthlyNetProfit: number;
  annualGrowthRate: number;
  ownerDistribution: number;
  reinvestmentRate: number;
  downYear: number;
  downturnImpact: number;
  initialInvestment: number;
}): ProjectionResult {
  const rows: Row[] = [];
  let cumulativeTakeHome = 0;
  let paybackYear: number | null = null;
  let paybackMonth: string | null = null;
  let paybackMonthsExact: number | null = null;

  for (let year = 1; year <= 10; year += 1) {
    const grownMonthlyProfit =
      args.monthlyNetProfit * Math.pow(1 + args.annualGrowthRate / 100, year - 1);
    const shockMultiplier = year === args.downYear ? 1 - args.downturnImpact / 100 : 1;
    const annualNetProfit = grownMonthlyProfit * 12 * shockMultiplier;
    const investorShare = annualNetProfit * (args.ownerDistribution / 100);
    const reinvested = investorShare * (args.reinvestmentRate / 100);
    const takeHome = investorShare - reinvested;
    const cumulativeBefore = cumulativeTakeHome;
    cumulativeTakeHome += takeHome;

    if (!paybackYear && cumulativeTakeHome >= args.initialInvestment) {
      paybackYear = year;
      const amountNeededAtStartOfYear = args.initialInvestment - cumulativeBefore;
      const monthlyTakeHomeInPaybackYear = takeHome / 12;
      const monthsIntoYear =
        monthlyTakeHomeInPaybackYear > 0
          ? Math.min(Math.ceil(amountNeededAtStartOfYear / monthlyTakeHomeInPaybackYear), 12)
          : null;
      paybackMonth = monthsIntoYear ? `Year ${year}, month ${monthsIntoYear}` : `Year ${year}`;
      paybackMonthsExact = monthsIntoYear ? (year - 1) * 12 + monthsIntoYear : year * 12;
    }

    const cumulativeValue = cumulativeTakeHome - args.initialInvestment;

    rows.push({
      year,
      annualNetProfit,
      investorShare,
      reinvested,
      takeHome,
      cumulativeTakeHome,
      cumulativeValue,
      cumulativeTakeHomeNegative: cumulativeValue < 0 ? cumulativeTakeHome : null,
      cumulativeTakeHomePositive: cumulativeValue >= 0 ? cumulativeTakeHome : null,
      roiOnOriginalCapital:
        args.initialInvestment > 0 ? cumulativeTakeHome / args.initialInvestment : 0,
      milestone: milestoneLabel(cumulativeTakeHome, args.initialInvestment),
      milestoneColor: milestoneColor(cumulativeTakeHome, args.initialInvestment),
    });
  }

  return {rows, paybackYear, paybackMonth, paybackMonthsExact};
}

function addPaybackCrossoverRows(rows: Row[], initialInvestment: number) {
  const withCrossovers: Row[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const current = rows[i];
    const next = rows[i + 1];
    withCrossovers.push(current);
    if (!next) continue;

    const crossesThreshold =
      current.cumulativeTakeHome < initialInvestment && next.cumulativeTakeHome > initialInvestment;
    if (!crossesThreshold) continue;

    const segmentDelta = next.cumulativeTakeHome - current.cumulativeTakeHome;
    const t =
      segmentDelta === 0
        ? 0
        : (initialInvestment - current.cumulativeTakeHome) / segmentDelta;
    const crossYear = current.year + t * (next.year - current.year);

    withCrossovers.push({
      year: Number(crossYear.toFixed(2)),
      annualNetProfit:
        current.annualNetProfit + t * (next.annualNetProfit - current.annualNetProfit),
      investorShare: current.investorShare + t * (next.investorShare - current.investorShare),
      reinvested: current.reinvested + t * (next.reinvested - current.reinvested),
      takeHome: current.takeHome + t * (next.takeHome - current.takeHome),
      cumulativeTakeHome: initialInvestment,
      cumulativeValue: 0,
      cumulativeTakeHomeNegative: null,
      cumulativeTakeHomePositive: initialInvestment,
      roiOnOriginalCapital: 1,
      milestone: 'Capital repaid',
      milestoneColor: 'green',
      isSynthetic: true,
    });
  }

  return withCrossovers.sort((a, b) => a.year - b.year);
}

function solveMonthlyRevenueForPayback(args: {
  targetPaybackMonths: number;
  annualGrowthRate: number;
  ownerDistribution: number;
  reinvestmentRate: number;
  downYear: number;
  downturnImpact: number;
  initialInvestment: number;
  cogsPct: number;
  labor: number;
  rent: number;
  utilities: number;
  insuranceMisc: number;
  taxRate: number;
}) {
  if (args.targetPaybackMonths <= 0 || args.initialInvestment <= 0) return 0;

  let low = 0;
  let high = 250000;

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    const pnl = computeMonthlyNetProfit({
      monthlyRevenue: mid,
      cogsPct: args.cogsPct,
      labor: args.labor,
      rent: args.rent,
      utilities: args.utilities,
      insuranceMisc: args.insuranceMisc,
      taxRate: args.taxRate,
    });
    const projection = buildProjection({
      monthlyNetProfit: pnl.netProfit,
      annualGrowthRate: args.annualGrowthRate,
      ownerDistribution: args.ownerDistribution,
      reinvestmentRate: args.reinvestmentRate,
      downYear: args.downYear,
      downturnImpact: args.downturnImpact,
      initialInvestment: args.initialInvestment,
    });
    const payback = projection.paybackMonthsExact ?? Number.POSITIVE_INFINITY;
    if (payback <= args.targetPaybackMonths) high = mid;
    else low = mid;
  }

  return Math.round(high);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStatList(metrics: ReportMetric[]) {
  return metrics
    .map(
      (metric) => `
        <div class="pdf-stat-line">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </div>
      `,
    )
    .join('');
}

function buildPdfReportHtml(args: {
  generatedAt: string;
  initialInvestment: number;
  monthlyRevenue: number;
  monthlyNetProfit: number;
  paybackMonth: string | null;
  cumulativeTakeHome: number;
  totalROI: number;
  year10TakeHome: number;
  assumptions: ReportMetric[];
  filters: ReportMetric[];
  bridge: ReportMetric[];
  rows: Row[];
}) {
  const tableRows = args.rows
    .map(
      (row) => `
        <tr>
          <td>Year ${row.year}</td>
          <td>${escapeHtml(currency.format(row.annualNetProfit))}</td>
          <td>${escapeHtml(currency.format(row.takeHome))}</td>
          <td>${escapeHtml(currency.format(row.cumulativeTakeHome))}</td>
          <td>${escapeHtml(currency.format(row.cumulativeValue))}</td>
          <td>${escapeHtml(row.milestone)}</td>
        </tr>
      `,
    )
    .join('');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Investor Income Projection Report</title>
      <style>
        @page { size: Letter; margin: 0.5in; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #0f172a; font-family: Inter, Arial, sans-serif; background: #fff; }
        .report { display: grid; gap: 16px; }
        .hero { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
        .eyebrow, h2 { margin: 0; text-transform: uppercase; letter-spacing: .12em; font-size: 10px; color: #64748b; }
        h1 { margin: 6px 0 10px; font-size: 28px; line-height: .95; letter-spacing: -.04em; }
        p { margin: 0; font-size: 12px; line-height: 1.55; }
        .panel { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; background: #f8fafc; }
        .meta { color: #64748b; display: grid; gap: 4px; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .metric { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
        .metric strong { display: block; margin-top: 6px; font-size: 20px; letter-spacing: -.03em; }
        .cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .pdf-stat-line { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .pdf-stat-line:last-child { border-bottom: 0; padding-bottom: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; background: #eef2ff; color: #64748b; }
        td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        tbody tr:nth-child(even) { background: #fbfdff; }
      </style>
    </head>
    <body>
      <main class="report">
        <section class="hero">
          <div>
            <p class="eyebrow">Investor Income Projection</p>
            <h1>10-Year financing dashboard report</h1>
            <p>Clean PDF export of the current dashboard state, including live assumption edits and scenario changes.</p>
          </div>
          <div class="panel meta">
            <p>Generated ${escapeHtml(args.generatedAt)}</p>
            <p>Payback: ${escapeHtml(args.paybackMonth ?? 'Beyond 10 years')}</p>
            <p>Year 10 take-home: ${escapeHtml(currency.format(args.year10TakeHome))}</p>
          </div>
        </section>
        <section class="summary">
          <article class="metric"><p class="eyebrow">Initial investment</p><strong>${escapeHtml(currency.format(args.initialInvestment))}</strong></article>
          <article class="metric"><p class="eyebrow">Monthly revenue</p><strong>${escapeHtml(currency.format(args.monthlyRevenue))}</strong></article>
          <article class="metric"><p class="eyebrow">Monthly net profit</p><strong>${escapeHtml(currency.format(args.monthlyNetProfit))}</strong></article>
          <article class="metric"><p class="eyebrow">Payback</p><strong>${escapeHtml(args.paybackMonth ?? 'Beyond 10 years')}</strong></article>
          <article class="metric"><p class="eyebrow">10-year take-home</p><strong>${escapeHtml(currency.format(args.cumulativeTakeHome))}</strong></article>
          <article class="metric"><p class="eyebrow">10-year ROI</p><strong>${escapeHtml(percent.format(args.totalROI))}</strong></article>
        </section>
        <section class="cols">
          <article class="panel"><h2>Operating Assumptions</h2>${renderStatList(args.assumptions)}</article>
          <article class="panel"><h2>Investor Filters</h2>${renderStatList(args.filters)}</article>
        </section>
        <section class="cols">
          <article class="panel"><h2>Return Bridge</h2>${renderStatList(args.bridge)}</article>
          <article class="panel"><h2>Reading Notes</h2><p>Cumulative value equals cumulative take-home less original invested capital.</p><p>Milestones show the recovery path from underwater to compounding asset.</p></article>
        </section>
        <section class="panel">
          <h2>10-Year Schedule</h2>
          <table>
            <thead>
              <tr><th>Year</th><th>Annual net profit</th><th>Investor take-home</th><th>Cumulative take-home</th><th>Cumulative value</th><th>Milestone</th></tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </section>
      </main>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>`;
}

function FieldLabel(props: {children: ReactNode}) {
  return <label className="model-ui-label">{props.children}</label>;
}

function DrilldownCard(props: DrilldownCardProps) {
  const Icon = props.icon;

  return (
    <div className="model-drilldown">
      <div className={`model-card model-drilldown-card ${props.open ? 'is-open' : ''}`}>
        <button type="button" onClick={props.onToggle} className="model-card-button">
          <div className="model-card-body">
            <div className="model-card-row">
              <div className="model-card-copy">
                <div className="model-card-kicker">
                  <Icon size={16} />
                  {props.title}
                </div>
                <div className="model-card-value">{props.value}</div>
                {props.subtitle ? <div className="model-card-subtitle">{props.subtitle}</div> : null}
              </div>
              <div className="model-card-chevron">
                {props.open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </div>
        </button>
      </div>

      {props.open ? (
        <>
          <button type="button" aria-label="Close panel" onClick={props.onClose} className="model-overlay" />
          <div className="model-drilldown-panel">
            <div className="model-drilldown-header">
              <div className="model-card-kicker">
                <Icon size={16} />
                {props.title}
              </div>
              <div className="model-drilldown-value">{props.value}</div>
            </div>
            <div className="model-drilldown-content">{props.children}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterCard(props: FilterCardProps) {
  const Icon = props.icon;

  return (
    <div className="model-card model-filter-card">
      <div className="model-card-body">
        <div className="model-card-copy">
          <div className="model-card-kicker">
            <Icon size={16} />
            {props.title}
          </div>
          <div className="model-card-value">{props.value}</div>
          {props.subtitle ? <div className="model-card-subtitle">{props.subtitle}</div> : null}
        </div>
        <div className="model-filter-body">{props.children}</div>
      </div>
    </div>
  );
}

function EditableLineItem(props: EditableLineItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(props.value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(String(props.value));
  }, [props.value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    let next = Number(draft);
    if (!Number.isFinite(next)) {
      setDraft(String(props.value));
      setEditing(false);
      return;
    }
    if (typeof props.min === 'number') next = Math.max(props.min, next);
    if (typeof props.max === 'number') next = Math.min(props.max, next);
    props.onSave(next);
    setEditing(false);
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="model-editable-row">
      <span>{props.label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          step={props.step ?? '1'}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') {
              setDraft(String(props.value));
              setEditing(false);
            }
          }}
          className="model-editable-input"
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <span className="model-editable-value">
          {(props.formatter ?? ((value) => currency.format(value)))(props.value)}
        </span>
      )}
    </button>
  );
}

function badgeClasses(color: MilestoneColor) {
  switch (color) {
    case 'red':
      return 'model-badge model-badge-red';
    case 'amber':
      return 'model-badge model-badge-amber';
    case 'green':
      return 'model-badge model-badge-green';
    default:
      return 'model-badge model-badge-violet';
  }
}

export default function CoffeeShopFinancingModelPage() {
  const [buyoutPrice, setBuyoutPrice] = useState(DEFAULTS.buyoutPrice);
  const [retrofitCost, setRetrofitCost] = useState(DEFAULTS.retrofitCost);
  const [franchiseFee, setFranchiseFee] = useState(DEFAULTS.franchiseFee);
  const [monthlyRevenue, setMonthlyRevenue] = useState(DEFAULTS.monthlyRevenue);
  const [cogsPct, setCogsPct] = useState(DEFAULTS.cogsPct);
  const [labor, setLabor] = useState(DEFAULTS.labor);
  const [rent, setRent] = useState(DEFAULTS.rent);
  const [utilities, setUtilities] = useState(DEFAULTS.utilities);
  const [insuranceMisc, setInsuranceMisc] = useState(DEFAULTS.insuranceMisc);
  const [taxRate, setTaxRate] = useState(DEFAULTS.taxRate);
  const [annualGrowthRate, setAnnualGrowthRate] = useState(DEFAULTS.annualGrowthRate);
  const [ownerDistribution, setOwnerDistribution] = useState(DEFAULTS.ownerDistribution);
  const [reinvestmentRate, setReinvestmentRate] = useState(DEFAULTS.reinvestmentRate);
  const [downYear, setDownYear] = useState(DEFAULTS.downYear);
  const [downturnImpact, setDownturnImpact] = useState(DEFAULTS.downturnImpact);
  const [targetPaybackMonths, setTargetPaybackMonths] = useState(DEFAULTS.targetPaybackMonths);
  const [openCard, setOpenCard] = useState('');

  const initialInvestment = buyoutPrice + retrofitCost + franchiseFee;

  const monthlyPnl = useMemo(
    () =>
      computeMonthlyNetProfit({
        monthlyRevenue,
        cogsPct,
        labor,
        rent,
        utilities,
        insuranceMisc,
        taxRate,
      }),
    [monthlyRevenue, cogsPct, labor, rent, utilities, insuranceMisc, taxRate],
  );

  const projection = useMemo(
    () =>
      buildProjection({
        monthlyNetProfit: monthlyPnl.netProfit,
        annualGrowthRate,
        ownerDistribution,
        reinvestmentRate,
        downYear,
        downturnImpact,
        initialInvestment,
      }),
    [
      monthlyPnl.netProfit,
      annualGrowthRate,
      ownerDistribution,
      reinvestmentRate,
      downYear,
      downturnImpact,
      initialInvestment,
    ],
  );

  const graph1Rows = useMemo(
    () => addPaybackCrossoverRows(projection.rows, initialInvestment),
    [projection.rows, initialInvestment],
  );

  const summary = useMemo(() => {
    const finalYear = projection.rows[projection.rows.length - 1];
    const avgAnnualTakeHome =
      projection.rows.reduce((sum, row) => sum + row.takeHome, 0) / projection.rows.length;

    return {
      paybackYear: projection.paybackYear,
      paybackMonth: projection.paybackMonth,
      paybackMonthsExact: projection.paybackMonthsExact,
      cumulativeTakeHome: finalYear?.cumulativeTakeHome ?? 0,
      year10TakeHome: finalYear?.takeHome ?? 0,
      totalROI:
        initialInvestment > 0 ? (finalYear?.cumulativeTakeHome ?? 0) / initialInvestment : 0,
      avgAnnualTakeHome,
    };
  }, [projection, initialInvestment]);

  const roiBridge = useMemo(() => {
    const yearOneAnnualNetProfit =
      monthlyPnl.netProfit * 12 * (1 - (downYear === 1 ? downturnImpact / 100 : 0));
    const distributedProfit = yearOneAnnualNetProfit * (ownerDistribution / 100);
    const takeHomeAfterReinvestment = distributedProfit * (1 - reinvestmentRate / 100);
    const simpleCashYield =
      initialInvestment > 0 ? takeHomeAfterReinvestment / initialInvestment : 0;
    const growthContribution =
      initialInvestment > 0
        ? (summary.avgAnnualTakeHome - takeHomeAfterReinvestment) / initialInvestment
        : 0;

    return {
      yearOneAnnualNetProfit,
      distributedProfit,
      takeHomeAfterReinvestment,
      simpleCashYield,
      growthContribution,
    };
  }, [
    monthlyPnl.netProfit,
    downYear,
    downturnImpact,
    ownerDistribution,
    reinvestmentRate,
    initialInvestment,
    summary.avgAnnualTakeHome,
  ]);

  const paybackPoint = graph1Rows.find((row) => row.cumulativeTakeHome >= initialInvestment);
  const minCumulativeValue = Math.min(...graph1Rows.map((row) => row.cumulativeValue), 0);
  const maxGraphValue = Math.max(
    ...graph1Rows.map((row) => Math.max(row.cumulativeTakeHome, row.cumulativeValue)),
    0,
    initialInvestment * 1.05,
  );

  const reportAssumptions = useMemo<ReportMetric[]>(
    () => [
      {label: 'Buyout price', value: currency.format(buyoutPrice)},
      {label: 'Retrofit + FF&E', value: currency.format(retrofitCost)},
      {label: 'Franchise fee', value: currency.format(franchiseFee)},
      {label: 'COGS', value: percent.format(cogsPct)},
      {label: 'Labor', value: currency.format(labor)},
      {label: 'Rent', value: currency.format(rent)},
      {label: 'Utilities', value: currency.format(utilities)},
      {label: 'Insurance + misc', value: currency.format(insuranceMisc)},
      {label: 'Tax rate', value: percent.format(taxRate)},
    ],
    [buyoutPrice, retrofitCost, franchiseFee, cogsPct, labor, rent, utilities, insuranceMisc, taxRate],
  );

  const reportFilters = useMemo<ReportMetric[]>(
    () => [
      {label: 'Annual growth', value: `${annualGrowthRate}%`},
      {label: 'Owner distribution', value: `${ownerDistribution}%`},
      {label: 'Reinvestment', value: `${reinvestmentRate}%`},
      {label: 'Target payback', value: `${targetPaybackMonths} months`},
      {label: 'Down year', value: `${downYear}`},
      {label: 'Downturn impact', value: `${downturnImpact}%`},
    ],
    [annualGrowthRate, ownerDistribution, reinvestmentRate, targetPaybackMonths, downYear, downturnImpact],
  );

  const reportBridge = useMemo<ReportMetric[]>(
    () => [
      {label: 'Year 1 annual net profit', value: currency.format(roiBridge.yearOneAnnualNetProfit)},
      {label: 'Investor distribution', value: currency.format(roiBridge.distributedProfit)},
      {label: 'Take-home after reinvestment', value: currency.format(roiBridge.takeHomeAfterReinvestment)},
      {label: 'Year 1 cash yield', value: percent.format(roiBridge.simpleCashYield)},
      {label: 'Growth contribution', value: percent.format(roiBridge.growthContribution)},
      {label: '10-year ROI on original capital', value: percent.format(summary.totalROI)},
    ],
    [roiBridge, summary.totalROI],
  );

  function setDesiredPayback(months: number) {
    const safeMonths = Math.max(6, Math.min(120, Math.round(months)));
    setTargetPaybackMonths(safeMonths);
    const requiredRevenue = solveMonthlyRevenueForPayback({
      targetPaybackMonths: safeMonths,
      annualGrowthRate,
      ownerDistribution,
      reinvestmentRate,
      downYear,
      downturnImpact,
      initialInvestment,
      cogsPct,
      labor,
      rent,
      utilities,
      insuranceMisc,
      taxRate,
    });
    setMonthlyRevenue(requiredRevenue);
  }

  function resetChanges() {
    setBuyoutPrice(DEFAULTS.buyoutPrice);
    setRetrofitCost(DEFAULTS.retrofitCost);
    setFranchiseFee(DEFAULTS.franchiseFee);
    setMonthlyRevenue(DEFAULTS.monthlyRevenue);
    setCogsPct(DEFAULTS.cogsPct);
    setLabor(DEFAULTS.labor);
    setRent(DEFAULTS.rent);
    setUtilities(DEFAULTS.utilities);
    setInsuranceMisc(DEFAULTS.insuranceMisc);
    setTaxRate(DEFAULTS.taxRate);
    setAnnualGrowthRate(DEFAULTS.annualGrowthRate);
    setOwnerDistribution(DEFAULTS.ownerDistribution);
    setReinvestmentRate(DEFAULTS.reinvestmentRate);
    setDownYear(DEFAULTS.downYear);
    setDownturnImpact(DEFAULTS.downturnImpact);
    setTargetPaybackMonths(DEFAULTS.targetPaybackMonths);
    setOpenCard('');
  }

  function downloadReport() {
    const reportHtml = buildPdfReportHtml({
      generatedAt: new Date().toLocaleString(),
      initialInvestment,
      monthlyRevenue,
      monthlyNetProfit: monthlyPnl.netProfit,
      paybackMonth: summary.paybackMonth,
      cumulativeTakeHome: summary.cumulativeTakeHome,
      totalROI: summary.totalROI,
      year10TakeHome: summary.year10TakeHome,
      assumptions: reportAssumptions,
      filters: reportFilters,
      bridge: reportBridge,
      rows: projection.rows,
    });

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }

  return (
    <div className="model-dashboard-app">
      <div className="model-dashboard-shell">
        <div className="model-topbar-card">
          <div className="model-topbar-copy">
            <h1>10-Year Investor Income Projection</h1>
            <p>
              Interactive view of how your take-home income could evolve over 10 years. Optimized
              for one-page desktop review and a stacked mobile layout.
            </p>
          </div>
          <div className="model-topbar-actions">
            <button type="button" onClick={resetChanges} className="model-ghost-button">
              <RotateCcw size={16} />
              Reset changes
            </button>
            <button type="button" onClick={downloadReport} className="model-primary-button">
              <Download size={16} />
              Download report
            </button>
          </div>
        </div>

        <div className="model-kpi-grid">
          <DrilldownCard
            title="Initial investment"
            icon={DollarSign}
            value={currency.format(initialInvestment)}
            subtitle="Includes buyout, retrofit, and franchise fee"
            open={openCard === 'initialInvestment'}
            onToggle={() => setOpenCard(openCard === 'initialInvestment' ? '' : 'initialInvestment')}
            onClose={() => setOpenCard('')}
          >
            <div className="model-stack">
              <div className="model-form-grid">
                <div>
                  <FieldLabel>Buyout price</FieldLabel>
                  <input
                    className="model-input"
                    type="number"
                    value={buyoutPrice}
                    onChange={(event) => setBuyoutPrice(Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <FieldLabel>Retrofit + FF&amp;E</FieldLabel>
                  <input
                    className="model-input"
                    type="number"
                    value={retrofitCost}
                    onChange={(event) => setRetrofitCost(Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <FieldLabel>Franchise fee</FieldLabel>
                  <input
                    className="model-input"
                    type="number"
                    value={franchiseFee}
                    onChange={(event) => setFranchiseFee(Number(event.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="model-inline-heading">
                <Receipt size={16} />
                Assumptions
              </div>
              <div className="model-stack-sm">
                <div className="model-stat-pill"><span>Buyout price</span><strong>{currency.format(buyoutPrice)}</strong></div>
                <div className="model-stat-pill"><span>Retrofit + FF&amp;E</span><strong>{currency.format(retrofitCost)}</strong></div>
                <div className="model-stat-pill"><span>Franchise fee</span><strong>{currency.format(franchiseFee)}</strong></div>
                <div className="model-stat-pill model-stat-pill-dark"><span>Total initial investment</span><strong>{currency.format(initialInvestment)}</strong></div>
              </div>
            </div>
          </DrilldownCard>

          <DrilldownCard
            title="Monthly net profit"
            icon={TrendingUp}
            value={currency.format(monthlyPnl.netProfit)}
            subtitle="Derived from editable P&L assumptions"
            open={openCard === 'netProfit'}
            onToggle={() => setOpenCard(openCard === 'netProfit' ? '' : 'netProfit')}
            onClose={() => setOpenCard('')}
          >
            <div className="model-stack">
              <div className="model-inline-between">
                <div className="model-inline-heading">
                  <Calculator size={16} />
                  P&amp;L detail
                </div>
                <div className="model-caption">Click to edit</div>
              </div>
              <div className="model-stack-sm">
                <EditableLineItem label="Monthly revenue" value={monthlyRevenue} onSave={setMonthlyRevenue} />
                <EditableLineItem
                  label={`COGS (${percent.format(cogsPct)})`}
                  value={cogsPct}
                  onSave={(value) => setCogsPct(Math.max(0, Math.min(1, value)))}
                  formatter={(value) => percent.format(value)}
                  step="0.01"
                  min={0}
                  max={1}
                />
                <EditableLineItem label="Labor" value={labor} onSave={setLabor} />
                <EditableLineItem label="Rent" value={rent} onSave={setRent} />
                <EditableLineItem label="Utilities" value={utilities} onSave={setUtilities} />
                <EditableLineItem label="Insurance + misc." value={insuranceMisc} onSave={setInsuranceMisc} />
                <div className="model-stat-pill"><span>Pre-tax profit</span><strong>{currency.format(monthlyPnl.pretaxProfit)}</strong></div>
                <EditableLineItem
                  label={`Tax rate (${percent.format(taxRate)})`}
                  value={taxRate}
                  onSave={(value) => setTaxRate(Math.max(0, Math.min(1, value)))}
                  formatter={(value) => percent.format(value)}
                  step="0.01"
                  min={0}
                  max={1}
                />
                <div className="model-stat-pill model-stat-pill-dark"><span>Monthly net profit</span><strong>{currency.format(monthlyPnl.netProfit)}</strong></div>
              </div>
            </div>
          </DrilldownCard>

          <DrilldownCard
            title="Annual growth"
            icon={Target}
            value={`${annualGrowthRate}%`}
            subtitle="Expands into the ROI calculation bridge"
            open={openCard === 'growth'}
            onToggle={() => setOpenCard(openCard === 'growth' ? '' : 'growth')}
            onClose={() => setOpenCard('')}
          >
            <div className="model-stack">
              <div>
                <FieldLabel>Annual growth rate</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="-5"
                  max="15"
                  step="0.5"
                  value={annualGrowthRate}
                  onChange={(event) => setAnnualGrowthRate(Number(event.target.value))}
                />
              </div>
              <div className="model-stack-sm">
                <div className="model-stat-pill"><span>Year 1 annual net profit</span><strong>{currency.format(roiBridge.yearOneAnnualNetProfit)}</strong></div>
                <div className="model-stat-pill"><span>Investor distribution</span><strong>{currency.format(roiBridge.distributedProfit)}</strong></div>
                <div className="model-stat-pill"><span>Take-home after reinvestment</span><strong>{currency.format(roiBridge.takeHomeAfterReinvestment)}</strong></div>
                <div className="model-stat-pill"><span>Year 1 cash yield</span><strong>{percent.format(roiBridge.simpleCashYield)}</strong></div>
                <div className="model-stat-pill"><span>Growth effect on average annual take-home</span><strong>{percent.format(roiBridge.growthContribution)}</strong></div>
                <div className="model-stat-pill model-stat-pill-dark"><span>10-year ROI on original capital</span><strong>{percent.format(summary.totalROI)}</strong></div>
              </div>
            </div>
          </DrilldownCard>
        </div>

        <div className="model-controls-grid">
          <div className="model-card">
            <div className="model-panel-header">
              <h2>Stress event</h2>
            </div>
            <div className="model-stress-grid">
              <div className="model-stack">
                <FieldLabel>Down year: {downYear}</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={downYear}
                  onChange={(event) => setDownYear(Number(event.target.value))}
                />
              </div>
              <div className="model-stack">
                <FieldLabel>Profit hit in down year: {downturnImpact}%</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={downturnImpact}
                  onChange={(event) => setDownturnImpact(Number(event.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="model-filter-grid">
            <FilterCard title="Owner distribution" icon={DollarSign} value={`${ownerDistribution}%`} subtitle="Editable filter">
              <div className="model-stack">
                <FieldLabel>Owner distribution</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={ownerDistribution}
                  onChange={(event) => setOwnerDistribution(Number(event.target.value))}
                />
                <div className="model-stat-pill">
                  Annual investor share: <strong>{currency.format(roiBridge.distributedProfit)}</strong>
                </div>
              </div>
            </FilterCard>

            <FilterCard title="Reinvestment" icon={TrendingUp} value={`${reinvestmentRate}%`} subtitle="Editable filter">
              <div className="model-stack">
                <FieldLabel>Reinvestment rate</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={reinvestmentRate}
                  onChange={(event) => setReinvestmentRate(Number(event.target.value))}
                />
                <div className="model-stat-pill">
                  Year-1 reinvestment:{' '}
                  <strong>{currency.format(roiBridge.distributedProfit * (reinvestmentRate / 100))}</strong>
                </div>
              </div>
            </FilterCard>

            <FilterCard title="Payback timing" icon={Calendar} value={`${targetPaybackMonths} mo`} subtitle="Editable filter that recalibrates revenue">
              <div className="model-stack">
                <FieldLabel>Target payback: {targetPaybackMonths} months</FieldLabel>
                <input
                  className="model-range"
                  type="range"
                  min="6"
                  max="120"
                  step="1"
                  value={targetPaybackMonths}
                  onChange={(event) => setDesiredPayback(Number(event.target.value))}
                />
                <input
                  className="model-input"
                  type="number"
                  value={targetPaybackMonths}
                  onChange={(event) => setDesiredPayback(Number(event.target.value) || 6)}
                />
              </div>
            </FilterCard>
          </div>
        </div>

        <div className="model-chart-panels">
          <div className="model-card">
            <div className="model-panel-header">
              <h2>Cumulative investor income vs initial investment</h2>
            </div>
            <div className="model-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph1Rows} margin={{top: 8, right: 12, left: 8, bottom: 4}}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" type="number" domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{fontSize: 12}} />
                  <YAxis tickFormatter={(value) => currency.format(value)} width={88} tick={{fontSize: 12}} />
                  <Tooltip
                    content={({active, payload, label}) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const row = payload[0]?.payload as Row | undefined;
                      if (!row) return null;
                      return (
                        <div className="model-tooltip">
                          <div className="model-tooltip-title">Year {label}</div>
                          <div className={row.cumulativeValue < 0 ? 'model-tooltip-red' : 'model-tooltip-green'}>
                            Cumulative take-home: {currency.format(row.cumulativeTakeHome)}
                          </div>
                          <div className="model-tooltip-blue">
                            Cumulative value: {currency.format(row.cumulativeValue)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="cumulativeTakeHomeNegative" stroke="#dc2626" fill="#fecaca" fillOpacity={0.34} connectNulls />
                  <Area type="monotone" dataKey="cumulativeTakeHomePositive" stroke="#16a34a" fill="#bbf7d0" fillOpacity={0.34} connectNulls />
                  <Line type="monotone" dataKey="cumulativeTakeHomeNegative" stroke="#dc2626" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="cumulativeTakeHomePositive" stroke="#16a34a" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="cumulativeValue" stroke="#2563eb" strokeWidth={3} dot={false} />
                  <ReferenceLine y={0} stroke="#0f172a" strokeDasharray="6 6" label={{value: 'Payback threshold', position: 'insideTopRight', fill: '#0f172a', fontSize: 11}} />
                  {paybackPoint ? (
                    <ReferenceLine x={paybackPoint.year} stroke="#334155" strokeDasharray="4 4" label={{value: `Payback: ${summary.paybackMonth}`, angle: -90, position: 'insideLeft', fill: '#334155', fontSize: 11}} />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="model-chart-notes model-chart-notes-three">
              <div className="model-note-box">Cumulative take-home switches red or green based on whether cumulative value is below or above zero.</div>
              <div className="model-note-box model-note-box-blue">Blue line: cumulative value after initial investment.</div>
              <div className="model-note-box">Hover shows only cumulative take-home and cumulative value.</div>
            </div>
          </div>

          <div className="model-card">
            <div className="model-panel-header">
              <h2>Annual profit and investor take-home</h2>
            </div>
            <div className="model-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection.rows} margin={{top: 8, right: 12, left: 8, bottom: 4}}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" type="number" domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{fontSize: 12}} />
                  <YAxis tickFormatter={(value) => currency.format(value)} width={88} tick={{fontSize: 12}} />
                  <Tooltip
                    formatter={(value, name) => [
                      currency.format(Number(value)),
                      name === 'annualNetProfit' ? 'Annual net profit' : 'Investor take-home',
                    ]}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" label={{value: 'Profit baseline', position: 'insideBottomLeft', fill: '#64748b', fontSize: 11}} />
                  {paybackPoint ? (
                    <ReferenceLine x={paybackPoint.year} stroke="#475569" strokeDasharray="4 4" label={{value: `Payback year ${Math.floor(paybackPoint.year)}`, angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11}} />
                  ) : null}
                  <Line type="monotone" dataKey="annualNetProfit" stroke="#2563eb" strokeWidth={3} dot={{r: 3, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2}} />
                  <Line type="monotone" dataKey="takeHome" stroke="#d946ef" strokeWidth={3} dot={{r: 3, fill: '#d946ef', stroke: '#ffffff', strokeWidth: 2}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="model-chart-notes">
              <div className="model-note-box model-note-box-blue">Blue line: annual net profit before owner split.</div>
              <div className="model-note-box model-note-box-fuchsia">Fuchsia line: investor take-home after split and reinvestment.</div>
            </div>
          </div>
        </div>

        <div className="model-card">
          <div className="model-panel-header">
            <h2>Key milestones over 10 years</h2>
          </div>
          <div className="model-milestone-grid">
            {projection.rows.map((row) => (
              <div key={row.year} className={`model-milestone-card ${row.milestoneColor}`}>
                <div className="model-milestone-header">
                  <div>
                    <div className="model-milestone-year">Year {row.year}</div>
                    <div className="model-milestone-value">{currency.format(row.takeHome)}</div>
                  </div>
                  <span className={badgeClasses(row.milestoneColor)}>{row.milestone}</span>
                </div>
                <div className="model-milestone-details">
                  <div>Cumulative take-home: {currency.format(row.cumulativeTakeHome)}</div>
                  <div>Cumulative value: {currency.format(row.cumulativeValue)}</div>
                  <div>ROI to date: {percent.format(row.roiOnOriginalCapital)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
