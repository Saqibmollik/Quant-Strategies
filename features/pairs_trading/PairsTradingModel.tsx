import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { InfoTooltip } from '../../components/InfoTooltip';
// FIX: Added missing LineChart import from recharts
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Legend, ReferenceLine, Dot, LineChart } from 'recharts';
import { STOCK_DATA } from '../../data/stock_data';

const PairsTradingModel: React.FC = () => {
    const [lookback, setLookback] = useState(30);
    const [entryZ, setEntryZ] = useState(2.0);
    const [exitZ, setExitZ] = useState(0.5);

    const { priceData, spreadData, signals } = useMemo(() => {
        const data1 = STOCK_DATA['KO'];
        const data2 = STOCK_DATA['PEP'];
        
        const mergedData: any[] = [];
        data1.forEach(p1 => {
            const p2 = data2.find(p => p.date === p1.date);
            if (p2) {
                mergedData.push({ date: p1.date, price1: p1.price, price2: p2.price });
            }
        });

        const normalizedPriceData = mergedData.map(d => ({
            ...d,
            ko: d.price1 / mergedData[0].price1 * 100,
            pep: d.price2 / mergedData[0].price2 * 100,
        }));
        
        const spreadAnalysisData = [];
        const tradeSignals = [];
        let inTrade = 0; // 0: no trade, 1: short spread, -1: long spread

        for (let i = 0; i < mergedData.length; i++) {
            const ratio = mergedData[i].price1 / mergedData[i].price2;
            let movingAvg = null;
            let movingStd = null;
            let zScore = null;
            
            if (i >= lookback -1) {
                const window = mergedData.slice(i - lookback + 1, i + 1).map(d => d.price1 / d.price2);
                const sum = window.reduce((a,b) => a + b, 0);
                movingAvg = sum / lookback;
                const variance = window.reduce((acc, val) => acc + (val - movingAvg)**2, 0) / lookback;
                movingStd = Math.sqrt(variance);
                zScore = (ratio - movingAvg) / movingStd;

                // Signal Logic
                if (inTrade === 0) {
                    if (zScore > entryZ) {
                        tradeSignals.push({ date: mergedData[i].date, type: 'SHORT', z: zScore, ratio });
                        inTrade = 1;
                    } else if (zScore < -entryZ) {
                         tradeSignals.push({ date: mergedData[i].date, type: 'LONG', z: zScore, ratio });
                         inTrade = -1;
                    }
                } else if (inTrade === 1) { // Currently short spread
                    if (zScore < exitZ) {
                         tradeSignals.push({ date: mergedData[i].date, type: 'EXIT', z: zScore, ratio });
                         inTrade = 0;
                    }
                } else if (inTrade === -1) { // Currently long spread
                    if (zScore > -exitZ) {
                         tradeSignals.push({ date: mergedData[i].date, type: 'EXIT', z: zScore, ratio });
                         inTrade = 0;
                    }
                }
            }

            spreadAnalysisData.push({
                date: mergedData[i].date,
                ratio: ratio,
                ma: movingAvg,
                upperBand: movingAvg && movingStd ? movingAvg + entryZ * movingStd : null,
                lowerBand: movingAvg && movingStd ? movingAvg - entryZ * movingStd : null,
                zScore: zScore,
            });
        }
        
        return { priceData: normalizedPriceData, spreadData: spreadAnalysisData, signals: tradeSignals };

    }, [lookback, entryZ, exitZ]);
    
    const tooltipStyle = useMemo(() => ({
        backgroundColor: '#2A2A2A',
        border: '1px solid #AFAF9B'
    }), []);

    // Custom dot for signals
    const SignalDot = useCallback((props: any) => {
        const { cx, cy, payload } = props;
        const signal = signals.find(s => s.date === payload.date);
        if (!signal) return null;
        
        let fill = '#AFAF9B';
        if (signal.type === 'SHORT') fill = '#E42222'; // Sell signal
        if (signal.type === 'LONG') fill = '#22E422'; // Buy signal
        if (signal.type === 'EXIT') fill = '#3399FF'; // Exit signal

        return <Dot cx={cx} cy={cy} r={5} fill={fill} stroke="#2A2A2A" strokeWidth={1} />;
    }, [signals]);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-primary">Pairs Trading Strategy</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Pairs trading is a market-neutral strategy that involves identifying two highly correlated assets whose prices have temporarily diverged. The strategy bets on the prices "reverting to the mean" by shorting the outperforming asset and buying the underperforming one. This example uses Coca-Cola (KO) and Pepsi (PEP).
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    This is a classic statistical arbitrage strategy employed by quantitative hedge funds. The key is finding a robustly co-integrated pair of assets. The model's performance depends heavily on the stability of the pair's relationship; if the fundamental relationship breaks down ("structural break"), the strategy can incur large losses. Quants use statistical tests (like the Engle-Granger test) to validate pairs and often trade baskets of pairs to diversify this idiosyncratic risk. The return is generated from many small, high-probability wins as the spread oscillates around its mean.
                </p>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-secondary/20 pb-2">Strategy Parameters</h3>
                    <div className="flex items-center space-x-2">
                        <Slider label="Lookback Window" value={lookback} min={10} max={60} step={5} onChange={setLookback} unit=" days"/>
                        <InfoTooltip text="The period used to calculate the moving average and standard deviation of the price ratio."/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Slider label="Entry Z-Score" value={entryZ} min={1.0} max={3.0} step={0.1} onChange={setEntryZ}/>
                        <InfoTooltip text="The number of standard deviations from the mean the price ratio must be to trigger a trade."/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Slider label="Exit Z-Score" value={exitZ} min={0} max={1.5} step={0.1} onChange={setExitZ}/>
                        <InfoTooltip text="The trade is exited when the z-score crosses back over this threshold towards the mean."/>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-primary">Normalized Price Series (KO vs PEP)</h3>
                        <p className="text-sm text-secondary mb-4">Shows the relative performance of the two stocks. A divergence in these lines creates a trading opportunity.</p>
                        <div className="h-48 w-full">
                            <ResponsiveContainer>
                                <LineChart data={priceData} syncId="pairsSync" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="date" tick={{ fill: '#AFAF9B', fontSize: 12 }} hide/>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']}/>
                                    <Tooltip contentStyle={tooltipStyle}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="ko" stroke="#D4AF37" name="KO" dot={false}/>
                                    <Line type="monotone" dataKey="pep" stroke="#AFAF9B" name="PEP" dot={false}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-primary">Price Ratio (KO/PEP) & Trading Bands</h3>
                        <p className="text-sm text-secondary mb-4">The solid line is the price ratio. The shaded area represents the entry/exit bands. A trade is initiated when the ratio crosses outside the bands.</p>
                        <div className="h-64 w-full">
                            <ResponsiveContainer>
                                <ComposedChart data={spreadData} syncId="pairsSync" margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                    <XAxis dataKey="date" tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(d) => d.substring(5)}>
                                        <Label value="Date" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                                    </XAxis>
                                    <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin - 0.01', 'dataMax + 0.01']} tickFormatter={(r) => r.toFixed(2)}/>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v:any) => typeof v === 'number' ? v.toFixed(3) : v}/>
                                    <Area dataKey={(d) => d.upperBand && d.lowerBand ? [d.lowerBand, d.upperBand] : null} fill="#D4AF37" stroke="#D4AF37" fillOpacity={0.1} strokeOpacity={0.4} name="Trading Bands" />
                                    <Line dataKey="ma" stroke="#AFAF9B" strokeWidth={2} name="Moving Avg" dot={false} strokeDasharray="3 3" />
                                    <Line dataKey="ratio" stroke="#D4AF37" strokeWidth={2} name="KO/PEP Ratio" activeDot={SignalDot} dot={SignalDot} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PairsTradingModel;