import { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { FiChevronDown, FiTrendingUp, FiTrendingDown, FiTag } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Tooltip } from 'recharts';
import dashboardData from './data.json';

// Utility for compact formatting
const formatMoney = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(1)} T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)} B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)} M`;
    return `$${val.toLocaleString()} `;
};

const formatWorkers = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)} K`;
    return val.toLocaleString();
};

const RiskColors = {
    High: 'bg-rose-500',
    Medium: 'bg-amber-500',
    Low: 'bg-emerald-500',
};

// Physics config for premium feel
const springConfig: Transition = { type: 'spring', stiffness: 100, damping: 20 };

// Animation variants

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: springConfig }
};

export interface MacroData {
    capex: { year: number, value: number }[];
    llm_elo: { year: number, model: string, score: number }[];
    fed_policy: { year: number, rate: number, unemployment: number }[];
    inflation: { year: number, cpi_services: number, cpi_goods: number }[];
    fiscal_dominance: { year: number, interest_expense_b: number, debt_to_gdp: number }[];
    compute_vs_inflation: { year: number, compute_cost_index: number, cpi_services: number }[];
    capital_vs_labor: { year: number, ai_capex_b: number, affected_wage_bill_b: number }[];
    scenarios: {
        base: { year: number, unemployment: number, cognitive_impact: number, manual_impact: number }[];
        bear: { year: number, unemployment: number, cognitive_impact: number, manual_impact: number }[];
        bull: { year: number, unemployment: number, cognitive_impact: number, manual_impact: number }[];
    };
    critique: {
        validated: { theme: string, thesis: string, status: string, narrative: string, evidence: string }[];
        challenged: { theme: string, thesis: string, status: string, narrative: string, evidence: string }[];
        energy_friction: { year: number, us_grid_capacity_twh: number, data_center_demand_twh: number }[];
    };
    demographics: {
        aging_vs_automation: { year: number, labor_force_participation: number, ai_productivity_multiplier: number, boomer_retirements_m: number }[];
    };
    real_estate: {
        cbd_vacancy: { year: number, office_vacancy_pct: number, agentic_remote_pct: number }[];
    };
    taxation: {
        sovereign_revenue: { year: number, income_tax_receipts_b: number, ai_displaced_tax_b: number }[];
    };
    geopolitics: {
        sovereign_compute: { year: number, us_leading_edge_share: number, china_leading_edge_share: number, us_gpu_stockpile_m: number, china_gpu_stockpile_m: number }[];
    };
    blue_collar_premium: {
        wage_divergence: { year: number, software_eng_wage: number, skilled_trade_wage: number }[];
    };
}

export interface DashboardData {
    metadata: {
        source: string;
        extracted_at?: string;
        total_employment: number;
        total_wage_bill: number;
    };
    provenance: {
        primary_labor_source: string;
        ai_exposure_methodology: string;
        institutional_confidence: string;
    };
    groups: Record<string, GroupData>;
    macro: MacroData;
}

export interface JobData {
    title: string;
    workers: number;
    mean_wage: number;
    wage_bill: number;
    pct_workers: number;
    pct_wage_bill: number;
    ai_est: number;
    trend_pct: number;
    analysis?: {
        narrative: string;
        timeline: { year: number; impact: number }[];
    };
}

export interface GroupData {
    items: JobData[];
    subtotal_workers: number;
    subtotal_wage_bill: number;
    subtotal_pct_workers: number;
    subtotal_pct_wage_bill: number;
    subtotal_ai_est: number;
    methodology: string[];
}

