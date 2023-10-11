import { create } from "zustand";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

type UserSOLBalanceStore = {
  balance: number;
  getUserSOLBalance: (
    connection: Connection,
    publicKey: PublicKey | null
  ) => void;
};

const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set, _get) => ({
  balance: 0,
  getUserSOLBalance: async (connection, publicKey) => {
    let balance = 0;
    if (publicKey !== null) {
      try {
        balance = await connection.getBalance(publicKey, "confirmed");
        balance = balance / LAMPORTS_PER_SOL;
      } catch (e) {
        console.log(`error getting balance: `, e);
      }
    }
    set((s) => {
      console.log(`balance updated, `, balance);
      return { balance: balance };
    });
  },
}));

export default useUserSOLBalanceStore;
