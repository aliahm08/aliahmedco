import {useMemo, useState} from 'react';
import {
  Calendar,
  Download,
  DollarSign,
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
  roiOnOriginalCapital: number;
  milestone: string;
  milestoneColor: MilestoneColor;
};

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
}) {
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
      const neededAtStart = args.initialInvestment - cumulativeBefore;
      const monthlyTakeHomeInYear = takeHome / 12;
      const monthsIntoYear =
        monthlyTakeHomeInYear > 0
          ? Math.min(Math.ceil(neededAtStart / monthlyTakeHomeInYear), 12)
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
      roiOnOriginalCapital:
        args.initialInvestment > 0 ? cumulativeTakeHome / args.initialInvestment : 0,
      milestone: milestoneLabel(cumulativeTakeHome, args.initialInvestment),
      milestoneColor: milestoneColor(cumulativeTakeHome, args.initialInvestment),
    });
  }

  return {rows, paybackYear, paybackMonth, paybackMonthsExact};
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rangeLabel(color: MilestoneColor) {
  if (color === 'red') return 'milestone milestone-red';
  if (color === 'amber') return 'milestone milestone-amber';
  if (color === 'green') return 'milestone milestone-green';
  return 'milestone milestone-violet';
}

function parseNumericInput(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function MetricCard(props: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  detail: string;
}) {
  const Icon = props.icon;

  return (
    <article className="model-card model-card-metric">
      <div className="model-card-topline">
        <span className="model-card-icon">
          <Icon size={15} />
        </span>
        <p className="micro-label">{props.label}</p>
      </div>
      <p className="model-metric-value">{props.value}</p>
      <p className="summary-detail">{props.detail}</p>
    </article>
  );
}

function SliderField(props: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="model-field">
      <span className="model-field-topline">
        <span>{props.label}</span>
        <strong>{props.valueLabel}</strong>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="model-number-field">
      <span>{props.label}</span>
      <div className="model-number-shell">
        {props.prefix ? <span>{props.prefix}</span> : null}
        <input
          type="number"
          value={props.value}
          step={props.step ?? 1}
          min={props.min}
          max={props.max}
          onChange={(event) => props.onChange(Number(event.target.value))}
        />
        {props.suffix ? <span>{props.suffix}</span> : null}
      </div>
    </label>
  );
}

