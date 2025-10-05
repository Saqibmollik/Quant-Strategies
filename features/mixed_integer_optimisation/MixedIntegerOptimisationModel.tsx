import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

// Pre-defined asset universe and pre-calculated optimal portfolios for demonstration.
const ASSETS = ['Tech', 'Healthcare', 'Finance', 'Energy', 'Retail', 'Infrastructure', 'Bonds', 'Gold'];
const OPTIMAL_PORTFOLIOS = {
    8: {Tech:0.20, Healthcare:0.15, Finance:0.15, Energy:0.10, Retail:0.10, Infrastructure:0.10, Bonds:0.15, Gold:0.05},
    7: {Tech:0.22, Healthcare:0.18, Finance:0.15, Energy:0.10, Retail:0.10, Infrastructure:0.10, Bonds:0.15, Gold:0.00},
    6: {Tech:0.25, Healthcare:0.20, Finance:0.15, Energy:0.10, Retail:0.00, Infrastructure:0.10, Bonds:0.20, Gold:0.00},
    5: {Tech:0.30, Healthcare:0.25, Finance:0.15, Energy:0.00, Retail:0.00, Infrastructure:0.05, Bonds:0.25, Gold:0.00},
    4: {Tech:0.35, Healthcare:0.25, Finance:0.10, Energy:0.00, Retail:0.00, Infrastructure:0.00, Bonds:0.30, Gold:0.00},
    3: {Tech:0.40, Healthcare:0.30, Finance:0.00, Energy:0.00, Retail:0.00, Infrastructure:0.00, Bonds:0.30, Gold:0.00},
    2: {Tech:0.60, Healthcare:0.00, Finance:0.00, Energy:0.00, Retail:0.00, Infrastructure:0.00, Bonds:0.40, Gold:0.00},
    1: {Tech:1.00, Healthcare:0.00, Finance:0.00, Energy:0.00, Retail:0.00, Infrastructure:0.00, Bonds:0.00, Gold:0.00},
};

const MixedIntegerOptimisationModel: React.FC = () => {
    const [maxAssets, setMaxAssets] = useState(5);

    const { portfolioData, stats } = useMemo(() => {
        const weights = OPTIMAL_PORTFOLIOS[maxAssets as keyof typeof OPTIMAL_PORTFOLIOS];
        const data = ASSETS.map(asset => ({
            name: asset,
            weight: weights[asset as keyof typeof weights]
        })).sort((a, b) => a.weight - b.weight);
        
        const activeAssets = data.filter(a => a.weight > 0).length;
        const totalWeight = data.reduce((sum, a) => sum + a.weight, 0);

        return { portfolioData: data, stats: { activeAssets, totalWeight } };
    }, [maxAssets]);

    const tooltipStyle = useMemo(() => ({
        backgroundColor: '#2A2A2A',
        border: '1px solid #AFAF9B'
    }), []);

    const tooltipCursorStyle = useMemo(() => ({
        fill: 'rgba(212, 175, 55, 0.1)'
    }), []);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-primary">Mixed-Integer Optimisation for Portfolio Selection</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Standard portfolio optimization often results in small investments across many assets. Mixed-integer optimization (MIO) allows for real-world constraints, such as a "cardinality constraint" that limits the total number of assets, creating more focused and cost-effective strategies.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    MIO is heavily used in institutional asset management and index tracking. For example, an ETF provider might use it to create a fund that tracks the S&P 500 using only 50 stocks to minimize transaction costs. The performance goal here is not to beat the market, but to match a benchmark's return profile as closely as possible (minimize tracking error) while satisfying real-world constraints. MIO can also incorporate other rules, like minimum/maximum holding sizes or sector exposure limits, making it indispensable for designing products that comply with specific investment mandates.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Portfolio Constraint</h3>
                         <div className="flex items-center space-x-2 mt-4">
                            <Slider label="Max Number of Assets" value={maxAssets} min={1} max={8} step={1} onChange={setMaxAssets}/>
                            <InfoTooltip text="This sets the cardinality constraint (k). The optimizer must find the best portfolio using at most 'k' assets, forcing some weights to be zero."/>
                        </div>
                    </Card>
                     <Card>
                         <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Portfolio Statistics</h3>
                         <div className="mt-4 space-y-3">
                             <div className="flex justify-between items-center">
                                 <span className="text-secondary text-sm">Active Assets:</span>
                                 <span className="font-semibold text-accent font-mono text-lg">{stats.activeAssets} / {maxAssets}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-secondary text-sm">Total Weight:</span>
                                 <span className="font-semibold text-primary font-mono text-lg">{(stats.totalWeight * 100).toFixed(0)}%</span>
                             </div>
                         </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Optimal Portfolio Weights</h3>
                         <p className="text-sm text-secondary mb-4">This chart shows the resulting asset weights for the optimal portfolio that satisfies the constraint. As you reduce the maximum number of assets, the optimizer is forced to reallocate capital.</p>
                         <div className="h-[30rem] w-full">
                            <ResponsiveContainer>
                                <BarChart data={portfolioData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis type="number" domain={[0, 1]} tickFormatter={(w) => `${(w*100).toFixed(0)}%`} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                        <Label value="Portfolio Weight (%)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#AFAF9B', fontSize: 12 }}/>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(w: number) => `${(w*100).toFixed(1)}%`}/>
                                    <Bar dataKey="weight" fill="#D4AF37" />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MixedIntegerOptimisationModel;