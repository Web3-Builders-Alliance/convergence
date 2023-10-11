import { create } from "zustand";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Idl, Program } from "@coral-xyz/anchor";
import { Convergence, IDL } from "@/idl/convergence_idl";
import { programId } from "@/utils/anchor";

type UserAccountStore = {
  isRegistered: boolean;
  score: number;
  getUserAccount: (connection: Connection, publicKey: PublicKey | null) => void;
};

const useUserAccountStore = create<UserAccountStore>((set, _get) => ({
  isRegistered: false,
  score: 0,
  getUserAccount: async (connection, publicKey) => {
    let isRegistered = false;
    let score = 0;
    if (publicKey !== null) {
      const program = new Program(
        IDL as Idl,
        programId
      ) as unknown as Program<Convergence>;
      try {
        let [userAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("user"), publicKey.toBuffer()],
          program.programId
        );

        const userAccount = await connection.getAccountInfo(userAccountPda);
        if (userAccount) {
          const user = await program.account.user.fetch(userAccountPda);
          console.log("User", user);
          isRegistered = true;
          score = user.score;
        } else {
          isRegistered = false;
        }
      } catch (e) {
        console.log(`error getting user account: `, e);
      }
    }
    set((s) => {
      return { isRegistered: isRegistered, score: score };
    });
  },
}));

export default useUserAccountStore;
