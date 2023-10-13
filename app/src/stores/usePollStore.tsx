import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";
import { Idl, Program } from "@coral-xyz/anchor";
import { Convergence, IDL } from "@/idl/convergence_idl";
import { connection, programId } from "@/utils/anchor";
import { Poll } from "@/types/program_types";
import { createHash } from "crypto";

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
        let allUserPollsMask = await Promise.all(
          allPolls.map((poll) => {
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
        let allUserPolls = allPolls.filter((_, i) => allUserPollsMask[i]);
        livePolls = allUserPolls.filter((poll) => poll.open);
        pastPolls = allUserPolls.filter((poll) => poll.result !== null);
        onwPolls = decoded.filter(
          (poll) => poll.creator.toBase58() === publicKey.toBase58()
        );
        // livePolls = decoded.filter((poll) => poll.open);
        // pastPolls = decoded.filter((poll) => poll.result !== null);
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
