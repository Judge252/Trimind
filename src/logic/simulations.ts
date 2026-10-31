import type { BuilderState, FounderState, InvestorState } from "../models/index.js";
import { assets, features, founderEvents } from "../content/scenarios.js";
export type RuleError =
  | "quantity"
  | "cash"
  | "holdings"
  | "finished"
  | "price"
  | "marketing"
  | "capacity"
  | "selection";
export class SimulationError extends Error {
  constructor(public code: RuleError) {
    super(code);
  }
}
export const initialInvestor = (): InvestorState => ({
  round: 0,
  cash: 10000,
  holdings: { steady: 0, local: 0, spark: 0 },
  history: [{ round: 0, cash: 10000, total: 10000 }],
  log: [],
});
export const investorTotal = (s: InvestorState) =>
  s.cash +
  assets.reduce((n, a) => n + (s.holdings[a.id] || 0) * a.prices[s.round], 0);
export function trade(
  s: InvestorState,
  assetId: string,
  quantity: number,
  side: "buy" | "sell",
): InvestorState {
  if (s.round >= 4) throw new SimulationError("finished");
  const asset = assets.find((a) => a.id === assetId);
  if (
    !asset ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > 100000
  )
    throw new SimulationError("quantity");
  const amount = quantity * asset.prices[s.round];
  if (side === "buy" && amount > s.cash) throw new SimulationError("cash");
  if (side === "sell" && quantity > (s.holdings[assetId] || 0))
    throw new SimulationError("holdings");
  const sign = side === "buy" ? 1 : -1;
  return {
    ...s,
    cash: s.cash - sign * amount,
    holdings: {
      ...s.holdings,
      [assetId]: (s.holdings[assetId] || 0) + sign * quantity,
    },
    log: [...s.log, `${side}:${assetId}:${quantity}:${asset.prices[s.round]}`],
  };
}
export function advanceInvestor(s: InvestorState): InvestorState {
  if (s.round >= 4) throw new SimulationError("finished");
  const next = { ...s, round: s.round + 1 };
  return {
    ...next,
    history: [
      ...s.history,
      { round: next.round, cash: next.cash, total: investorTotal(next) },
    ],
  };
}
export const initialFounder = (): FounderState => ({
  round: 0,
  cash: 3000,
  history: [],
});
export function runFounder(
  s: FounderState,
  price: number,
  marketing: number,
  capacity: number,
): FounderState {
  if (s.round >= 4) throw new SimulationError("finished");
  if (!Number.isInteger(price) || price < 30 || price > 100)
    throw new SimulationError("price");
  if (!Number.isInteger(marketing) || marketing < 0 || marketing > 500)
    throw new SimulationError("marketing");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 60)
    throw new SimulationError("capacity");
  const costs = capacity * 25 + marketing + 200;
  if (costs > s.cash) throw new SimulationError("cash");
  const demand = Math.max(
    0,
    Math.floor(
      founderEvents[s.round].demand - (price - 50) * 0.8 + marketing / 25,
    ),
  );
  const sold = Math.min(capacity, demand),
    revenue = sold * price,
    profit = revenue - costs,
    cash = s.cash + profit;
  return {
    round: s.round + 1,
    cash,
    history: [
      ...s.history,
      {
        round: s.round + 1,
        price,
        marketing,
        capacity,
        demand,
        sold,
        revenue,
        costs,
        profit,
        cash,
      },
    ],
  };
}
export const initialBuilder = (): BuilderState => ({
  features: [],
  technical: "local",
  evaluated: false,
});
export function evaluateBuilder(s: BuilderState) {
  if (
    !s.features.length ||
    new Set(s.features).size !== s.features.length ||
    s.features.some((id) => !features.find((f) => f.id === id))
  )
    throw new SimulationError("selection");
  const selected = features.filter((f) => s.features.includes(f.id));
  const hours =
    selected.reduce((n, f) => n + f.hours, 0) +
    (s.technical === "cloud" ? 6 : 0);
  const cost =
    selected.reduce((n, f) => n + f.cost, 0) +
    (s.technical === "cloud" ? 300 : 0);
  const missing = features.filter((f) => f.core && !s.features.includes(f.id));
  return {
    hours,
    cost,
    missing,
    feasible: hours <= 24 && cost <= 1200 && missing.length === 0,
  };
}
