import React from 'react';
import type { Model } from '../types';

interface SidebarProps {
  models: Model[];
  activeModelId: string;
  onSelectModel: (model: Model) => void;
}

const ChartIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-3">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
    </svg>
);


export const Sidebar: React.FC<SidebarProps> = ({ models, activeModelId, onSelectModel }) => {
  return (
    <aside className="w-80 bg-surface border-r border-secondary/20 flex-shrink-0">
      <div className="p-6 sticky top-0">
        <h1 className="text-2xl font-bold text-primary mb-1">
          Mollik Nguyen
        </h1>
        <h2 className="text-sm font-medium text-accent mb-8">
          Quantitative Finance Showcase
        </h2>
        <nav>
          <ul>
            {models.map((model) => (
              <li key={model.id}>
                <button
                  onClick={() => onSelectModel(model)}
                  className={`w-full text-left flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                    activeModelId === model.id
                      ? 'bg-accent/20 text-accent font-semibold'
                      : 'text-primary hover:bg-primary/5'
                  }`}
                >
                  <ChartIcon />
                  {model.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};