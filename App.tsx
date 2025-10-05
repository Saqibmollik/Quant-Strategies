import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MODELS } from './features/models';
import type { Model } from './types';

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<Model>(MODELS[0]);

  const ActiveModelComponent = activeModel.component;

  return (
    <div className="flex flex-col h-screen bg-background text-primary/90">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          models={MODELS}
          activeModelId={activeModel.id}
          onSelectModel={setActiveModel}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <ActiveModelComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
