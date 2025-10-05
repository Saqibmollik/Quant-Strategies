import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

// Box-Muller transform to get standard normal random variable
const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

const generatePaths = (S0: number, K: number, T: number, r: number, sigma: number, steps: number, paths: number) => {
    const dt = T / steps;
    const drift = (r - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    const allPaths = [];
    let totalPayoff = 0;

    for (let i = 0; i < paths; i++) {
        const path = [{ time: 0, price: S0 }];
        let currentPrice = S0;
        let priceSum = S0;
        for (let j = 1; j <= steps; j++) {
            currentPrice *= Math.exp(drift + diffusion * randomNormal());
            priceSum += currentPrice;
            path.push({ time: j * dt, price: currentPrice });
        }
        allPaths.push(path);
        
        const avgPrice = priceSum / (steps + 1);
        totalPayoff += Math.max(0, avgPrice - K);
    }

    const asianOptionPrice = (totalPayoff / paths) * Math.exp(-r * T);

    return { chartPaths: allPaths.slice(0, 25), asianOptionPrice }; // Display up to 25 paths
};

const MonteCarloModel: React.FC = () => {
    const [S, setS] = useState(100);
    const [K, setK] = useState(100);
    const [T, setT] = useState(1);
    const [r, setR] = useState(5);
    const [sigma, setSigma] = useState(20);
    const [paths, setPaths] = useState(1000);

    // Debounce paths for smoother UI
    const [debouncedPaths, setDebouncedPaths] = useState(paths);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedPaths(paths), 300);
        return () => clearTimeout(handler);
    }, [paths]);

    const { chartPaths, asianOptionPrice } = useMemo(() => {
        return generatePaths(S, K, T, r/100, sigma/100, 100, debouncedPaths);
    }, [S, K, T, r, sigma, debouncedPaths]);
    
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
                <h2 className="text-2xl font-bold text-primary">Monte Carlo Simulations for Asian Options</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Monte Carlo methods use random sampling to value complex financial instruments. By simulating thousands of possible future price paths for an asset, we can estimate the price of "exotic" options. An Asian option's payoff depends on the average price of the asset over a period, making it ideal for this simulation-based approach.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    Monte Carlo is the workhorse for pricing derivatives that have no closed-form solution (like Asian, lookback, or basket options). It's also fundamental to risk management, where firms simulate portfolio values under thousands of scenarios to calculate metrics like Value at Risk (VaR) and Expected Shortfall. The "performance" of a Monte Carlo simulation is its accuracy, which improves with the square root of the number of paths—meaning a 4x increase in computation is needed to double the accuracy. Variance reduction techniques are often employed to accelerate convergence.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Simulation Parameters</h3>
                    
                    <Slider label="Initial Price (S₀)" value={S} min={50} max={200} step={1} onChange={setS} unit="$"/>
                    <Slider label="Strike Price (K)" value={K} min={50} max={200} step={1} onChange={setK} unit="$"/>
                    <Slider label="Maturity (T)" value={T} min={0.1} max={2} step={0.1} onChange={setT} unit=" years"/>
                    <Slider label="Risk-Free Rate (r)" value={r} min={0} max={10} step={0.1} onChange={setR} unit="%"/>
                    <Slider label="Volatility (σ)" value={sigma} min={5} max={80} step={1} onChange={setSigma} unit="%"/>
                    <div className="flex items-center space-x-2">
                        <Slider label="Number of Paths" value={paths} min={100} max={10000} step={100} onChange={setPaths}/>
                        <InfoTooltip text="The number of simulated futures. The Law of Large Numbers states that the average outcome of the simulations will converge to the true expected value as the number of paths increases."/>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-primary mb-1">Calculated Asian Call Option Price</h3>
                        <p className="text-sm text-secondary mb-3">This is the estimated price of an Asian call option with a strike price K of ${K.toFixed(2)}.</p>
                        <div className="text-center">
                            <p className="text-4xl font-semibold text-accent font-mono">${asianOptionPrice.toFixed(2)}</p>
                             <p className="text-xs text-secondary mt-1">(Using {debouncedPaths.toLocaleString()} paths)</p>
                        </div>
                    </Card>
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Sample of Simulated Price Paths</h3>
                         <p className="text-sm text-secondary mb-4">Each line represents one possible future price evolution. The option price is the discounted average of the payoffs from all simulated paths. The horizontal line indicates the strike price.</p>
                         <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="time" type="number" domain={[0, T]} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                         <Label value="Time (Years)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin', 'dataMax']} tickFormatter={(p) => `$${p.toFixed(0)}`}>
                                        <Label value="Asset Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => `$${value.toFixed(2)}`} labelFormatter={(label) => `Time: ${label.toFixed(2)}y`}/>
                                    <ReferenceLine y={K} stroke="#EAE0C8" strokeDasharray="3 3">
                                        <Label value="Strike" position="right" fill="#EAE0C8" fontSize={12} />
                                    </ReferenceLine>
                                    {chartPaths.map((path, i) => (
                                        <Line key={i} data={path} type="monotone" dataKey="price" stroke="#D4AF37" strokeOpacity={0.3} dot={false} strokeWidth={1}/>
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MonteCarloModel;