import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine, ReferenceArea } from 'recharts';
import { SP500_DATA } from '../../data/sp500';

// Helper for Normal Cumulative Distribution Function (CDF) inverse
const normalInverseCDF = (p: number): number => {
    // Abramowitz and Stegun approximation
    const a1 = -39.69683028665376, a2 = 220.9460984245205, a3 = -275.9285104469687,
          a4 = 138.3577518672690, a5 = -30.66479806614716, a6 = 2.506628277459239;
    const b1 = -54.47609879822406, b2 = 161.5858368580409, b3 = -155.6989798598866,
          b4 = 66.80131188771972, b5 = -13.28068155288572;
    const c1 = -7.784894002430293e-3, c2 = -0.3223964580411365, c3 = -2.400758277161838,
          c4 = -2.549732539343734, c5 = 4.374664141464968,  c6 = 2.938163982698783;
    const d1 = 7.784695709041462e-3, d2 = 0.3224671290700398, d3 = 2.445134137142996,
          d4 = 3.754408661907416;
    const p_low = 0.02425, p_high = 1 - p_low;
    
    if (p < p_low) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
               ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= p_high) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
               (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
};

const VaRCVaRModel: React.FC = () => {
    const [confidence, setConfidence] = useState(95);
    const [horizon, setHorizon] = useState(10); // in days
    const [method, setMethod] = useState<'historical' | 'parametric'>('historical');

    const { returns, histVaR, histCVaR, paraVaR, paraCVaR, histData } = useMemo(() => {
        const dailyReturns = [];
        for (let i = 1; i < SP500_DATA.length; i++) {
            dailyReturns.push(Math.log(SP500_DATA[i].price / SP500_DATA[i-1].price));
        }
        dailyReturns.sort((a, b) => a - b);

        const alpha = 1 - confidence / 100;
        
        // Historical Method
        const varIndex = Math.floor(alpha * dailyReturns.length);
        const historicalVaR = -dailyReturns[varIndex] * Math.sqrt(horizon);
        const losses = dailyReturns.slice(0, varIndex);
        const historicalCVaR = losses.length > 0 ? -losses.reduce((a, b) => a + b, 0) / losses.length * Math.sqrt(horizon) : 0;

        // Parametric Method
        const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((acc, val) => acc + (val - mean)**2, 0) / (dailyReturns.length - 1);
        const stdDev = Math.sqrt(variance);
        const parametricVaR = -(mean + stdDev * normalInverseCDF(alpha)) * Math.sqrt(horizon);
        const parametricCVaR = alpha**-1 * stdDev * (1/(Math.sqrt(2*Math.PI))) * Math.exp(-(normalInverseCDF(alpha)**2)/2) * Math.sqrt(horizon);

        // Histogram Data
        const minReturn = Math.min(...dailyReturns);
        const maxReturn = Math.max(...dailyReturns);
        const numBins = 20;
        const binWidth = (maxReturn - minReturn) / numBins;
        const bins = Array(numBins).fill(0).map((_, i) => ({
            range: minReturn + i * binWidth,
            count: 0
        }));
        dailyReturns.forEach(r => {
            const binIndex = Math.min(numBins - 1, Math.floor((r - minReturn) / binWidth));
            bins[binIndex].count++;
        });
        
        return { 
            returns: dailyReturns, 
            histVaR: historicalVaR, 
            histCVaR: historicalCVaR, 
            paraVaR: parametricVaR, 
            paraCVaR: parametricCVaR,
            histData: bins
        };
    }, [confidence, horizon]);
    
    const varValue = method === 'historical' ? histVaR : paraVaR;
    const cvarValue = method === 'historical' ? histCVaR : paraCVaR;
    
    const cvarRegionLabel = useMemo(() => ({
        value: "CVaR Region",
        position: 'insideBottomLeft' as const,
        fill: '#E42222',
        fontSize: 12
    }), []);

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
                <h2 className="text-2xl font-bold text-primary">Value at Risk (VaR) & Conditional VaR (CVaR)</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    VaR is a statistical measure of the risk of loss for an investment. It estimates the maximum loss that can be expected over a given time period at a certain confidence level. CVaR (or Expected Shortfall) goes further by quantifying the average loss that would be incurred if the VaR threshold is breached.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    VaR is a regulatory requirement for most financial institutions to determine capital adequacy. Risk managers use it for daily risk reporting, setting trading limits, and performance attribution. While VaR is simple to understand, CVaR is considered a superior risk measure as it better captures "tail risk." A hedge fund might use a CVaR constraint in their portfolio optimization to build a more robust portfolio that performs better during market crashes. The performance of a risk model is not about generating returns, but about accurately forecasting potential losses to prevent catastrophic drawdowns.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="flex flex-col space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Risk Parameters</h3>
                        <div className="flex items-center space-x-2">
                            <Slider label="Confidence Level" value={confidence} min={90} max={99.5} step={0.5} onChange={setConfidence} unit="%"/>
                            <InfoTooltip text="The probability that the portfolio loss will not exceed the VaR value."/>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Slider label="Time Horizon" value={horizon} min={1} max={30} step={1} onChange={setHorizon} unit=" days"/>
                            <InfoTooltip text="The timeframe over which the risk is being measured."/>
                        </div>
                        <div className="pt-2">
                             <label className="text-sm font-medium text-primary/80 mb-2 block">Calculation Method</label>
                             <div className="flex space-x-2 p-1 bg-background rounded-lg">
                                <button onClick={() => setMethod('historical')} className={`flex-1 px-3 py-1 rounded-md text-sm transition ${method === 'historical' ? 'bg-accent text-background font-semibold' : 'text-primary'}`}>Historical</button>
                                <button onClick={() => setMethod('parametric')} className={`flex-1 px-3 py-1 rounded-md text-sm transition ${method === 'parametric' ? 'bg-accent text-background font-semibold' : 'text-primary'}`}>Parametric</button>
                            </div>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold text-primary mb-3">Calculated Risk Measures</h3>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-xs text-secondary uppercase tracking-wider">VaR</p>
                                <p className="text-2xl font-semibold text-accent font-mono">{(varValue * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-secondary uppercase tracking-wider">CVaR</p>
                                <p className="text-2xl font-semibold text-accent font-mono">{(cvarValue * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                        <p className="text-xs text-secondary text-center mt-2">Max loss on a $1M portfolio: VaR=${(varValue * 1_000_000).toLocaleString()}, CVaR=${(cvarValue * 1_000_000).toLocaleString()}</p>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-primary">S&P 500 Daily Return Distribution</h3>
                         <p className="text-sm text-secondary mb-4">
                            This histogram shows the frequency of historical daily returns. The lines mark the {confidence}% VaR and CVaR, representing the threshold for extreme losses. The shaded area indicates the "tail" used to calculate CVaR.
                         </p>
                         <div className="h-96 w-full">
                             <ResponsiveContainer>
                                <BarChart data={histData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="range" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(tick) => `${(tick * 100).toFixed(1)}%`}>
                                        <Label value="Daily Return" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={[0, 'dataMax']}>
                                        <Label value="Frequency" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                                    </YAxis>
                                    <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value, name, props) => [value, `Return > ${(props.payload.range * 100).toFixed(1)}%`]}/>
                                    <Bar dataKey="count" fill="#D4AF37" fillOpacity={0.6} />
                                    <ReferenceLine x={-varValue / Math.sqrt(horizon)} stroke="#FF7300" strokeWidth={2}>
                                        <Label value={`VaR: ${(-varValue * 100 / Math.sqrt(horizon)).toFixed(2)}%`} position="insideTopLeft" fill="#FF7300" fontSize={12}/>
                                    </ReferenceLine>
                                     <ReferenceLine x={-cvarValue / Math.sqrt(horizon)} stroke="#E42222" strokeDasharray="3 3" strokeWidth={2}>
                                        <Label value={`CVaR: ${(-cvarValue * 100 / Math.sqrt(horizon)).toFixed(2)}%`} position="insideTopLeft" fill="#E42222" fontSize={12} offset={15}/>
                                    </ReferenceLine>
                                    <ReferenceArea x1={Math.min(...returns)} x2={-varValue / Math.sqrt(horizon)} fill="#E42222" fillOpacity={0.2} label={cvarRegionLabel} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VaRCVaRModel;