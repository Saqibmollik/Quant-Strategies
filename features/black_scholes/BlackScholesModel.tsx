import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

// Helper for Normal Cumulative Distribution Function (CDF) using the Abramowitz and Stegun approximation
const normalCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
};

const BlackScholesModel: React.FC = () => {
    const [S, setS] = useState(100); // Spot Price
    const [K, setK] = useState(105); // Strike Price
    const [T, setT] = useState(1);   // Time to Maturity (in years)
    const [r, setR] = useState(5);   // Risk-free Rate (in %)
    const [sigma, setSigma] = useState(20); // Volatility (in %)

    const { callPrice, putPrice } = useMemo(() => {
        const rDecimal = r / 100;
        const sigmaDecimal = sigma / 100;

        if (T <= 0 || sigmaDecimal <= 0) return { callPrice: 0, putPrice: 0 };

        const d1 = (Math.log(S / K) + (rDecimal + 0.5 * sigmaDecimal ** 2) * T) / (sigmaDecimal * Math.sqrt(T));
        const d2 = d1 - sigmaDecimal * Math.sqrt(T);

        const callPrice = S * normalCDF(d1) - K * Math.exp(-rDecimal * T) * normalCDF(d2);
        const putPrice = K * Math.exp(-rDecimal * T) * normalCDF(-d2) - S * normalCDF(-d1);
        
        return { callPrice, putPrice };
    }, [S, K, T, r, sigma]);
    
    const chartData = useMemo(() => {
        const data = [];
        const rDecimal = r / 100;
        const sigmaDecimal = sigma / 100;

        for (let spot = S * 0.7; spot <= S * 1.3; spot += (S * 0.6 / 50)) {
            if (T <= 0 || sigmaDecimal <= 0) {
                 data.push({ spot, call: 0, put: 0, callIntrinsic: 0, putIntrinsic: 0 });
                 continue;
            }
            const d1 = (Math.log(spot / K) + (rDecimal + 0.5 * sigmaDecimal ** 2) * T) / (sigmaDecimal * Math.sqrt(T));
            const d2 = d1 - sigmaDecimal * Math.sqrt(T);
            
            const call = spot * normalCDF(d1) - K * Math.exp(-rDecimal * T) * normalCDF(d2);
            const put = K * Math.exp(-rDecimal * T) * normalCDF(-d2) - spot * normalCDF(-d1);

            data.push({ 
                spot: spot, 
                call: Math.max(0, call), 
                put: Math.max(0, put),
                callIntrinsic: Math.max(0, spot - K),
                putIntrinsic: Math.max(0, K - spot),
            });
        }
        return data;
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
                <h2 className="text-2xl font-bold text-primary">Black-Scholes Option Pricing Model</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    The Black-Scholes model provides a theoretical estimate of the price of European-style options. It's a cornerstone of modern financial theory, based on the idea that one can perfectly hedge an option by buying and selling the underlying asset. The model assumes the asset price follows a geometric Brownian motion with constant drift and volatility.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    While its assumptions (like constant volatility) are known to be imperfect, Black-Scholes is the bedrock of options trading. Hedge funds and market makers use it as a baseline for pricing and to identify potential mispricings. The model's "Greeks" (Delta, Gamma, Vega, etc.) are indispensable for hedging and managing the risk of options portfolios. Performance doesn't come from blindly following the model's price, but from using it to understand relative value and manage risk exposure. The key is in accurately forecasting future volatility, which is the model's most sensitive and subjective input.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="flex flex-col space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Model Parameters</h3>
                        
                        <div className="flex items-center space-x-2">
                            <Slider label="Spot Price (S)" value={S} min={50} max={200} step={1} onChange={setS} unit="$"/>
                            <InfoTooltip text="The current market price of the underlying asset (e.g., a stock)." />
                        </div>
                        <div className="flex items-center space-x-2">
                             <Slider label="Strike Price (K)" value={K} min={50} max={200} step={1} onChange={setK} unit="$"/>
                             <InfoTooltip text="The price at which the option holder can buy (call) or sell (put) the asset." />
                        </div>
                         <div className="flex items-center space-x-2">
                            <Slider label="Time to Maturity (T)" value={T} min={0.1} max={2} step={0.1} onChange={setT} unit=" years"/>
                            <InfoTooltip text="The time remaining until the option expires, in years. A longer horizon increases an option's value due to greater uncertainty." />
                        </div>
                         <div className="flex items-center space-x-2">
                            <Slider label="Risk-Free Rate (r)" value={r} min={0} max={10} step={0.1} onChange={setR} unit="%"/>
                            <InfoTooltip text="The theoretical rate of return of a zero-risk investment (e.g., a government bond)." />
                        </div>
                         <div className="flex items-center space-x-2">
                            <Slider label="Volatility (σ)" value={sigma} min={5} max={80} step={1} onChange={setSigma} unit="%"/>
                            <InfoTooltip text="The annualized standard deviation of the asset's returns. Higher volatility increases the likelihood of extreme price moves, thus increasing option value." />
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-primary mb-3">Calculated Prices</h3>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-xs text-secondary uppercase tracking-wider">Call Option</p>
                                <p className="text-2xl font-semibold text-accent font-mono">${callPrice.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-secondary uppercase tracking-wider">Put Option</p>
                                <p className="text-2xl font-semibold text-accent font-mono">${putPrice.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Option Value vs. Spot Price</h3>
                         <p className="text-sm text-secondary mb-4">
                            This chart shows how an option's value (solid lines) is composed of its intrinsic value (dashed lines) and its time value (the difference between the two). The vertical line indicates the strike price.
                         </p>
                         <div className="h-96 w-full">
                             <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="spot" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(tick) => `$${tick.toFixed(0)}`}>
                                        <Label value="Spot Price ($)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={[0, 'dataMax']}>
                                        <Label value="Option Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle}/>
                                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}}/>
                                    <ReferenceLine x={K} stroke="#EAE0C8" strokeDasharray="3 3">
                                        <Label value="Strike" position="insideTopRight" fill="#EAE0C8" fontSize={12}/>
                                    </ReferenceLine>
                                    <Line type="monotone" dataKey="call" stroke="#D4AF37" strokeWidth={2} name="Call Value" dot={false}/>
                                    <Line type="monotone" dataKey="put" stroke="#AFAF9B" strokeWidth={2} name="Put Value" dot={false}/>
                                    <Line type="monotone" dataKey="callIntrinsic" stroke="#D4AF37" strokeWidth={1.5} name="Call Intrinsic" dot={false} strokeDasharray="5 5"/>
                                    <Line type="monotone" dataKey="putIntrinsic" stroke="#AFAF9B" strokeWidth={1.5} name="Put Intrinsic" dot={false} strokeDasharray="5 5"/>
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BlackScholesModel;