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
import { connection, programId } from "@/utils/anchor";
import { Poll } from "@/types/program_types";
import { createHash } from "crypto";
import { connect } from "http2";

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
    let allPolls: Poll[] = [];
    let livePolls: Poll[] = [];
    let onwPolls: Poll[] = [];
    let pastPolls: Poll[] = [];
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
        const allLivePolls = decoded.filter((poll) => poll.open);
        let allLivePollsMask = await Promise.all(
          allLivePolls.map((poll) => {
            const hexString = createHash("sha256")
              .update(poll.question, "utf8")
              .digest("hex");
            const questionSeed = Uint8Array.from(Buffer.from(hexString, "hex"));

            let [pollPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("poll"), questionSeed],
              program.programId
            );

            let [userPredictionPda] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("user_prediction"),
                pollPda.toBuffer(),
                publicKey.toBuffer(),
              ],
              program.programId
            );
            const userPrediction = connection.getAccountInfo(userPredictionPda);

            return userPrediction;
          })
        );
        livePolls = allLivePolls.filter((_, i) => allLivePollsMask[i]);
        const allPastPolls = decoded.filter((poll) => poll.result !== null);
        let pastPollsMask = await Promise.all(
          allPastPolls.map((poll) => {
            const hexString = createHash("sha256")
              .update(poll.question, "utf8")
              .digest("hex");
            const questionSeed = Uint8Array.from(Buffer.from(hexString, "hex"));

            let [pollPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("poll"), questionSeed],
              program.programId
            );

            let [userPredictionPda] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("user_prediction"),
                pollPda.toBuffer(),
                publicKey.toBuffer(),
              ],
              program.programId
            );
            const userPrediction = connection.getAccountInfo(userPredictionPda);

            return userPrediction;
          })
        );
        pastPolls = allPastPolls.filter((_, i) => pastPollsMask[i]);
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
