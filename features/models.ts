import type { Model } from '../types';
import BlackScholesModel from './black_scholes/BlackScholesModel';
import BinomialOptionPricingModel from './binomial_option_pricing/BinomialOptionPricingModel';
import MonteCarloModel from './monte_carlo/MonteCarloModel';
import MertonJumpDiffusionModel from './merton_jump_diffusion/MertonJumpDiffusionModel';
import GarchModel from './garch/GarchModel';
import AmericanOptionsModel from './american_options/AmericanOptionsModel';
import StochasticControlModel from './stochastic_control/StochasticControlModel';
import AdaptivePdeModel from './adaptive_pde/AdaptivePdeModel';
import LevyModelsModel from './levy_models/LevyModelsModel';
import MixedIntegerOptimisationModel from './mixed_integer_optimisation/MixedIntegerOptimisationModel';
import VaRCVaRModel from './var_cvar/VaRCVaRModel';
import PairsTradingModel from './pairs_trading/PairsTradingModel';

export const MODELS: Model[] = [
  {
    id: 'black-scholes',
    name: 'Black-Scholes Model',
    component: BlackScholesModel,
  },
  {
    id: 'binomial-option-pricing',
    name: 'Binomial Option Pricing',
    component: BinomialOptionPricingModel,
  },
  {
    id: 'monte-carlo',
    name: 'Monte Carlo Simulations',
    component: MonteCarloModel,
  },
  {
    id: 'merton-jump-diffusion',
    name: 'Merton Jump Diffusion',
    component: MertonJumpDiffusionModel,
  },
  {
    id: 'garch',
    name: 'GARCH Model',
    component: GarchModel,
  },
  {
    id: 'var-cvar',
    name: 'Value at Risk (VaR) & CVaR',
    component: VaRCVaRModel,
  },
  {
    id: 'pairs-trading',
    name: 'Pairs Trading Strategy',
    component: PairsTradingModel,
  },
  {
    id: 'american-options',
    name: 'American Options',
    component: AmericanOptionsModel,
  },
  {
    id: 'stochastic-control-portfolio',
    name: 'Stochastic Control Portfolios',
    component: StochasticControlModel,
  },
  {
    id: 'adaptive-pde-solvers',
    name: 'Adaptive PDE Solvers',
    component: AdaptivePdeModel,
  },
  {
    id: 'levy-models',
    name: 'Fractional PDEs under Lévy Models',
    component: LevyModelsModel,
  },
  {
    id: 'mixed-integer-optimisation',
    name: 'Mixed-Integer Optimisation',
    component: MixedIntegerOptimisationModel,
  },
];
