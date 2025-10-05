import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { STOCK_DATA } from '../../data/stock_data';
import type { PortfolioAsset, StockDataPoint } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Area } from 'recharts';
import { formatMillions } from '../../utils/chartHelpers';

// --- Helper Functions ---
const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

const calculatePortfolioStats = (portfolio: PortfolioAsset[]): {mean: number, vol: number} => {
    if (portfolio.length === 0) {
        return { mean: 0, vol: 0 };
    }

    const assetStats = portfolio.map(asset => {
        const assetData = STOCK_DATA[asset.ticker];
        if (!assetData || assetData.length < 2) {
            return { ticker: asset.ticker, weight: asset.weight, annualReturn: 0, annualVol: 0 };
        }

        const returns = [];
        for (let i = 1; i < assetData.length; i++) {
            returns.push(Math.log(assetData[i].price / assetData[i-1].price));
        }

        if (returns.length < 2) {
            return { ticker: asset.ticker, weight: asset.weight, annualReturn: 0, annualVol: 0 };
        }
        
        const meanDailyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, val) => acc + (val - meanDailyReturn)**2, 0) / (returns.length - 1);
        const dailyVol = Math.sqrt(variance);

        const annualReturn = meanDailyReturn * 252;
        const annualVol = dailyVol * Math.sqrt(252);
        
        return { ticker: asset.ticker, weight: asset.weight, annualReturn, annualVol };
    });

    const portfolioMeanReturn = assetStats.reduce((acc, stat) => acc + stat.annualReturn * stat.weight, 0);
    
    let portfolioVariance = 0;
    const avgCorrelation = 0.4; // Simplified assumption
    
    for (let i = 0; i < assetStats.length; i++) {
        for (let j = 0; j < assetStats.length; j++) {
            if (i === j) {
                // Add variance term: w_i^2 * sigma_i^2
                portfolioVariance += assetStats[i].weight**2 * assetStats[i].annualVol**2;
            } else {
                // Add covariance term: w_i * w_j * sigma_i * sigma_j * rho_ij
                portfolioVariance += assetStats[i].weight * assetStats[j].weight * assetStats[i].annualVol * assetStats[j].annualVol * avgCorrelation;
            }
        }
    }
    
    // Ensure variance is not negative due to floating point issues or strange weights
    const safeVariance = Math.max(0, portfolioVariance);

    return { mean: portfolioMeanReturn, vol: Math.sqrt(safeVariance) };
};


const generatePortfolioPaths = (initialValue: number, mean: number, vol: number, T: number, paths: number) => {
    const steps = 100;
    const dt = T / steps;
    const allPaths = [];
    const finalValues = [];

    for (let i = 0; i < paths; i++) {
        const path = [{ time: 0, value: initialValue }];
        let currentValue = initialValue;
        for (let j = 1; j <= steps; j++) {
            const drift = (mean - 0.5 * vol**2) * dt;
            const diffusion = vol * Math.sqrt(dt) * randomNormal();
            currentValue *= Math.exp(drift + diffusion);
            path.push({ time: j * dt, value: currentValue });
        }
        allPaths.push(path);
        finalValues.push(currentValue);
    }
    
    finalValues.sort((a, b) => a - b);
    const percentiles = {
        p5: finalValues[Math.floor(paths * 0.05)],
        p50: finalValues[Math.floor(paths * 0.5)],
        p95: finalValues[Math.floor(paths * 0.95)],
    };

    const coneData = [];
    for (let j=0; j<=steps; j++) {
        const time = j * dt;
        const center = initialValue * Math.exp(mean * time);
        const width = initialValue * Math.exp(mean * time) * vol * Math.sqrt(time) * 1.645; // 90% confidence
        coneData.push({
            time,
            range: [Math.max(0, center - width), center + width]
        });
    }

    return { paths: allPaths.slice(0, 50), percentiles, coneData };
};


