import { create } from "zustand";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  AccountClient,
  Idl,
  Program,
  ProgramAccount,
  DecodeType,
  BN,
} from "@coral-xyz/anchor";
import { Convergence, IDL } from "@/idl/convergence_idl";
import { programId } from "@/utils/anchor";

type Poll = {
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

type PollStore = {
  allPolls: Poll[];
  livePolls: Poll[];
  onwPolls: Poll[];
  pastPolls: Poll[];
  getPolls: (publicKey: PublicKey | null) => void;
};

const usePollStore = create<PollStore>((set, _get) => ({
  allPolls: [],
  livePolls: [],
  onwPolls: [],
  pastPolls: [],
  getPolls: async (publicKey) => {
    let allPolls: any[] = [];
    let livePolls: any[] = [];
    let onwPolls: any[] = [];
    let pastPolls: any[] = [];
    if (publicKey !== null) {
      const program = new Program(
        IDL as Idl,
        programId
      ) as unknown as Program<Convergence>;
      try {
        const polls = await program.account.poll.all();
        const decoded = polls.map((poll) => poll.account) as unknown as Poll[];
        allPolls = decoded;
        onwPolls = decoded.filter(
          (poll) => poll.creator.toBase58() === publicKey.toBase58()
        );
        livePolls = decoded.filter((poll) => poll.open);
        pastPolls = decoded.filter((poll) => poll.result !== null);
      } catch (e) {
        console.log(`error getting user account: `, e);
      }
    }
    set((s) => {
      return { allPolls, onwPolls, livePolls, pastPolls };
    });
  },
}));

export default usePollStore;
