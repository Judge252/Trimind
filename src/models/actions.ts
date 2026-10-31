import type { BuilderState, Track } from "./index.js";
export type SimulationAction =
  | { type: "reset" }
  | { type: "trade"; assetId: string; quantity: number; side: "buy" | "sell" }
  | { type: "advance" }
  | {
      type: "founder-round";
      price: number;
      marketing: number;
      capacity: number;
    }
  | {
      type: "builder-choices";
      features: string[];
      technical: BuilderState["technical"];
    }
  | { type: "builder-evaluate" }
  | { type: "builder-revise" };
export interface SimulationCommand {
  track: Track;
  sessionId: string;
  expectedRevision: number;
  action: SimulationAction;
}