// --- Component ---
const PortfolioSimulator: React.FC = () => {
    const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([
        { ticker: 'AAPL', weight: 0.3 },
        { ticker: 'MSFT', weight: 0.3 },
        { ticker: 'NVDA', weight: 0.4 },
    ]);
    const [newTicker, setNewTicker] = useState('');
    const [initialValue, setInitialValue] = useState(1_000_000);
    const [T, setT] = useState(1);
    const [paths, setPaths] = useState(1000);

    const [debouncedPaths, setDebouncedPaths] = useState(paths);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedPaths(paths), 300);
        return () => clearTimeout(handler);
    }, [paths]);
    
    const { portfolioStats, simulation } = useMemo(() => {
        const stats = calculatePortfolioStats(portfolio);
        // Cap volatility passed to the simulation to prevent numerical explosions from extreme inputs
        const cappedVol = Math.min(stats.vol, 5.0); // Cap at 500%
        const sim = generatePortfolioPaths(initialValue, stats.mean, cappedVol, T, debouncedPaths);
        return { portfolioStats: stats, simulation: sim };
    }, [portfolio, initialValue, T, debouncedPaths]);

    const handleAddAsset = () => {
        const tickerUpper = newTicker.toUpperCase();
        if (tickerUpper && STOCK_DATA[tickerUpper] && !portfolio.find(a => a.ticker === tickerUpper)) {
            const newPortfolio = [...portfolio, { ticker: tickerUpper, weight: 0 }];
            normalizeWeights(newPortfolio);
            setNewTicker('');
        }
    };

    const handleRemoveAsset = (ticker: string) => {
        const newPortfolio = portfolio.filter(a => a.ticker !== ticker);
        normalizeWeights(newPortfolio);
    };

    const handleWeightChange = (ticker: string, newWeight: number) => {
        const newPortfolio = portfolio.map(a => a.ticker === ticker ? { ...a, weight: newWeight / 100 } : a);
        setPortfolio(newPortfolio);
    };

    const normalizeWeights = (assets: PortfolioAsset[]) => {
        const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
        if (totalWeight > 0) {
            setPortfolio(assets.map(a => ({ ...a, weight: a.weight / totalWeight })));
        } else {
            setPortfolio(assets);
        }
    };
    
    const totalWeightPercent = useMemo(() => portfolio.reduce((sum, a) => sum + a.weight, 0) * 100, [portfolio]);

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
                <h2 className="text-2xl font-bold text-primary">Portfolio Monte Carlo Simulator</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Construct a portfolio of real-world assets and simulate its future value using Monte Carlo methods. This tool helps visualize the range of potential outcomes and understand portfolio risk.
                     <br/><span className="text-accent/70 text-xs">Note: Uses simulated historical data for demonstration. Covariance is simplified.</span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Portfolio Construction & Sim Params */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2 mb-4">Portfolio Construction</h3>
                        <div className="space-y-3">
                            {portfolio.map(asset => (
                                <div key={asset.ticker} className="flex items-center gap-3">
                                    <span className="font-mono font-semibold text-accent w-16">{asset.ticker}</span>
                                    <input 
                                        type="range" min="0" max="100" value={asset.weight * 100} 
                                        onChange={(e) => handleWeightChange(asset.ticker, parseFloat(e.target.value))}
                                        className="w-full h-2 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="font-mono text-primary w-16 text-right">{(asset.weight * 100).toFixed(1)}%</span>
                                    <button onClick={() => handleRemoveAsset(asset.ticker)} className="text-secondary hover:text-red-400">&times;</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-secondary/20 flex gap-2">
                             <input 
                                type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)}
                                placeholder="e.g. GOOG"
                                className="bg-background border border-secondary/30 rounded px-2 py-1 w-full text-sm font-mono"
                             />
                             <button onClick={handleAddAsset} className="bg-accent/80 hover:bg-accent text-background font-semibold px-4 py-1 rounded text-sm">Add</button>
                        </div>
                         <div className="mt-3 text-right">
                             <button onClick={() => normalizeWeights(portfolio)} className="text-xs text-accent/80 hover:underline">Normalize to 100%</button>
                             <p className={`text-xs mt-1 ${totalWeightPercent.toFixed(0) !== '100' ? 'text-red-400' : 'text-secondary'}`}>Total Weight: {totalWeightPercent.toFixed(1)}%</p>
                         </div>
                    </Card>
                    <Card>
                         <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2 mb-4">Simulation Parameters</h3>
                         <div className="space-y-4">
                            <Slider label="Initial Portfolio Value" value={initialValue} min={10000} max={10_000_000} step={10000} onChange={setInitialValue} unit="$" />
                            <Slider label="Forecast Horizon (T)" value={T} min={0.5} max={5} step={0.5} onChange={setT} unit=" years" />
                            <Slider label="Simulation Paths" value={paths} min={500} max={5000} step={100} onChange={setPaths} />
                         </div>
                    </Card>
                </div>
                {/* Column 2: Results & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary mb-3">Projected Portfolio Value at {T} {T > 1 ? 'Years' : 'Year'}</h3>
                         <div className="grid grid-cols-3 gap-4 text-center">
                             <div>
                                 <p className="text-xs text-secondary uppercase tracking-wider">5th Percentile</p>
                                 <p className="text-2xl font-semibold text-red-400/80 font-mono">{formatMillions(simulation.percentiles.p5)}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-secondary uppercase tracking-wider">Median (50th)</p>
                                 <p className="text-2xl font-semibold text-primary font-mono">{formatMillions(simulation.percentiles.p50)}</p>
                             </div>
                              <div>
                                 <p className="text-xs text-secondary uppercase tracking-wider">95th Percentile</p>
                                 <p className="text-2xl font-semibold text-green-400/80 font-mono">{formatMillions(simulation.percentiles.p95)}</p>
                             </div>
                         </div>
                    </Card>
                     <Card>
                         <h3 className="text-lg font-semibold text-primary">Portfolio Value Forecast Cone</h3>
                         <p className="text-sm text-secondary mb-4">The shaded area represents the 90% confidence interval for the portfolio's value over time. 50 sample paths are shown.</p>
                         <div className="h-96 w-full">
                            <ResponsiveContainer>
                                <LineChart margin={{ top: 5, right: 20, left: 20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="time" type="number" domain={[0, T]} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                         <Label value="Time (Years)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin', 'dataMax']} tickFormatter={formatMillions}>
                                        <Label value="Portfolio Value" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={-5} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => `${formatMillions(value)}`} labelFormatter={(label) => `Time: ${label.toFixed(2)}y`}/>
                                    {simulation.paths.map((path, i) => (
                                        <Line key={i} data={path} type="monotone" dataKey="value" stroke="#D4AF37" strokeOpacity={0.15} dot={false} strokeWidth={1}/>
                                    ))}
                                    <Area data={simulation.coneData} dataKey="range" fill="#D4AF37" stroke="#D4AF37" fillOpacity={0.2} strokeOpacity={0.5} name="90% Confidence Interval"/>
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSimulator;