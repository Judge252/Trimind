import type {
  BuilderState,
  FounderState,
  InvestorState,
  SimulationSession,
  SimulationResult,
} from "../src/models/index.js";
import type { SimulationCommand } from "../src/models/actions.js";
import {
  initialBuilder,
  initialFounder,
  initialInvestor,
  trade,
  advanceInvestor,
  investorTotal,
  runFounder,
  evaluateBuilder,
} from "../src/logic/simulations.js";
import { ApiError } from "./errors.js";
export function transition(
  current: SimulationSession | undefined,
  command: SimulationCommand,
): { session: SimulationSession; result?: SimulationResult } {
  const { track, action } = command;
  if (action.type === "reset")
    return {
      session: {
        id: crypto.randomUUID(),
        track,
        state:
          track === "builder"
            ? initialBuilder()
            : track === "founder"
              ? initialFounder()
              : initialInvestor(),
        finalized: false,
        revision: 0,
      },
    };
  const session = current || {
    id: command.sessionId,
    track,
    state:
      track === "builder"
        ? initialBuilder()
        : track === "founder"
          ? initialFounder()
          : initialInvestor(),
    finalized: false,
    revision: 0,
  };
  if (
    session.id !== command.sessionId ||
    (session.revision || 0) !== command.expectedRevision
  )
    throw new ApiError("simulation-conflict", 409);
  if (session.finalized && action.type !== "builder-revise")
    throw new ApiError("finished", 409);
  let state = session.state,
    summary: Record<string, number | string> | undefined;
  if (track === "investor" && action.type === "trade")
    state = trade(
      state as InvestorState,
      action.assetId,
      action.quantity,
      action.side,
    );
  else if (track === "investor" && action.type === "advance") {
    state = advanceInvestor(state as InvestorState);
    if (state.round === 4)
      summary = {
        total: investorTotal(state),
        profit: investorTotal(state) - 10000,
      };
  } else if (track === "founder" && action.type === "founder-round") {
    state = runFounder(
      state as FounderState,
      action.price,
      action.marketing,
      action.capacity,
    );
    if (state.round === 4 || state.cash < 225)
      summary = { profit: state.cash - 3000, total: state.cash };
  } else if (track === "builder" && action.type === "builder-choices") {
    state = {
      features: action.features,
      technical: action.technical,
      evaluated: false,
    };
    if (action.features.length) evaluateBuilder(state);
  } else if (track === "builder" && action.type === "builder-evaluate") {
    const r = evaluateBuilder(state as BuilderState);
    state = { ...(state as BuilderState), evaluated: true };
    summary = { hours: r.hours, cost: r.cost, feasible: Number(r.feasible) };
  } else if (track === "builder" && action.type === "builder-revise")
    state = { ...(state as BuilderState), evaluated: false };
  else throw new ApiError("invalid-action");
  return {
    session: {
      ...session,
      state,
      revision: (session.revision || 0) + 1,
      finalized:
        action.type === "builder-revise"
          ? false
          : session.finalized || !!summary,
    },
    ...(summary && !session.finalized
      ? {
          result: {
            id: session.id,
            track,
            completedAt: new Date().toISOString(),
            summary,
          },
        }
      : {}),
  };
}
