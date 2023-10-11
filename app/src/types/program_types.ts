import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export type Poll = {
  creator: PublicKey;
  resolver: PublicKey;
  open: boolean;
  accumulatedWeights: number;
  crowdPrediction: number | null;
  question: string;
  description: string;
  result: boolean | null;
  startSlot: BN;
  endSlot: BN;
  numForecasters: BN;
  numPredictionUpdates: BN;
  endTime: BN | null;
  bump: number;
};
