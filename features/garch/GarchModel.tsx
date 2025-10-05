import React, { useMemo } from 'react';
import { Card } from '../../components/Card';
import { SP500_DATA } from '../../data/sp500';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ComposedChart, Line } from 'recharts';

const GarchModel: React.FC = () => {
    
    const { priceChartData, volChartData } = useMemo(() => {
        const returns = [];
        for (let i = 1; i < SP500_DATA.length; i++) {
            returns.push(Math.log(SP500_DATA[i].price / SP500_DATA[i-1].price));
        }
        
        // Use fixed, realistic GARCH(1,1) parameters for demonstration
        const omega = 0.000001; // Long-run variance component
        const alpha = 0.1;      // Reaction to past shocks
        const beta = 0.88;       // Persistence of volatility
        
        let lastVariance = returns.reduce((acc, val) => acc + val*val, 0) / returns.length;
        
        const forecastDays = 60;
        const lastPrice = SP500_DATA[SP500_DATA.length - 1].price;
        const lastDate = new Date(SP500_DATA[SP500_DATA.length - 1].date);
        
        const priceForecast = [];
        const volForecast = [];
        
        for (let i = 1; i <= forecastDays; i++) {
            // GARCH(1,1) variance update equation
            lastVariance = omega + alpha * (returns[returns.length - 1] ** 2) + beta * lastVariance;
            const dailyVol = Math.sqrt(lastVariance);
            const annualizedVol = dailyVol * Math.sqrt(252); 
            
            const futureDate = new Date(lastDate);
            futureDate.setDate(lastDate.getDate() + i);
            const dateStr = futureDate.toISOString().split('T')[0];
            
            const centerPrice = lastPrice; 
            const coneWidth = centerPrice * annualizedVol * Math.sqrt(i/252);
            
            priceForecast.push({
                date: dateStr,
                price: null, 
                historicalPrice: null,
                range: [centerPrice - coneWidth, centerPrice + coneWidth]
            });

            volForecast.push({
                date: dateStr,
                volatility: annualizedVol * 100 // convert to percentage
            });
        }
        
        const historical = SP500_DATA.map(d => ({...d, historicalPrice: d.price, price: d.price, range: null}));
        
        return {priceChartData: [...historical, ...priceForecast], volChartData: volForecast};
    }, []);

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
                <h2 className="text-2xl font-bold text-primary">GARCH Model for Volatility Forecasting</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    GARCH is a key model for financial time series analysis, used to forecast asset volatility. It captures "volatility clustering"—the observation that periods of high volatility are followed by more high volatility, and vice-versa. This simulation uses historical S&P 500 data to forecast future volatility.
                </p>
            </header>
            
            <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                    GARCH models are the foundation of volatility trading strategies. Funds can trade VIX futures or variance swaps based on whether their GARCH forecast predicts higher or lower volatility than the market implies. It is also essential for risk management; a dynamic GARCH-based VaR model is far more accurate than a static one. Performance in trading relies on having a superior GARCH specification (e.g., EGARCH, GJR-GARCH) that captures features like the leverage effect (volatility rising more after negative returns) and accurately forecasting the term structure of volatility.
                </p>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-primary">S&P 500 Price and Forecasted Volatility Cone</h3>
                 <p className="text-sm text-secondary mb-4">The top chart shows historical S&P 500 prices and a 60-day volatility cone. The cone's width represents the expected range of price movements (one standard deviation). The bottom chart shows the explicit GARCH forecast for annualized volatility.</p>
                <div className="h-72 w-full">
                    <ResponsiveContainer>
                        <ComposedChart data={priceChartData} syncId="garchSync" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                            <XAxis dataKey="date" tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(d) => d.substring(5)} hide={true} />
                            <YAxis yAxisId="left" tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={['dataMin - 200', 'dataMax + 200']} tickFormatter={p => `$${p.toFixed(0)}`}>
                                 <Label value="S&P 500 Price" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                            </YAxis>
                            <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: any, name) => {
                                if(name === 'Historical Price') return [`$${(value as number).toFixed(2)}`, name];
                                if(name === 'Volatility Range' && Array.isArray(value)) return [`$${value[0].toFixed(2)} - $${value[1].toFixed(2)}`, name];
                                return null;
                            }}/>
                            <Area yAxisId="left" dataKey="range" fill="#D4AF37" stroke="#D4AF37" fillOpacity={0.2} strokeOpacity={0.5} name="Volatility Range"/>
                            <Line yAxisId="left" dataKey="historicalPrice" stroke="#EAE0C8" strokeWidth={2} name="Historical Price" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                 <div className="h-48 w-full">
                    <ResponsiveContainer>
                        <ComposedChart data={volChartData} syncId="garchSync" margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                             <XAxis dataKey="date" tick={{ fill: '#AFAF9B', fontSize: 12 }} tickFormatter={(d) => d.substring(5)}>
                                 <Label value="Date" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12}/>
                             </XAxis>
                            <YAxis tick={{ fill: '#AFAF9B', fontSize: 12 }} domain={[0, 'dataMax + 5']} tickFormatter={v => `${v.toFixed(0)}%`}>
                                 <Label value="Forecast Vol. (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={0} fontSize={12}/>
                            </YAxis>
                             <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursorStyle} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Annualized Volatility']}/>
                            <Line dataKey="volatility" stroke="#D4AF37" strokeWidth={2} name="Forecast Volatility" dot={false}/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};

export default GarchModel;