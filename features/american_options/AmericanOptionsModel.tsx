import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from 'recharts';

// Using a simplified but standard approximation for the early exercise boundary for visualization
const generateBoundary = (K: number, T: number, r: number, sigma: number) => {
    const data = [];
    const steps = 50;
    const r_div = r; // r is already in decimal
    const sigma_sq = sigma * sigma;

    for (let i = 0; i <= steps; i++) {
        const t_to_expiry = (i / steps) * T; // Time to maturity
        if (t_to_expiry === 0) {
            data.push({ time: T, boundary: [K, K*1.5], point: K });
            continue;
        }

        // Barone-Adesi and Whaley quadratic approximation for critical stock price (for a Put)
        const M = 2 * r_div / sigma_sq;
        const N = 2 * r_div / sigma_sq;
        const K_val = 1 - Math.exp(-r_div * t_to_expiry);
        const q2 = (- (N - 1) + Math.sqrt((N - 1)**2 + (4 * M / K_val))) / 2;
        const S_crit = K * (q2 -1) / q2;
        
        data.push({
            time: T - t_to_expiry, // Display as time from now
            boundary: [0, S_crit], // Upper bound for area chart
            point: S_crit,
        });
    }
    return data.sort((a,b) => a.time - b.time);
};

const AmericanOptionsModel: React.FC = () => {
    const [K, setK] = useState(100);
    const [T, setT] = useState(1);
    const [r, setR] = useState(5);
    const [sigma, setSigma] = useState(30);

    const boundaryData = useMemo(() => {
        return generateBoundary(K, T, r/100, sigma/100);
    }, [K, T, r, sigma]);

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
                <h2 className="text-2xl font-bold text-primary">Free Boundary PDE for American Options</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    American options can be exercised at any time, creating a "free boundary" problem: determining the optimal asset price at which to exercise. This boundary divides the price-time space into a "continuation region" (hold) and a "stopping region" (exercise). This visualization shows the early exercise boundary for an American put option.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    Correctly valuing the early exercise premium is critical, especially for options on dividend-paying stocks (for calls) and in high-interest-rate environments (for puts). Mispricing this feature can lead to significant losses for an options seller or missed opportunities for a buyer. Hedge funds use numerical PDE or tree-based methods to solve this problem accurately. A strategy might involve selling overpriced American options (where implied early exercise premium is too high) against a dynamically hedged position in the underlying asset. The "return" is generated from the decay of this overpriced premium over time.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Put Option Parameters</h3>
                    
                    <Slider label="Strike Price (K)" value={K} min={80} max={120} step={1} onChange={setK} unit="$"/>
                    <Slider label="Time to Maturity (T)" value={T} min={0.25} max={2} step={0.05} onChange={setT} unit=" years"/>
                    <div className="flex items-center space-x-2">
                        <Slider label="Risk-Free Rate (r)" value={r} min={1} max={10} step={0.1} onChange={setR} unit="%"/>
                        <InfoTooltip text="Higher interest rates make exercising a put early (receiving cash K) more attractive, thus raising the boundary."/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Slider label="Volatility (σ)" value={sigma} min={10} max={50} step={1} onChange={setSigma} unit="%"/>
                        <InfoTooltip text="Higher volatility increases the chance the stock price will recover, making it better to hold the option. This lowers the boundary."/>
                    </div>
                </Card>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Early Exercise Boundary for American Put</h3>
                         <p className="text-sm text-secondary mb-4">The shaded area is the "exercise region." If the asset price falls into this region, it is optimal to exercise the put immediately. Above the boundary is the "hold region." The boundary converges to the strike price (dashed line) at expiration.</p>
                         <div className="h-96 w-full">
                             <ResponsiveContainer>
                                <AreaChart data={boundaryData} margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="time" type="number" domain={[0, T]} tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(t) => t.toFixed(2)}>
                                        <Label value="Time (Years from Now)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={[K - 40, K + 5]} tickFormatter={(p) => `$${p.toFixed(0)}`}>
                                        <Label value="Asset Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} labelFormatter={(l) => `Time: ${l.toFixed(2)}y`} formatter={(value, name, props) => [`$${props.payload.point.toFixed(2)}`, "Boundary Price"]}/>
                                    <ReferenceLine y={K} stroke="#EAE0C8" strokeDasharray="3 3" >
                                        <Label value="Strike" position="right" fill="#EAE0C8" fontSize={12}/>
                                    </ReferenceLine>
                                    <Area type="monotone" dataKey="boundary" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} name="Exercise Region" />
                                    <text x="50%" y="85%" textAnchor="middle" fill="#D4AF37" fontSize="12" className="pointer-events-none">
                                        Optimal Exercise Region
                                    </text>
                                     <text x="50%" y="35%" textAnchor="middle" fill="#AFAF9B" fontSize="12" className="pointer-events-none">
                                        Optimal Hold Region
                                    </text>
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AmericanOptionsModel;