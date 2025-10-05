import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StochasticControlModel: React.FC = () => {
    const [gamma, setGamma] = useState(3); // Risk aversion
    const [mu, setMu] = useState(8); // Risky asset expected return %
    const [sigma, setSigma] = useState(20); // Risky asset volatility %
    const [r, setR] = useState(3); // Risk-free rate %

    const { allocation, riskyFraction } = useMemo(() => {
        const muDecimal = mu / 100;
        const sigmaDecimal = sigma / 100;
        const rDecimal = r / 100;

        // Merton's portfolio fraction formula
        const calculatedFraction = (muDecimal - rDecimal) / (gamma * sigmaDecimal ** 2);
        
        // Cap allocation at 200% (leverage) and -100% (short) for realism in the demo
        const cappedRisky = Math.max(-1, Math.min(2, calculatedFraction));
        
        const allocationData = [
            { name: 'Risky Asset (Stocks)', value: cappedRisky },
            { name: 'Risk-Free Asset (Bonds)', value: 1 - cappedRisky }
        ];

        return { allocation: allocationData, riskyFraction: calculatedFraction };
    }, [gamma, mu, sigma, r]);
    
    const COLORS = ['#D4AF37', '#6B7280'];

    const CustomLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent === 0 || Math.abs(percent) < 0.05) return null;

        return (
            <text x={x} y={y} fill="#111827" textAnchor="middle" dominantBaseline="central" className="font-semibold text-sm">
                {`${((percent ?? 0) * 100).toFixed(0)}%`}
            </text>
        );
    }, []);

    const tooltipStyle = useMemo(() => ({
        backgroundColor: '#2A2A2A',
        border: '1px solid #AFAF9B'
    }), []);


    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-primary">Stochastic Control for Continuous-Time Portfolios</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    This model addresses Merton's Portfolio Problem, which seeks to find the optimal dynamic investment strategy by allocating capital between a risky asset (stocks) and a risk-free asset (bonds) to maximize an investor's utility.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    Merton's model is the theoretical foundation for strategic asset allocation and modern robo-advising platforms. While its assumptions (e.g., constant investment opportunities) are simplifying, it provides a powerful, logical baseline for portfolio construction. In practice, asset managers extend this framework by using more dynamic inputs (e.g., a GARCH model for volatility, a time-varying risk premium). The "performance" derived from this model is long-term and strategic; it ensures a portfolio's risk profile is consistently aligned with the investor's goals, rather than chasing short-term returns. It provides a disciplined approach that avoids emotional decision-making.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Investor & Market Parameters</h3>
                    
                    <div className="flex items-center space-x-2">
                        <Slider label="Risk Aversion (γ)" value={gamma} min={1} max={10} step={0.5} onChange={setGamma}/>
                        <InfoTooltip text="Gamma (γ) measures an investor's dislike for risk. Higher gamma leads to a more conservative portfolio."/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Slider label="Stock Expected Return (μ)" value={mu} min={2} max={15} step={0.5} onChange={setMu} unit="%"/>
                        <InfoTooltip text="Mu (μ) is the expected annual return of the risky asset. A higher return makes it more attractive."/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Slider label="Stock Volatility (σ)" value={sigma} min={10} max={40} step={1} onChange={setSigma} unit="%"/>
                        <InfoTooltip text="Sigma (σ) is the annual volatility (risk) of the risky asset. Higher volatility makes it less attractive."/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Slider label="Risk-Free Rate (r)" value={r} min={0} max={8} step={0.25} onChange={setR} unit="%"/>
                        <InfoTooltip text="The annual return on the risk-free asset, acting as the opportunity cost."/>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-primary">Merton's Optimal Allocation Formula</h3>
                        <div className="text-center bg-black/20 p-4 rounded-lg my-2 font-mono text-primary tracking-wider">
                           <span className="text-accent text-lg">π*</span> = (μ - r) / (γ * σ²)
                           <div className="mt-2 text-secondary text-sm">
                               π* = ({mu}% - {r}%) / ({gamma} * {sigma}%²) = <span className="text-primary font-bold">{(riskyFraction * 100).toFixed(1)}%</span>
                           </div>
                        </div>
                    </Card>
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Optimal Portfolio Allocation</h3>
                         <p className="text-sm text-secondary mb-4">The pie chart displays the optimal percentage of the portfolio to allocate to stocks and bonds. Note that the stock allocation can exceed 100% (leverage) or be negative (short-selling).</p>
                         <div className="h-80 w-full">
                             <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={allocation}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={CustomLabel}
                                    >
                                        {allocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string) => [`${(value * 100).toFixed(1)}%`, name]} contentStyle={tooltipStyle}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StochasticControlModel;