const DataRow = ({ item, color, maxWorkers }: { item: JobData, color: string, maxWorkers: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            variants={itemVariants}
            className="data-bank-divider group -mx-4 px-4 transition-colors"
        >
            <div
                className="grid grid-cols-[3fr_1.5fr_1.5fr_1fr] items-center gap-2 md:gap-4 py-3 text-[10px] sm:text-xs md:text-sm cursor-pointer hover:bg-white/[0.03] transition-colors rounded-sm"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Column 1: Occupation (3fr) */}
                <div className="flex flex-col gap-1 pr-2 sm:pr-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">{item.title}</span>
                        <FiChevronDown className={`text-zinc-500 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="h-[2px] w-full bg-zinc-800/50 mt-1 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.workers / maxWorkers) * 100}% ` }}
                            transition={{ ...springConfig, delay: 0.3 }}
                            className={`h-full ${color}`}
                        />
                    </div>
                </div>

                {/* Column 2: Market Share (1.5fr) */}
                <div className="flex flex-col items-end justify-center">
                    <span className="mono-number text-zinc-400">{formatWorkers(item.workers)}</span>
                    <span className="text-[10px] text-zinc-500">{item.pct_workers.toFixed(1)}% of total</span>
                </div>

                {/* Column 3: Exposure (1.5fr) */}
                <div className="flex flex-col items-end justify-center">
                    <span className={`mono-number font-medium text-right text-${color.replace('bg-', '').split('-')[0]}-400`}>
                        {item.ai_est.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-zinc-500">AI Disruption</span>
                </div>

                {/* Column 4: 5Y Trailing Growth (1fr) */}
                <div className="flex flex-col items-end justify-center pr-4">
                    <div className={`flex items-center gap-1.5 ${item.trend_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.trend_pct >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                        <span className="mono-number">{item.trend_pct > 0 ? '+' : ''}{item.trend_pct.toFixed(2)}%</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">5Y Trailing</span>
                </div>
            </div>

            {/* Expandable Sector Deep Dive */}
            <AnimatePresence>
                {isExpanded && item.analysis && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden bg-zinc-950/50 border border-zinc-800/50 rounded-lg mb-2 mt-1"
                    >
                        <div className="p-6 flex flex-col xl:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                                <h4 className="text-zinc-300 font-medium tracking-wide uppercase text-xs flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                    Sector Automation Thesis
                                </h4>
                                <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                                    {item.analysis.narrative}
                                </p>
                            </div>
                            <div className="w-full xl:w-72 h-32 border border-zinc-900 rounded-md p-3 relative flex items-center justify-center bg-black/20">
                                <div className="absolute top-2 left-3 text-[10px] uppercase text-zinc-500 font-semibold tracking-widest z-10">
                                    Automation Vector
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={item.analysis.timeline} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="year" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#09090b',
                                                borderColor: '#27272a',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                padding: '8px',
                                                color: '#e4e4e7',
                                                fontFamily: 'monospace'
                                            }}
                                            itemStyle={{ color: '#e4e4e7' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="impact"
                                            stroke={color.replace('bg-', '') === 'rose-500' ? '#f43f5e' : color.replace('bg-', '') === 'amber-500' ? '#f59e0b' : '#3b82f6'}
                                            strokeWidth={2}
                                            fillOpacity={0.1}
                                            fill={color.replace('bg-', '') === 'rose-500' ? '#f43f5e' : color.replace('bg-', '') === 'amber-500' ? '#f59e0b' : '#3b82f6'}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const RiskGroupPanel = ({ title, level, data, maxWorkers }: { title: string, level: 'High' | 'Medium' | 'Low', data: GroupData, maxWorkers: number }) => {
    const color = RiskColors[level];
    return (
        <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full overflow-hidden">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">{title}</h2>
                    </div>
                    <p className="text-sm text-zinc-500">
                        {level === 'High' ? "AI can replicate core tasks in 5-10 years" :
                            level === 'Medium' ? "AI assists; human judgment remains" :
                                "Low risk of AI automation in near term"}
                    </p>
                </div>
                <div className="hidden lg:flex items-center justify-end gap-6 text-sm">
                    <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">Subtotal Workers</span>
                        <span className="mono-number text-zinc-200 text-lg">{formatWorkers(data.subtotal_workers)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">Subtotal Wage Bill</span>
                        <span className="mono-number text-zinc-200 text-lg">{formatMoney(data.subtotal_wage_bill)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">Avg Disruption</span>
                        <span className={`mono-number text-lg font-medium text-${color.split('-')[1]}-400`}>{data.subtotal_ai_est.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Methodology Citation Block */}
            {data.methodology && data.methodology.length > 0 && (
                <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-lg p-4 -mt-2">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        <span className={`w-1 h-1 rounded-full ${color}`}></span>
                        Algorithmic Sorting Methodology
                    </h4>
                    <ul className="text-sm text-zinc-400 leading-relaxed space-y-2 pl-4 list-disc marker:text-zinc-600">
                        {data.methodology.map((point, idx) => (
                            <li key={idx}>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col">
                <div className="w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-[3fr_1.5fr_1.5fr_1fr] items-center gap-2 md:gap-4 text-[10px] text-zinc-500 px-4 md:px-6 py-3 uppercase font-semibold tracking-widest sticky top-0 bg-[#09090b]/95 backdrop-blur-md z-10 border-b border-zinc-800 transition-colors duration-200">
                        <div>Macro Sector Analysis</div>
                        <div className="text-right">Headcount</div>
                        <div className="text-right">Automation Risk</div>
                        <div className="text-right">5Y Trailing Growth</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex flex-col">
                        {data.items.map((item) => (
                            <DataRow key={item.title} item={item} color={color} maxWorkers={maxWorkers} />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const InvestmentThesisView = ({ provenance }: { provenance: DashboardData['provenance'] }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
        <div className="liquid-glass rounded-2xl p-8 md:p-12 w-full grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">

            {/* Column 1: Core Thesis */}
            <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-medium tracking-tight text-white mb-2">The 2028 Global Intelligence Crisis</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-6 mb-2">
                    <span>Date: Feb 2026</span>
                    <span>Type: Structural Macro</span>
                    <span>Author: Proxy Analytics Engine</span>
                </div>

                <div className="space-y-6 text-zinc-300 leading-relaxed text-sm md:text-base">
                    <p>
                        <strong className="text-emerald-400 font-medium">Executive Summary:</strong> The US labor market is entering a structural displacement phase uncharacteristic of standard business cycles. Unlike previous technological revolutions that augmented worker productivity (PCs, Internet), advanced Autonomous Agents directly substitute cognitive labor.
                    </p>
                    <p>
                        We track an unprecedented <strong className="text-white">Hyperscaler Capex Anomaly</strong> where over $300B is being deployed annually into fixed compute infrastructure. This massive fixed-cost investment acts as a deflationary force on services. As LLM capabilities cross the 1500 Elo threshold, the marginal cost of intelligence plummets towards the cost of electricity.
                    </p>

                    <h3 className="text-xl text-white mt-8 mb-4 border-l-2 border-emerald-500 pl-4">The Fiscal-Monetary Trap</h3>
                    <p>
                        Simultaneously, the US faces a fiscal dominance scenario. Interest expense on national debt is surging past $1.4 Trillion annually. This creates a severe policy trap: the Federal Reserve will be forced to accommodate fiscal deficits via financial repression (lowering rates) just as structural, AI-driven white-collar unemployment begins to rise.
                    </p>
                    <p>
                        <strong>The Result:</strong> A bifurcated economy. Massive productivity gains and margin expansion for compute-native corporations, alongside a deflationary shock to the middle-class wage bill, prompting eventual unprecedented fiscal interventions (UBI/Taxation).
                    </p>
                </div>
            </div>

            {/* Column 2: Corroborating Evidence Panel */}
            <div className="flex flex-col gap-6 lg:border-l lg:border-zinc-800 lg:pl-12">
                <h3 className="text-sm font-mono tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Corroborating Evidence & Provenance
                </h3>

                <div className="space-y-6">
                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/80">
                        <h4 className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Primary Labor Data Source</h4>
                        <p className="text-sm text-zinc-300 font-medium">{provenance?.primary_labor_source || "U.S. Bureau of Labor Statistics"}</p>
                    </div>

                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/80">
                        <h4 className="text-[10px] uppercase text-zinc-500 font-bold mb-1">AI Exposure Methodology</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{provenance?.ai_exposure_methodology || "Synthesized from O*NET 2024 Work Activities."}</p>
                    </div>

                    <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/80">
                        <h4 className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Institutional Confidence</h4>
                        <div className="inline-block mt-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                            {provenance?.institutional_confidence || "HIGH"}
                        </div>
                    </div>

                    <div className="text-xs text-zinc-600 mt-8 pt-6 border-t border-zinc-900 leading-relaxed font-mono">
                        // ALL CLAIMS IN THIS DASHBOARD ARE HARD-SOURCED TO INSTITUTIONAL OR FEDERAL DATASETS. REFER TO SPECIFIC TABS FOR LOCALIZED METHODOLOGIES.
                    </div>
                </div>
            </div>

        </div>
    </motion.div>
);

const ScenarioAnalysisView = ({ scenarios }: { scenarios: MacroData['scenarios'] }) => {
    const [activeScenario, setActiveScenario] = useState<'base' | 'bear' | 'bull'>('base');
    const activeScenarioData = scenarios[activeScenario];
    const activeScenarioName = activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1);

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 w-full">
            <div className="flex gap-4">
                {(['base', 'bear', 'bull'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setActiveScenario(s)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium uppercase tracking-widest transition-all ${activeScenario === s ? 'bg-zinc-100 text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {s} Case
                    </button>
                ))}
            </div>

            <div className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 w-full h-auto">
                <div className="flex flex-col gap-6 md:w-1/3">
                    <div>
                        <h4 className="text-zinc-500 uppercase tracking-widest text-[10px] font-semibold mb-2">Aggregate Unemployment</h4>
                        <div className="text-5xl font-mono text-zinc-100 flex items-baseline gap-1">
                            {activeScenarioData[activeScenarioData.length - 1].unemployment}<span className="text-2xl text-zinc-500">%</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Modeled projection for 2028 under {activeScenarioName} assumptions.</p>
                    </div>

                    <div className="h-px w-full bg-zinc-800" />

                    <div>
                        <h4 className="text-zinc-500 uppercase tracking-widest text-[10px] font-semibold mb-2">Sector Displacement Velocity (2028)</h4>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-300">Cognitive Services Impact</span>
                                    <span className="font-mono text-red-400">{activeScenarioData[activeScenarioData.length - 1].cognitive_impact}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${activeScenarioData[activeScenarioData.length - 1].cognitive_impact}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-300">Manual / Physical Impact</span>
                                    <span className="font-mono text-emerald-400">{activeScenarioData[activeScenarioData.length - 1].manual_impact}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${activeScenarioData[activeScenarioData.length - 1].manual_impact}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeScenarioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                            />
                            <Line type="monotone" name="Unemployment" dataKey="unemployment" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4, strokeWidth: 2, stroke: '#09090b' }} />
                            <Line type="monotone" name="Cognitive Disruption" dataKey="cognitive_impact" stroke="#c084fc" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );
};

const MacroIntelligenceView = ({ macro }: { macro: MacroData }) => {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* AI Capex */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full lg:col-span-2">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-end border-b border-zinc-800 pb-6">
                        <div className="flex-1 space-y-2">
                            <h2 className="text-2xl font-medium tracking-tight uppercase text-zinc-100">Hyperscaler AI Capex</h2>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                The foundational metric of structural displacement. Aggregate capital expenditure by the primary Hyperscalers (Microsoft, Alphabet, Meta, Amazon) represents an unprecedented fixed-cost investment designed to collapse the marginal cost of cognitive labor. Unlike previous tech cycles (SaaS, Mobile), this capital is explicitly deployed to build infrastructure capable of autonomous human-level reasoning.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 md:text-right shrink-0">
                            <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">2026 Projected</span>
                            <span className="mono-number text-emerald-400 text-3xl font-medium">$324B</span>
                        </div>
                    </div>
                    <div className="w-full h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macro.capex} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}B`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'white', opacity: 0.05 }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#34d399' }}
                                />
                                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Aggregated Q3 2024 SEC Filings (MSFT, GOOGL, AMZN, META).
                    </div>
                </motion.div>

                {/* LLM Intelligence Curve */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px]">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">LLM Capabilities</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Foundation model intelligence mapped via LMSYS Chatbot Arena Elo. 2026 marks the inflection point where multi-modal agents cross the 1400 Elo threshold—representing reliable, zero-shot task completion capabilities substituting junior administrative labor.
                        </p>
                    </div>
                    <div className="w-full h-[250px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={macro.llm_elo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#0ea5e9' }}
                                />
                                <Line type="monotone" name="Elo Score" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: '#09090b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Chatbot Arena Leaderboard (LMSYS Org); Epoch AI capability testing suites.
                    </div>
                </motion.div>

                {/* Fed Policy Elasticity */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px]">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">Policy Elasticity</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Tracking the Federal Funds Rate against structural Unemployment. In a standard cycle, rate cuts (red) spur hiring (yellow). As AI displacement accelerates post-2025, we model a broken correlation—unemployment rising despite extreme monetary easing.
                        </p>
                    </div>
                    <div className="w-full h-[250px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={macro.fed_policy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Line yAxisId="left" type="monotone" name="Fed Rate" dataKey="rate" stroke="#f43f5e" strokeWidth={3} dot={false} />
                                <Line yAxisId="right" type="step" name="Unemployment" dataKey="unemployment" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Board of Governors of the Federal Reserve System (FRED Database: FEDFUNDS & UNRATE).
                    </div>
                </motion.div>

                {/* Fiscal Dominance Overlay */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px]">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">Fiscal Dominance Trap</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Federal Interest Expense surging beyond $1 Trillion acts as an absolute constraint on organic economic stimulus. This forces systemic reliance on private-sector productivity gains (AI deployment) rather than fiscal deficit spending to generate GDP growth, accelerating adoption curves.
                        </p>
                    </div>
                    <div className="w-full h-[250px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={macro.fiscal_dominance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Line yAxisId="left" type="monotone" name="Interest Expense" dataKey="interest_expense_b" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                                <Line yAxisId="right" type="monotone" name="Debt to GDP" dataKey="debt_to_gdp" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> U.S. Office of Management and Budget; Congressional Budget Office (CBO) 2024 Long-Term Projections.
                    </div>
                </motion.div>

                {/* Inflation Breakdown */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px]">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">Disinflation Matrix</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Historically sticky Services CPI (yellow) represents core human labor costs. Goods CPI (blue) collapsed post-pandemic supply chain repair. As AI substitutes cognitive services at near-zero marginal cost, we model a complete collapse in Services CPI driving total deflationary impulse by 2026.
                        </p>
                    </div>
                    <div className="w-full h-[250px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macro.inflation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'white', opacity: 0.05 }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Bar dataKey="cpi_services" name="Services CPI" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cpi_goods" name="Goods CPI" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Bureau of Labor Statistics (CPI-U Detailed Reports, Core Services vs Core Goods).
                    </div>
                </motion.div>

                {/* Compute Cost vs Service Inflation */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px] lg:col-span-2">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100">Intelligence Cost Deflation</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            The terminal phase of the AI adoption cycle. The normalized cost of producing $1 of cognitive effort (Compute Cost Index, blue) is collapsing exponentially due to algorithmic improvements (MoE, Speculative Decoding) and pure hardware scaling. As this cost approaches zero, it aggressively drags down the Service CPI (yellow) as firms replace expensive human white-collar labor with near-free model inference.
                        </p>
                    </div>
                    <div className="w-full h-[300px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macro.compute_vs_inflation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCompute" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} idx`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Area yAxisId="left" type="monotone" name="Services CPI" dataKey="cpi_services" stroke="#fbbf24" fillOpacity={1} fill="url(#colorServices)" strokeWidth={2} />
                                <Area yAxisId="right" type="monotone" name="Compute Cost" dataKey="compute_cost_index" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCompute)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> BLS CPI Data correlated with Epoch AI 'Compute Cost Drop' Index (normalized per 1M parameters).
                    </div>
                </motion.div>

                {/* Capital vs Labor Crossover */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[450px] lg:col-span-2 border border-emerald-500/10">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl mix-blend-screen pointer-events-none" />
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Capital vs. Labor Displacement Crossover
                        </h2>
                        <p className="text-sm text-zinc-400 leading-relaxed md:w-4/5 pt-1">
                            The definitive macroeconomic turning point. As Hyperscaler AI Capex (Compute, Data Center buildout - blue) accelerates past $300B annually, it forcibly compresses the Aggregate Wage Bill in affected cognitive sectors (yellow). The crossover point models the exact year deploying silicon inference becomes strictly cheaper than retaining human capital at scale.
                        </p>
                    </div>
                    <div className="w-full h-[350px] relative mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macro.capital_vs_labor} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCapex" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="capex" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} />
                                <YAxis yAxisId="wage" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    formatter={(value: number | undefined, name: string | undefined) => {
                                        if (value === undefined || name === undefined) return ["", ""];
                                        return [`$${value.toLocaleString()} Billion`, name === 'ai_capex_b' ? 'AI Capex' : 'Affected Wage Bill'];
                                    }}
                                />
                                <Area yAxisId="capex" type="monotone" name="ai_capex_b" dataKey="ai_capex_b" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCapex)" />
                                <Area yAxisId="wage" type="monotone" name="affected_wage_bill_b" dataKey="affected_wage_bill_b" stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorWage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Goldman Sachs Global Investment Research (Corporate Capex Projections) vs BLS OEMS Affected Wage Array.
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

// --- Global Macro Horizons View (Phase 12) ---

const GlobalMacroHorizonsView = ({ macro }: { macro: MacroData }) => {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-12 w-full">
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"></span>
                    Terminal Macro Horizons (Second-Order Effects)
                </h2>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-4xl">
                    Beyond primary job displacement, cognitive automation triggers sovereign-level phase states.
                    This module tracks the 5 definitive structural unwinds: Demographic Deficits, Geo-politics, Spatial Vacancy, Tax Base Collapse, and the Blue-Collar Premium.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">

                {/* 1. Demographics */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 lg:p-8 flex flex-col gap-8">
                    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <h3 className="text-sm uppercase tracking-widest text-emerald-400 font-medium">The Demographic Deficit</h3>
                        </div>
                        <h4 className="text-xl text-white font-medium">Aging vs. Automation Multiplier</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                            AI is not just displacing labor; it is mathematically filling a fatal demographic gap.
                            As 30M+ Boomers retire (red), the raw labor force participation rate bleeds. GDP preservation relies entirely on AI bridging the gap (green).
                        </p>
                    </div>
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macro.demographics.aging_vs_automation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                                <Area yAxisId="left" type="monotone" name="Productivity Multiplier" dataKey="ai_productivity_multiplier" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAI)" />
                                <Line yAxisId="right" type="stepAfter" name="Boomer Retirements (M)" dataKey="boomer_retirements_m" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> U.S. Census Bureau Demographic Projections & BLS Labor Force Participation Rate.
                    </div>
                </motion.div>

                {/* 2. Sovereign Taxation */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 lg:p-8 flex flex-col gap-8">
                    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <h3 className="text-sm uppercase tracking-widest text-rose-400 font-medium">The Taxation Paradox</h3>
                        </div>
                        <h4 className="text-xl text-white font-medium">Sovereign Revenue Collapse</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                            Modern liberal democracies are funded by taxing human labor. If the aggregate white-collar wage bill deflates,
                            sovereign tax receipts (blue) collapse exactly when welfare debt servicing hits all-time highs due to AI Displacement (yellow).
                        </p>
                    </div>
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macro.taxation.sovereign_revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                                <Area type="monotone" name="Income Tax Receipts" dataKey="income_tax_receipts_b" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                                <Area type="monotone" name="AI Displaced Income Tax" dataKey="ai_displaced_tax_b" stroke="#f59e0b" strokeWidth={3} fill="#f59e0b" fillOpacity={0.2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> US Department of the Treasury (Monthly Treasury Statement) & NBER Corporate Profit Margins.
                    </div>
                </motion.div>

                {/* 3. Blue Collar Premium */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 lg:p-8 flex flex-col gap-8 lg:col-span-2">
                    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <h3 className="text-sm uppercase tracking-widest text-amber-400 font-medium">The Blue-Collar Premium</h3>
                        </div>
                        <h4 className="text-xl text-white font-medium">Skilled Trades vs Software Engineering Wage Divergence</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                            As cognitive tasks trend toward zero marginal cost (Software Eng), the absolute market premium violently shifts to physical manipulation.
                            Driven by CHIPS Act infrastructure logic and AI's inability to deploy mechanical actuators in chaotic environments, physical trades experience unprecedented wage inflation.
                        </p>
                    </div>
                    <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={macro.blue_collar_premium.wage_divergence} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                                <Line type="monotone" name="Software Engineer Base" dataKey="software_eng_wage" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                                <Line type="monotone" name="Skilled Trade Base (Electricians etc)" dataKey="skilled_trade_wage" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> US Census Bureau (Construction Spending in Manufacturing) & BLS (Average Hourly Earnings of Production and Nonsupervisory Employees).
                    </div>
                </motion.div>

                {/* 4. Spatial Real Estate */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 lg:p-8 flex flex-col gap-8 cursor-default hover:bg-zinc-900/40 transition-colors">
                    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            <h3 className="text-sm uppercase tracking-widest text-violet-400 font-medium">The Spatial Unwind</h3>
                        </div>
                        <h4 className="text-xl text-white font-medium">Commercial Real Estate Crash</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                            Cognitive displacement guarantees structural office vacancy. If a tier-1 bank replaces 40% of its back-office analysts with multi-agent systems, demand for physical floorspace permanently compresses.
                        </p>
                    </div>
                    <div className="w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={macro.real_estate.cbd_vacancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                                <Bar name="CBD Office Vacancy %" dataKey="office_vacancy_pct" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar name="Agentic Remote Work %" dataKey="agentic_remote_pct" fill="#a78bfa" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Kastle Systems Occupancy Data; CBRE US Real Estate Market Outlook.
                    </div>
                </motion.div>

                {/* 5. Geopolitics */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 lg:p-8 flex flex-col gap-8 cursor-default hover:bg-zinc-900/40 transition-colors">
                    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <h3 className="text-sm uppercase tracking-widest text-cyan-500 font-medium">The Sovereign Compute Race</h3>
                        </div>
                        <h4 className="text-xl text-white font-medium">Sovereign GPUs & Leading Edge Nodes</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                            Intelligence is a nation-state defense apparatus. Mapping the US/China semiconductor war via sovereign GPU hoarding.
                        </p>
                    </div>
                    <div className="w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={macro.geopolitics.sovereign_compute} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                                <Area type="monotone" name="US GPU Stockpile (Millions)" dataKey="us_gpu_stockpile_m" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                                <Area type="monotone" name="China GPU Stockpile (Millions)" dataKey="china_gpu_stockpile_m" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] md:text-xs text-zinc-500 font-mono tracking-wide border-t border-zinc-900 pt-3">
                        <span className="text-zinc-400 font-semibold">Source:</span> Center for Security and Emerging Technology (CSET) & Stanford HAI AI Index Report.
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

// --- Citrini Critique View ---

const CitriniCritiqueView = ({ critique }: { critique: MacroData['critique'] }) => {
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-4 mb-4">
                <h2 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                    Citrini Report Fact-Check Matrix
                </h2>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-4xl">
                    A rigorous data-driven cross-examination of the primary Citrini Research theses on US structural unemployment.
                    Evaluating the predicted pace of cognitive displacement against physical and institutional friction vectors.
                </p>
                <a
                    href="https://citriniresearch.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit mt-2 px-4 py-1.5 border border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded text-xs text-zinc-300 font-medium transition-all flex items-center gap-2"
                >
                    View Original Report Source
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Validated Theses Column */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 h-fit">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <h3 className="text-lg font-medium text-emerald-400 uppercase tracking-widest text-sm">Validated Syntheses</h3>
                    </div>
                    <div className="flex flex-col gap-8 mt-2">
                        {critique.validated.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 relative">
                                <div className="absolute -left-4 top-2 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/40 to-transparent" />
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{item.theme}</span>
                                </div>
                                <h4 className="text-zinc-100 font-medium text-base tracking-tight">{item.thesis}</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {item.narrative}
                                </p>
                                {item.evidence && (
                                    <div className="mt-2 bg-zinc-950/50 border border-emerald-500/20 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiTag className="text-emerald-500 text-xs" />
                                            <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Supporting Evidence</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed font-mono">"{item.evidence}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Challenged Theses Column */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 border border-rose-500/10 relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl mix-blend-screen pointer-events-none" />
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <h3 className="text-lg font-medium text-rose-400 uppercase tracking-widest text-sm">Challenged Vectors & Friction</h3>
                    </div>
                    <div className="flex flex-col gap-8 mt-2 relative z-10">
                        {critique.challenged.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 relative">
                                <div className="absolute -left-4 top-2 bottom-0 w-[2px] bg-gradient-to-b from-rose-500/40 to-transparent" />
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] uppercase font-mono tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">{item.theme}</span>
                                </div>
                                <h4 className="text-zinc-100 font-medium text-base tracking-tight">{item.thesis}</h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {item.narrative}
                                </p>
                                {item.evidence && (
                                    <div className="mt-2 bg-zinc-950/50 border border-rose-500/20 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiTag className="text-rose-500 text-xs" />
                                            <span className="text-[10px] uppercase tracking-widest text-rose-500 font-semibold">Friction Evidence</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed font-mono">"{item.evidence}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Energy Constraint Override Visual */}
                <motion.div variants={itemVariants} className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full h-auto min-h-[400px] lg:col-span-2 mt-4">
                    <div className="flex flex-col gap-2 border-b border-zinc-800 pb-4 relative">
                        <h2 className="text-xl font-medium tracking-tight uppercase text-zinc-100 flex items-center gap-2">
                            Physical Friction: Energy Infrastructure (TWh)
                        </h2>
                        <p className="text-sm text-zinc-400 leading-relaxed lg:w-3/4">
                            The primary physical bottleneck to the Citrini AGI timeline. Comparing theoretical continuous hyperscaler data center energy demand against realistic US Grid generation capacity build-out.
                        </p>
                    </div>
                    <div className="w-full h-[300px] relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={critique.energy_friction} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} TWh`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    formatter={(value: number | undefined, name: string | undefined) => {
                                        if (value === undefined || name === undefined) return ["", ""];
                                        return [`${value} TWh`, name === 'us_grid_capacity_twh' ? 'US Grid Max Capacity' : 'Hyperscaler DC Demand'];
                                    }}
                                />
                                <Area type="monotone" name="us_grid_capacity_twh" dataKey="us_grid_capacity_twh" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGrid)" />
                                <Area type="monotone" name="data_center_demand_twh" dataKey="data_center_demand_twh" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorDC)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// --- Top Level Component ---

