import React, { useState, useMemo } from 'react';
import { Card } from '../../components/Card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

const generateGrid = (type: 'uniform' | 'adaptive', K: number) => {
    const points = [];
    if (type === 'uniform') {
        const density = 0.1;
        for (let x = 0; x <= 1; x += density) {
            for (let y = 0; y <= 2 * K; y += 2 * K * density) {
                points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
            }
        }
    } else {
        // Coarse grid for the general area
        for (let x = 0.2; x <= 1; x += 0.2) {
            for (let y = 0; y <= 2 * K; y += K/2.5) {
                 if(y < K * 0.8 || y > K*1.2)
                    points.push({ x, y });
            }
        }
        // Refined grid near the strike price K, a region of high interest (high gamma)
        for (let x = 0; x <= 1; x += 0.05) {
            for (let y = K * 0.8; y <= K * 1.2; y += K/20) {
                if (Math.random() > 0.3) points.push({ x, y });
            }
        }
        // Refined grid near expiration (time = 0), where gamma is also high
         for (let x = 0; x <= 0.2; x += 0.05) {
            for (let y = 0; y <= 2 * K; y += K/10) {
                 if (Math.random() > 0.3) points.push({ x, y });
            }
        }
    }
    return points;
}

const AdaptivePdeModel: React.FC = () => {
    const [gridType, setGridType] = useState<'uniform' | 'adaptive'>('adaptive');
    
    const gridData = useMemo(() => generateGrid(gridType, 100), [gridType]);

    const tooltipStyle = useMemo(() => ({
        backgroundColor: '#2A2A2A',
        border: '1px solid #AFAF9B'
    }), []);

    const tooltipCursorStyle = useMemo(() => ({
        strokeDasharray: '3 3'
    }), []);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-primary">Adaptive PDE Solvers for Option Pricing</h2>
                <p className="mt-1 text-sm text-secondary max-w-4xl">
                    Option pricing problems can be formulated as PDEs. Numerical solvers discretize the problem space into a grid. Adaptive solvers increase efficiency by concentrating grid points where needed most—in regions of high curvature (high gamma), like near the strike price and expiration.
                </p>
            </header>
            
             <Card>
                <h3 className="text-lg font-semibold text-primary">Practical Applications & Performance Insights</h3>
                <p className="mt-2 text-sm text-secondary">
                   In a high-frequency trading or large-scale risk management context, speed is paramount. Adaptive methods provide a massive computational advantage over uniform grids, allowing firms to price complex derivatives or re-evaluate the risk of enormous portfolios in near real-time. This isn't a model that generates alpha directly, but an enabling technology. The "performance" is a dramatic reduction in computational cost (hardware and time) for the same level of accuracy, which is a significant competitive edge for any quantitative finance operation.
                </p>
            </Card>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Grid Discretization Visualization</h3>
                         <p className="text-sm text-secondary mt-1">Compare a standard Uniform Grid with an efficient Adaptive Grid (Strike K = $100).</p>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2 p-1 bg-background rounded-lg self-start sm:self-center">
                        <button onClick={() => setGridType('uniform')} className={`px-4 py-1 rounded-md text-sm transition ${gridType === 'uniform' ? 'bg-accent text-background font-semibold' : 'text-primary'}`}>Uniform Grid</button>
                        <button onClick={() => setGridType('adaptive')} className={`px-4 py-1 rounded-md text-sm transition ${gridType === 'adaptive' ? 'bg-accent text-background font-semibold' : 'text-primary'}`}>Adaptive Grid</button>
                    </div>
                </div>
                 <div className="h-[32rem] w-full relative">
                    {gridType === 'adaptive' && (
                        <>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-accent font-semibold text-sm">High Density Near Strike</p>
                            <p className="text-xs text-secondary">(High Gamma)</p>
                        </div>
                         <div className="absolute top-1/2 left-[15%] -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-accent font-semibold text-sm">High Density Near Expiry</p>
                            <p className="text-xs text-secondary">(High Gamma)</p>
                        </div>
                        </>
                    )}
                    <ResponsiveContainer>
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                            <XAxis type="number" dataKey="x" name="Time to Maturity" unit=" years" domain={[0,1]} tick={{ fill: '#AFAF9B', fontSize: 12 }}>
                                <Label value="Time to Maturity (Years)" offset={-20} position="insideBottom" fill="#AFAF9B" fontSize={12} />
                            </XAxis>
                            <YAxis type="number" dataKey="y" name="Asset Price" unit="$" domain={[0, 200]} tick={{ fill: '#AFAF9B', fontSize: 12 }} width={80}>
                                <Label value="Asset Price ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#AFAF9B" offset={-15} fontSize={12}/>
                            </YAxis>
                            <Tooltip cursor={tooltipCursorStyle} contentStyle={tooltipStyle}/>
                            <Scatter name="Grid Points" data={gridData} fill="#D4AF37" shape="circle" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};

export default AdaptivePdeModel;