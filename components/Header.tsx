import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-surface border-b border-secondary/20 flex-shrink-0">
            <div className="max-w-[96rem] mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                         <h1 className="text-xl font-bold text-primary">
                            Mollik Nguyen
                        </h1>
                        <h2 className="text-xs font-medium text-accent uppercase tracking-widest hidden md:block">
                            Quantitative Finance Terminal
                        </h2>
                    </div>
                </div>
            </div>
        </header>
    )
}