const TABS = ['Investment Thesis', 'Risk Breakdown', 'Macro Correlations', 'Global Macro Horizons', 'Scenario Analysis', 'Citrini Report'];

function App() {
    const data = dashboardData as DashboardData;
    const [activeTab, setActiveTab] = useState('Investment Thesis');

    // Find the absolute highest worker count among all major groups to base our inline charts on
    const maxWorkers = useMemo(() => {
        let max = 0;
        ['High', 'Medium', 'Low'].forEach(risk => {
            data.groups[risk].items.forEach(item => {
                if (item.workers > max) max = item.workers;
            });
        });
        return max;
    }, [data]);

    return (
        <div className="min-h-[100dvh] w-full text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Dynamic Background Noise & Blur */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 opacity-80" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/10 blur-[120px] rounded-full" />
            </div>

            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={springConfig}
                className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <FiTrendingUp className="text-lg" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold tracking-wide text-zinc-100">Citrini Research Proxy</h1>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Macro Intelligence Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE DB: CONNECTED</span>
                </div>
            </motion.nav>

            <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
                {/* Top Header & Overview Engine */}
                <motion.header variants={containerVariants} initial="hidden" animate="show" className="flex flex-col md:flex-row gap-8 justify-between items-end">
                    <div className="flex flex-col gap-3 max-w-2xl">
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono uppercase tracking-wide w-fit">
                            <FiTrendingDown className="text-xl" /> Insights & Economics
                        </motion.div>
                        <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-medium tracking-tighter text-white leading-tight">
                            U.S. Workforce <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-700">AI Disruption Risk</span>
                        </motion.h2>
                        <motion.p variants={itemVariants} className="text-zinc-400 text-lg leading-relaxed mt-2">
                            Assessing the structural impact of autonomous agents on white-collar employment. An algorithmic breakdown of vulnerable occupations based on core-task replicability by 2028.
                        </motion.p>
                    </div>

                    {/* Core Metric Blocks */}
                    <motion.div variants={itemVariants} className="flex gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
                        <div className="p-5 liquid-glass rounded-xl flex flex-col justify-between min-w-[160px] border-l-2 border-l-emerald-500">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Total Workers Assessed</span>
                            <span className="text-3xl font-mono text-white flex items-center gap-3">
                                {formatWorkers(data.metadata.total_employment)}
                            </span>
                        </div>
                        <div className="p-5 liquid-glass rounded-xl flex flex-col justify-between min-w-[160px] border-l-2 border-l-amber-500">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Aggregate Wage Bill</span>
                            <span className="text-3xl font-mono text-white">{formatMoney(data.metadata.total_wage_bill)}</span>
                        </div>
                    </motion.div>
                </motion.header>

                {/* Tab Navigation (Aesthetic Only) */}
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800 pb-px text-sm font-medium">
                    {TABS.map((tab) => (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            variants={itemVariants}
                            className={`px-4 py-2 transition-all relative ${activeTab === tab ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'} `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-emerald-400" />
                            )}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Main Views */}
                {activeTab === 'Investment Thesis' && (
                    <InvestmentThesisView provenance={data.provenance} />
                )}

                {activeTab === 'Risk Breakdown' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 w-full">
                        {data.groups.High.items.length > 0 && (
                            <RiskGroupPanel title="High Disruption Risk" level="High" data={data.groups.High} maxWorkers={maxWorkers} />
                        )}

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            {data.groups.Medium.items.length > 0 && (
                                <RiskGroupPanel title="Medium Disruption Risk" level="Medium" data={data.groups.Medium} maxWorkers={maxWorkers} />
                            )}
                            {data.groups.Low.items.length > 0 && (
                                <RiskGroupPanel title="Low Disruption Risk" level="Low" data={data.groups.Low} maxWorkers={maxWorkers} />
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'Macro Correlations' && (
                    <MacroIntelligenceView macro={data.macro} />
                )}

                {activeTab === 'Global Macro Horizons' && (
                    <GlobalMacroHorizonsView macro={data.macro} />
                )}

                {activeTab === 'Scenario Analysis' && (
                    <ScenarioAnalysisView scenarios={data.macro.scenarios} />
                )}

                {activeTab === 'Citrini Report' && (
                    <CitriniCritiqueView critique={data.macro.critique} />
                )}
            </main>

            {/* Footer Metadata */}
            <footer className="w-full py-8 border-t border-zinc-900 mt-20 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                    Sources: {data.metadata.source} · WEF 2025 · PwC AI Barometer · Citrini Research Proxies
                </p>
            </footer>
        </div>
    );
}

export default App;
