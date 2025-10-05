import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

const generateCIRPaths = (r0: number, a: number, b: number, sigma: number, T: number) => {
    const steps = 252;
    const dt = T / steps;
    const paths = [];

    for (let i = 0; i < 25; i++) { // Generate 25 paths for display
        const path = [{ time: 0, rate: r0 }];
        let currentRate = r0;
        for (let j = 1; j <= steps; j++) {
            const dW = randomNormal() * Math.sqrt(dt);
            const drift = a * (b - currentRate) * dt;
            const diffusion = sigma * Math.sqrt(Math.max(0, currentRate)) * dW; // Use max(0, r) to prevent issues
            currentRate += drift + diffusion;
            currentRate = Math.max(0, currentRate); // Ensure rate stays non-negative
            path.push({ time: j * dt, rate: currentRate });
        }
        paths.push(path);
    }
    return paths;
};

interface ModelParams {
    r0: number; T: number; a: number; b: number; sigma: number;
}

const InterestRateModel: React.FC = () => {
    const [params, setParams] = useState<ModelParams>({
        r0: 2, T: 5, a: 0.3, b: 3, sigma: 0.5
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
        const { r0, T, a, b, sigma } = debouncedParams;
        // Check Feller condition for positivity
        const fellerConditionMet = 2 * a * b >= sigma ** 2;
        return {
            paths: generateCIRPaths(r0 / 100, a, b / 100, sigma / 100, T),
            fellerMet: fellerConditionMet
        };
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
                <h2 className="text-2xl font-bold text-primary">Cox-Ingersoll-Ross (CIR) Interest Rate Model</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    The CIR model is a mathematical formula for modeling the evolution of interest rates. Unlike other models like Vasicek, it ensures that rates remain positive. It features mean reversion, pulling the rate towards a long-term average, and a volatility that increases with the level of the rate.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    CIR and similar models are the engine behind the pricing of fixed-income derivatives like bond options, caps, floors, and swaptions. They are essential for any institution managing interest rate risk. For a bank or hedge fund, having a well-calibrated interest rate model is crucial for hedging their bond portfolios and structuring complex financial products. The "performance" is measured by the model's ability to accurately price and hedge these instruments, which depends heavily on its calibration to the current yield curve and market-implied volatilities (the "volatility surface").
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">CIR Model Parameters</h3>
                    
                    <Slider label="Initial Rate (r₀)" value={params.r0} min={0.1} max={10} step={0.1} onChange={v => handleParamChange('r0', v)} unit="%"/>
                    <Slider label="Forecast Horizon (T)" value={params.T} min={1} max={20} step={1} onChange={v => handleParamChange('T', v)} unit=" years"/>
                    
                    <div className="flex items-center space-x-2">
                        <Slider label="Mean Reversion (a)" value={params.a} min={0.05} max={1} step={0.05} onChange={v => handleParamChange('a', v)}/>
                        <InfoTooltip text="The speed at which the rate is pulled back towards the long-term mean 'b'."/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Slider label="Long-Term Mean (b)" value={params.b} min={1} max={10} step={0.1} onChange={v => handleParamChange('b', v)} unit="%"/>
                        <InfoTooltip text="The average level that the interest rate tends towards over time."/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Slider label="Volatility (σ)" value={params.sigma} min={0.1} max={5} step={0.1} onChange={v => handleParamChange('sigma', v)} unit="%"/>
                        <InfoTooltip text="The magnitude of the random fluctuations in the interest rate."/>
                    </div>

                    <div className={`text-xs text-center p-2 rounded ${chartPaths.fellerMet ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        Feller Condition (2ab ≥ σ²): {chartPaths.fellerMet ? 'Met. Rates stay positive.' : 'Not Met. Rates can hit zero.'}
                    </div>

                </Card>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Simulated Short-Term Interest Rate Paths</h3>
                         <p className="text-sm text-secondary mb-4">Each line represents a possible future evolution of the short-term interest rate. The model shows rates tending towards the long-term mean (dashed line). Volatility is higher when the rate itself is higher.</p>
                         <div className="h-[34rem] w-full">
                            <ResponsiveContainer>
                                <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="time" type="number" domain={[0, debouncedParams.T]} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                        <Label value="Time (Years)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={[0, 'dataMax']} tickFormatter={(p) => `${(p*100).toFixed(1)}%`}>
                                        <Label value="Interest Rate" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => `${(value*100).toFixed(2)}%`} labelFormatter={(label) => `Time: ${label.toFixed(2)}y`}/>
                                    <ReferenceLine y={params.b/100} stroke="#EAE0C8" strokeDasharray="3 3">
                                        <Label value="Long-Term Mean" position="insideTopRight" fill="#EAE0C8" fontSize={12}/>
                                    </ReferenceLine>
                                    {chartPaths.paths.map((path, i) => (
                                        <Line key={i} data={path} type="monotone" dataKey="rate" stroke="#D4AF37" strokeOpacity={0.4} dot={false} strokeWidth={1.5}/>
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

export default InterestRateModel;