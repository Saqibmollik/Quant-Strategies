import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

// B-S implementation for comparison
const normalCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
};
const blackScholesCall = (S: number, K: number, T: number, r: number, sigma: number): number => {
    if (T <= 0 || sigma <= 0) return Math.max(0, S - K * Math.exp(-r * T));
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
};

const calculateBinomialPrice = (S: number, K: number, T: number, r: number, sigma: number, steps: number): number => {
    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp(r * dt) - d) / (u - d);

    if (p < 0 || p > 1) return 0; // No arbitrage condition violated

    const prices = new Array(steps + 1);
    
    // Final node prices (payoff at maturity)
    for (let i = 0; i <= steps; i++) {
        prices[i] = Math.max(0, S * (u ** (steps - i)) * (d ** i) - K);
    }

    // Backward induction
    for (let j = steps - 1; j >= 0; j--) {
        for (let i = 0; i <= j; i++) {
            prices[i] = (p * prices[i] + (1 - p) * prices[i + 1]) * Math.exp(-r * dt);
        }
    }

    return prices[0];
};

const BinomialOptionPricingModel: React.FC = () => {
    const [S, setS] = useState(100);
    const [K, setK] = useState(105);
    const [T, setT] = useState(1);
    const [r, setR] = useState(5);
    const [sigma, setSigma] = useState(20);
    const [steps, setSteps] = useState(50);
    
    // Debounce the steps for smoother chart updates
    const [debouncedSteps, setDebouncedSteps] = useState(steps);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSteps(steps), 300);
        return () => clearTimeout(handler);
    }, [steps]);

    const binomialPrice = useMemo(() => {
        return calculateBinomialPrice(S, K, T, r/100, sigma/100, debouncedSteps);
    }, [S, K, T, r, sigma, debouncedSteps]);
    
    const { chartData, convergenceError } = useMemo(() => {
        const data = [];
        const rDecimal = r / 100;
        const sigmaDecimal = sigma / 100;
        const bsPrice = blackScholesCall(S, K, T, rDecimal, sigmaDecimal);
        let finalBinomialPrice = 0;

        const maxSteps = 150;
        for (let i = 5; i <= maxSteps; i += 5) {
            const currentBinomialPrice = calculateBinomialPrice(S, K, T, rDecimal, sigmaDecimal, i);
            data.push({
                steps: i,
                binomial: currentBinomialPrice,
                blackScholes: bsPrice,
            });
            if (i === maxSteps) {
                finalBinomialPrice = currentBinomialPrice;
            }
        }
        const error = bsPrice > 0 ? Math.abs(finalBinomialPrice - bsPrice) / bsPrice : 0;
        return {chartData: data, convergenceError: error};
    }, [S, K, T, r, sigma]);

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
                <h2 className="text-2xl font-bold text-primary">Binomial Option Pricing Model</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    The Binomial model is an intuitive numerical method for valuing options by approximating an asset's price path with a discrete binomial tree. By working backward from the option's known payoff at expiration, we can determine its value today.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    The primary advantage of the binomial model is its flexibility. Unlike the basic Black-Scholes model, it can accurately price American-style options, where early exercise is possible. This is crucial for options on dividend-paying stocks. It can also be adapted to handle more complex option features. While computationally slower than closed-form solutions, its intuitive nature makes it a powerful tool for both pricing and for validating more complex models. The "performance" of this model is its accuracy, which increases with the number of steps in the tree.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Model Parameters</h3>
                    
                    <Slider label="Spot Price (S)" value={S} min={50} max={200} step={1} onChange={setS} unit="$"/>
                    <Slider label="Strike Price (K)" value={K} min={50} max={200} step={1} onChange={setK} unit="$"/>
                    <Slider label="Time to Maturity (T)" value={T} min={0.1} max={2} step={0.1} onChange={setT} unit=" years"/>
                    <Slider label="Risk-Free Rate (r)" value={r} min={0} max={10} step={0.1} onChange={setR} unit="%"/>
                    <Slider label="Volatility (σ)" value={sigma} min={5} max={80} step={1} onChange={setSigma} unit="%"/>
                    <div className="flex items-center space-x-2">
                        <Slider label="Tree Steps" value={steps} min={10} max={200} step={5} onChange={setSteps} />
                        <InfoTooltip text="The number of discrete time steps. As steps increase, the model's price converges to the Black-Scholes price, but at a higher computational cost." />
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-base font-semibold text-primary mb-2">Calculated Price</h3>
                            <div className="text-center">
                                <p className="text-3xl font-semibold text-accent font-mono">${binomialPrice.toFixed(2)}</p>
                                <p className="text-xs text-secondary mt-1">(Using {debouncedSteps} steps)</p>
                            </div>
                        </Card>
                         <Card>
                            <h3 className="text-base font-semibold text-primary mb-2">Convergence Error</h3>
                            <div className="text-center">
                                <p className="text-3xl font-semibold text-accent font-mono">{(convergenceError * 100).toFixed(3)}%</p>
                                <p className="text-xs text-secondary mt-1">(At 150 steps vs B-S)</p>
                            </div>
                        </Card>
                    </div>
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Convergence to Black-Scholes</h3>
                         <p className="text-sm text-secondary mb-4">This chart illustrates that as the number of time steps increases, the Binomial model's price converges to the continuous-time Black-Scholes price (dashed line).</p>
                         <div className="h-80 w-full">
                             <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="steps" tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                        <Label value="Number of Steps" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(p) => `$${p.toFixed(1)}`}>
                                        <Label value="Option Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => `$${value.toFixed(3)}`}/>
                                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                                    <Line type="monotone" dataKey="binomial" stroke="#D4AF37" strokeWidth={2} name="Binomial Price" dot={false}/>
                                    <Line type="monotone" dataKey="blackScholes" stroke="#AFAF9B" strokeWidth={2} name="Black-Scholes Price" dot={false} strokeDasharray="5 5"/>
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BinomialOptionPricingModel;