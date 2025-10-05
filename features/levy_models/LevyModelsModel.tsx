import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Legend } from 'recharts';

// Gamma function approximation (Lanczos) for Student's t-distribution
const gamma = (z: number): number => {
    const g = 7;
    const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = p[0];
    for (var i = 1; i < g + 2; i++) {
        x += p[i] / (z + i);
    }
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

const normalPDF = (x: number, mu: number, sigma: number) => {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
};

const studentsTPDF = (x: number, nu: number) => {
    return (gamma((nu + 1) / 2) / (Math.sqrt(nu * Math.PI) * gamma(nu / 2))) * (1 + (x * x) / nu) ** (- (nu + 1) / 2);
};

const LevyModelsModel: React.FC = () => {
    const [dof, setDof] = useState(3); // Degrees of freedom for t-distribution

    const {distData, kurtosis} = useMemo(() => {
        const data = [];
        for (let x = -5; x <= 5; x += 0.1) {
            data.push({
                x: x.toFixed(1),
                gaussian: normalPDF(x, 0, 1),
                levy: studentsTPDF(x, dof)
            });
        }
        
        let kurt = Infinity;
        if (dof > 4) {
            kurt = 3 + (6 / (dof - 4));
        }

        return {distData: data, kurtosis: {normal: 3, t: kurt}};
    }, [dof]);

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
                <h2 className="text-2xl font-bold text-primary">Fractional PDEs under Lévy Models</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Standard models assume asset returns follow a normal (Gaussian) distribution. However, real-world returns exhibit "fat tails" (leptokurtosis). Lévy models use distributions with heavier tails to better capture the risk of extreme events. This visualization compares a normal distribution to a heavy-tailed Student's t-distribution.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    Lévy models are crucial for tail-risk hedging and pricing derivatives where the payoff is dominated by extreme events. For example, a "black swan" fund might use these models to buy deep out-of-the-money options that appear cheap under a normal distribution but are more fairly priced under a fat-tailed one. The performance of such a strategy is typically characterized by long periods of small losses (paying the option premium) followed by occasional, massive gains during a market crash. These models force a more realistic assessment of worst-case scenarios in risk management.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Distribution Parameters</h3>
                         <div className="flex items-center space-x-2 mt-4">
                            <Slider label="Degrees of Freedom (ν)" value={dof} min={1} max={30} step={1} onChange={setDof}/>
                            <InfoTooltip text="For the t-distribution, degrees of freedom (ν) controls tail 'fatness'. Lower values mean fatter tails. As ν approaches infinity, it converges to the normal distribution."/>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Kurtosis (Measure of Fat Tails)</h3>
                         <div className="mt-4 space-y-3">
                             <div className="flex justify-between items-center">
                                 <span className="text-secondary text-sm">Normal Distribution:</span>
                                 <span className="font-semibold text-primary font-mono text-lg">{kurtosis.normal.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-secondary text-sm">Student's t-dist (ν={dof}):</span>
                                 <span className="font-semibold text-accent font-mono text-lg">{dof <= 4 ? "Undefined" : kurtosis.t.toFixed(2)}</span>
                             </div>
                         </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">Distribution Comparison</h3>
                         <p className="text-sm text-secondary mb-4">The chart plots the probability density functions (PDFs). Observe how the gold line (Student's t) has higher peaks and fatter tails compared to the normal distribution, indicating a higher probability of extreme outcomes.</p>
                         <div className="h-96 w-full">
                            <ResponsiveContainer>
                                <LineChart data={distData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="x" tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                        <Label value="Standard Deviations from Mean" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12}/>
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                         <Label value="Probability Density" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(v: number) => v.toFixed(4)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="levy" stroke="#D4AF37" strokeWidth={2} name={`Heavy-Tailed (t, ν=${dof})`} dot={false}/>
                                    <Line type="monotone" dataKey="gaussian" stroke="#AFAF9B" strokeWidth={2} name="Normal (Gaussian)" dot={false} strokeDasharray="5 5"/>
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LevyModelsModel;