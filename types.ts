import type React from 'react';

export interface Model {
  id: string;
  name: string;
  component: React.FC;
}

// FIX: Renamed SP500DataPoint to StockDataPoint for consistency and added missing types for portfolio simulation.
export interface StockDataPoint {
  date: string;
  price: number;
}

export interface PortfolioAsset {
  ticker: string;
  weight: number;
}

export interface StockData {
  [key: string]: StockDataPoint[];
}