function StatLine(props: {label: string; value: string; emphatic?: boolean}) {
  return (
    <div className={`model-stat-line ${props.emphatic ? 'is-emphatic' : ''}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function LineChart(props: {
  data: Row[];
  initialInvestment: number;
  mode: 'cumulative' | 'annual';
}) {
  const width = 860;
  const height = 320;
  const padding = {top: 20, right: 16, bottom: 30, left: 70};
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const values =
    props.mode === 'cumulative'
      ? props.data.flatMap((row) => [row.cumulativeTakeHome, row.cumulativeValue, props.initialInvestment])
      : props.data.flatMap((row) => [row.annualNetProfit, row.takeHome]);

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;

  const x = (year: number) =>
    padding.left + ((year - 1) / Math.max(props.data.length - 1, 1)) * innerWidth;
  const y = (value: number) => padding.top + (1 - (value - minValue) / span) * innerHeight;

  const pathFor = (selector: (row: Row) => number) =>
    props.data
      .map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(row.year)} ${y(selector(row))}`)
      .join(' ');

  const zeroY = y(0);
  const investmentY = y(props.initialInvestment);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="model-chart" role="img">
      <title>
        {props.mode === 'cumulative'
          ? 'Cumulative investor income compared with initial investment'
          : 'Annual net profit and investor take-home'}
      </title>
      <rect x="0" y="0" width={width} height={height} rx="20" className="model-chart-bg" />
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const currentY = padding.top + ratio * innerHeight;
        const value = Math.round(maxValue - ratio * span);
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={currentY}
              x2={width - padding.right}
              y2={currentY}
              className="model-grid-line"
            />
            <text x={12} y={currentY + 4} className="model-axis-label">
              {currency.format(value)}
            </text>
          </g>
        );
      })}
      {props.data.map((row) => (
        <g key={row.year}>
          <line
            x1={x(row.year)}
            y1={padding.top}
            x2={x(row.year)}
            y2={height - padding.bottom}
            className="model-grid-line model-grid-line-vertical"
          />
          <text x={x(row.year)} y={height - 8} textAnchor="middle" className="model-axis-label">
            Y{row.year}
          </text>
        </g>
      ))}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={width - padding.right}
        y2={zeroY}
        className="model-threshold-line"
      />
      {props.mode === 'cumulative' ? (
        <line
          x1={padding.left}
          y1={investmentY}
          x2={width - padding.right}
          y2={investmentY}
          className="model-investment-line"
        />
      ) : null}
      {props.mode === 'cumulative' ? (
        <>
          <path d={pathFor((row) => row.cumulativeTakeHome)} className="model-series model-series-green" />
          <path d={pathFor((row) => row.cumulativeValue)} className="model-series model-series-blue" />
        </>
      ) : (
        <>
          <path d={pathFor((row) => row.annualNetProfit)} className="model-series model-series-blue" />
          <path d={pathFor((row) => row.takeHome)} className="model-series model-series-violet" />
        </>
      )}
    </svg>
  );
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

  const summary = useMemo(() => {
    const finalYear = projection.rows[projection.rows.length - 1];
    const avgAnnualTakeHome =
      projection.rows.reduce((sum, row) => sum + row.takeHome, 0) / projection.rows.length;

    return {
      paybackMonth: projection.paybackMonth,
      paybackMonthsExact: projection.paybackMonthsExact,
      cumulativeTakeHome: finalYear?.cumulativeTakeHome ?? 0,
      totalROI: initialInvestment > 0 ? (finalYear?.cumulativeTakeHome ?? 0) / initialInvestment : 0,
      avgAnnualTakeHome,
      year10TakeHome: finalYear?.takeHome ?? 0,
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

  function setDesiredPayback(months: number) {
    const safeMonths = clamp(Math.round(months), 6, 120);
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
  }

  function downloadReport() {
    const lines = [
      'Coffee Shop Financing Model',
      'Interactive investor income projection report',
      '',
      `Initial investment: ${currency.format(initialInvestment)}`,
      `Monthly revenue: ${currency.format(monthlyRevenue)}`,
      `Monthly net profit: ${currency.format(monthlyPnl.netProfit)}`,
      `Estimated payback: ${summary.paybackMonth ?? 'Beyond 10 years'}`,
      `10-year cumulative take-home: ${currency.format(summary.cumulativeTakeHome)}`,
      `10-year ROI: ${percent.format(summary.totalROI)}`,
      '',
      'Operating assumptions',
      `Buyout price: ${currency.format(buyoutPrice)}`,
      `Retrofit + FF&E: ${currency.format(retrofitCost)}`,
      `Franchise fee: ${currency.format(franchiseFee)}`,
      `COGS: ${percent.format(cogsPct)}`,
      `Labor: ${currency.format(labor)}`,
      `Rent: ${currency.format(rent)}`,
      `Utilities: ${currency.format(utilities)}`,
      `Insurance + misc: ${currency.format(insuranceMisc)}`,
      `Tax rate: ${percent.format(taxRate)}`,
      '',
      'Investor filters',
      `Annual growth: ${annualGrowthRate}%`,
      `Owner distribution: ${ownerDistribution}%`,
      `Reinvestment: ${reinvestmentRate}%`,
      `Down year: ${downYear}`,
      `Downturn impact: ${downturnImpact}%`,
      `Target payback: ${targetPaybackMonths} months`,
      '',
      '10-year schedule',
      ...projection.rows.map(
        (row) =>
          `Year ${row.year}: take-home ${currency.format(row.takeHome)}, cumulative ${currency.format(
            row.cumulativeTakeHome,
          )}, value ${currency.format(row.cumulativeValue)}, status ${row.milestone}`,
      ),
    ];

    const blob = new Blob([lines.join('\n')], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coffeeshop-financing-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="panel panel-first model-hero">
        <div className="model-hero-copy">
          <p className="eyebrow">Coffee Shop Financing Model</p>
          <h1>Interactive investor dashboard for a 10-year coffee shop financing case.</h1>
          <p className="lede">
            This page translates the attached underwriting assumptions into an editable operating
            model, scenario dashboard, and downloadable investor report at
            <strong> aliahmed.co/work/coffeeshop-financing/model</strong>.
          </p>
        </div>
        <div className="model-hero-actions">
          <button type="button" className="model-action" onClick={resetChanges}>
            <RotateCcw size={16} />
            Reset assumptions
          </button>
          <button type="button" className="model-action model-action-primary" onClick={downloadReport}>
            <Download size={16} />
            Download report
          </button>
        </div>
      </section>

      <section className="panel model-metric-grid">
        <MetricCard
          icon={DollarSign}
          label="Initial investment"
          value={currency.format(initialInvestment)}
          detail="Buyout, retrofit, and franchise fee combined."
        />
        <MetricCard
          icon={TrendingUp}
          label="Monthly net profit"
          value={currency.format(monthlyPnl.netProfit)}
          detail="Derived directly from the attached P&L assumptions."
        />
        <MetricCard
          icon={Calendar}
          label="Estimated payback"
          value={summary.paybackMonth ?? 'Beyond 10 years'}
          detail={`${targetPaybackMonths} month target currently driving revenue calibration.`}
        />
        <MetricCard
          icon={Target}
          label="10-year ROI"
          value={percent.format(summary.totalROI)}
          detail={`${currency.format(summary.cumulativeTakeHome)} cumulative investor take-home.`}
        />
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Assumptions and filters</h2>
        </div>
        <div className="model-layout">
          <article className="model-card">
            <div className="model-card-topline">
              <span className="model-card-icon">
                <Receipt size={15} />
              </span>
              <p className="micro-label">Capital stack</p>
            </div>
            <div className="model-number-grid">
              <NumberField label="Buyout price" value={buyoutPrice} prefix="$" onChange={setBuyoutPrice} />
              <NumberField label="Retrofit + FF&E" value={retrofitCost} prefix="$" onChange={setRetrofitCost} />
              <NumberField label="Franchise fee" value={franchiseFee} prefix="$" onChange={setFranchiseFee} />
            </div>
            <div className="model-stat-list">
              <StatLine label="Total initial investment" value={currency.format(initialInvestment)} emphatic />
            </div>
          </article>

          <article className="model-card">
            <div className="model-card-topline">
              <span className="model-card-icon">
                <TrendingUp size={15} />
              </span>
              <p className="micro-label">Monthly P&L</p>
            </div>
            <div className="model-number-grid">
              <NumberField label="Monthly revenue" value={monthlyRevenue} prefix="$" onChange={setMonthlyRevenue} />
              <NumberField
                label="COGS"
                value={Math.round(cogsPct * 100)}
                suffix="%"
                min={0}
                max={100}
                onChange={(value) => setCogsPct(clamp(value / 100, 0, 1))}
              />
              <NumberField label="Labor" value={labor} prefix="$" onChange={setLabor} />
              <NumberField label="Rent" value={rent} prefix="$" onChange={setRent} />
              <NumberField label="Utilities" value={utilities} prefix="$" onChange={setUtilities} />
              <NumberField label="Insurance + misc" value={insuranceMisc} prefix="$" onChange={setInsuranceMisc} />
              <NumberField
                label="Tax rate"
                value={Math.round(taxRate * 100)}
                suffix="%"
                min={0}
                max={100}
                onChange={(value) => setTaxRate(clamp(value / 100, 0, 1))}
              />
            </div>
            <div className="model-stat-list">
              <StatLine label="Pre-tax profit" value={currency.format(monthlyPnl.pretaxProfit)} />
              <StatLine label="Taxes" value={currency.format(monthlyPnl.taxes)} />
              <StatLine label="Monthly net profit" value={currency.format(monthlyPnl.netProfit)} emphatic />
            </div>
          </article>

          <article className="model-card">
            <div className="model-card-topline">
              <span className="model-card-icon">
                <Target size={15} />
              </span>
              <p className="micro-label">Scenario controls</p>
            </div>
            <div className="model-slider-stack">
              <SliderField
                label="Annual growth"
                valueLabel={`${annualGrowthRate}%`}
                min={-5}
                max={15}
                step={0.5}
                value={annualGrowthRate}
                onChange={setAnnualGrowthRate}
              />
              <SliderField
                label="Owner distribution"
                valueLabel={`${ownerDistribution}%`}
                min={10}
                max={100}
                step={5}
                value={ownerDistribution}
                onChange={setOwnerDistribution}
              />
              <SliderField
                label="Reinvestment rate"
                valueLabel={`${reinvestmentRate}%`}
                min={0}
                max={60}
                step={5}
                value={reinvestmentRate}
                onChange={setReinvestmentRate}
              />
              <SliderField
                label="Down year"
                valueLabel={`Year ${downYear}`}
                min={1}
                max={10}
                step={1}
                value={downYear}
                onChange={setDownYear}
              />
              <SliderField
                label="Downturn impact"
                valueLabel={`${downturnImpact}%`}
                min={0}
                max={80}
                step={5}
                value={downturnImpact}
                onChange={setDownturnImpact}
              />
              <label className="model-field">
                <span className="model-field-topline">
                  <span>Target payback</span>
                  <strong>{targetPaybackMonths} months</strong>
                </span>
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="1"
                  value={targetPaybackMonths}
                  onChange={(event) => setDesiredPayback(Number(event.target.value))}
                />
                <input
                  className="model-inline-input"
                  type="number"
                  min="6"
                  max="120"
                  value={targetPaybackMonths}
                  onChange={(event) => setDesiredPayback(parseNumericInput(event.target.value, 6))}
                />
              </label>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Performance view</h2>
        </div>
        <div className="model-chart-grid">
          <article className="model-card">
            <p className="micro-label">Cumulative income vs invested capital</p>
            <p className="summary-detail">
              Green tracks gross investor take-home. Blue tracks cumulative value after recovering
              the initial investment.
            </p>
            <LineChart data={projection.rows} initialInvestment={initialInvestment} mode="cumulative" />
          </article>
          <article className="model-card">
            <p className="micro-label">Annual profit vs investor take-home</p>
            <p className="summary-detail">
              Blue shows annual net profit before owner split. Violet shows actual investor cash
              after reinvestment.
            </p>
            <LineChart data={projection.rows} initialInvestment={initialInvestment} mode="annual" />
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Report summary</h2>
        </div>
        <div className="model-layout">
          <article className="model-card">
            <p className="micro-label">Investor bridge</p>
            <div className="model-stat-list">
              <StatLine label="Year 1 annual net profit" value={currency.format(roiBridge.yearOneAnnualNetProfit)} />
              <StatLine label="Year 1 investor distribution" value={currency.format(roiBridge.distributedProfit)} />
              <StatLine
                label="Year 1 take-home after reinvestment"
                value={currency.format(roiBridge.takeHomeAfterReinvestment)}
              />
              <StatLine label="Year 1 cash yield" value={percent.format(roiBridge.simpleCashYield)} />
              <StatLine label="Growth contribution" value={percent.format(roiBridge.growthContribution)} />
              <StatLine label="Year 10 take-home" value={currency.format(summary.year10TakeHome)} emphatic />
            </div>
          </article>

          <article className="model-card">
            <p className="micro-label">10-year milestones</p>
            <div className="milestone-grid">
              {projection.rows.map((row) => (
                <div key={row.year} className={rangeLabel(row.milestoneColor)}>
                  <p className="milestone-year">Year {row.year}</p>
                  <p className="milestone-value">{currency.format(row.takeHome)}</p>
                  <p className="milestone-tag">{row.milestone}</p>
                  <p className="milestone-detail">
                    {currency.format(row.cumulativeTakeHome)} cumulative take-home
                  </p>
                  <p className="milestone-detail">
                    {currency.format(row.cumulativeValue)} cumulative value
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
