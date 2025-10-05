import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

const generateJumpPaths = (S0: number, T: number, r: number, sigma: number, lambda: number, mu: number, delta: number) => {
    const steps = 252; // Daily steps for a year
    const dt = T / steps;
    const paths = [];

    for (let i = 0; i < 20; i++) { // Generate 20 paths for display
        const path = [{ time: 0, price: S0 }];
        let currentPrice = S0;
        for (let j = 1; j <= steps; j++) {
            // Poisson process to determine if a jump occurs in this step
            const poissonDraw = Math.random();
            let jump = 0;
            if (poissonDraw < lambda * dt) { // Probability of a jump is lambda*dt
                jump = Math.exp(mu + delta * randomNormal()) - 1;
            }
            // Standard geometric Brownian motion component
            const drift = (r - 0.5 * sigma * sigma - lambda * (Math.exp(mu + 0.5 * delta * delta) - 1)) * dt;
            const diffusion = sigma * Math.sqrt(dt) * randomNormal();

            currentPrice *= Math.exp(drift + diffusion) * (1 + jump);
            path.push({ time: j * dt, price: currentPrice });
        }
        paths.push(path);
    }
    return paths;
};

interface ModelParams {
    S: number; T: number; r: number; sigma: number; lambda: number; mu: number; delta: number;
}

const MertonJumpDiffusionModel: React.FC = () => {
    const [params, setParams] = useState<ModelParams>({
        S: 100, T: 1, r: 5, sigma: 20, lambda: 0.5, mu: -0.1, delta: 0.2
    });

    const [debouncedParams, setDebouncedParams] = useState(params);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedParams(params), 300);
        return () => clearTimeout(handler);
    }, [params]);

    const handleParamChange = (field: keyof ModelParams, value: number) => {
        setParams(prev => ({ ...prev, [field]: value }));
    };

    const chartPaths = useMemo(() => {
        const { S, T, r, sigma, lambda, mu, delta } = debouncedParams;
        return generateJumpPaths(S, T, r/100, sigma/100, lambda, mu, delta);
    }, [debouncedParams]);
    
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
                <h2 className="text-2xl font-bold text-primary">Merton Jump Diffusion Model</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    The Merton model enhances Black-Scholes by adding a "jump" component to account for sudden, significant price movements caused by unexpected news or market shocks. This produces the "fat tails" observed in real-world asset return distributions.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    This model is particularly useful for assets prone to sudden price gaps, such as biotech stocks awaiting FDA approval, or energy commodities sensitive to geopolitical events. By explicitly modeling jumps, it can provide more realistic prices for deep out-of-the-money options, which are often underpriced by Black-Scholes. A fund might use this model to structure trades that profit from the "crash risk" premium. The challenge and key to performance lies in accurately calibrating the jump parameters (intensity, mean, and volatility) from market data, which is non-trivial.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Model Parameters</h3>
                    
                    <Slider label="Initial Price (S₀)" value={params.S} min={50} max={200} step={1} onChange={v => handleParamChange('S', v)} unit="$"/>
                    <Slider label="Maturity (T)" value={params.T} min={0.5} max={2} step={0.1} onChange={v => handleParamChange('T', v)} unit=" years"/>
                    <Slider label="Risk-Free Rate (r)" value={params.r} min={0} max={10} step={0.1} onChange={v => handleParamChange('r', v)} unit="%"/>
                    <Slider label="Volatility (σ)" value={params.sigma} min={5} max={50} step={1} onChange={v => handleParamChange('sigma', v)} unit="%"/>

                    <div className="flex items-center space-x-2">
                        <Slider label="Jump Intensity (λ)" value={params.lambda} min={0.1} max={5} step={0.1} onChange={v => handleParamChange('lambda', v)}/>
                        <InfoTooltip text="Lambda (λ) represents the average number of jumps expected to occur per year. A higher lambda means jumps are more frequent."/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Slider label="Mean Jump Size (μ)" value={params.mu} min={-0.5} max={0.5} step={0.05} onChange={v => handleParamChange('mu', v)}/>
                        <InfoTooltip text="Mu (μ) is the average magnitude of a jump (in log-space). A negative value means jumps are, on average, downwards (crashes)."/>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Slider label="Jump Volatility (δ)" value={params.delta} min={0.05} max={0.5} step={0.05} onChange={v => handleParamChange('delta', v)}/>
                        <InfoTooltip text="Delta (δ) is the standard deviation of the jump size. It controls how variable the magnitude of the jumps are."/>
                    </div>

                </Card>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Simulated Price Paths with Jumps</h3>
                         <p className="text-sm text-secondary mb-4">This chart displays simulated asset price paths. Unlike the smooth paths of a standard model, these exhibit sudden, discontinuous jumps, providing a more realistic depiction of market behavior during volatile events.</p>
                         <div className="h-[34rem] w-full">
                            <ResponsiveContainer>
                                <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="time" type="number" domain={[0, debouncedParams.T]} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                        <Label value="Time (Years)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin', 'dataMax']} tickFormatter={(p) => `$${p.toFixed(0)}`}>
                                        <Label value="Asset Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => `$${value.toFixed(2)}`} labelFormatter={(label) => `Time: ${label.toFixed(2)}y`}/>
                                    {chartPaths.map((path, i) => (
                                        <Line key={i} data={path} type="monotone" dataKey="price" stroke="#D4AF37" strokeOpacity={0.4} dot={false} strokeWidth={1.5}/>
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

export default MertonJumpDiffusionModel;