import useUserSOLBalanceStore from "@/stores/useUserSOLBalanceStore";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  clusterApiUrl,
} from "@solana/web3.js";
import { FC, useCallback, useState } from "react";
import toast from "react-hot-toast";

export const RequestAirdrop: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      console.log("error", "Wallet not connected!");
      toast.error("Wallet not connected!", { position: "top-left" });

      return;
    }
    const publicConnection = new Connection(clusterApiUrl("devnet"), {
      commitment: "confirmed",
    });

    let signature: TransactionSignature = "";

    setIsLoading(true);
    try {
      signature = await publicConnection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL
      );

      // Get the lates block hash to use on our transaction and confirmation
      let latestBlockhash = await publicConnection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      toast.success("Airdrop successful!", { position: "top-left" });

      getUserSOLBalance(connection, publicKey);
    } catch (error: any) {
      toast.error(`Airdrop failed!: ${error.message}`, {
        position: "top-left",
      });

      console.log("error", `Airdrop failed! ${error?.message}`, signature);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, getUserSOLBalance]);

  return (
    <button
      className="px-2 bg-gradient-to-br rounded-md from-indigo-500/50 to-fuchsia-500/50 disabled:from-gray-400 disabled:to-gray-400 enabled:hover:from-white enabled:hover:to-purple-300 text-black text-xs"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        <span>Airdrop</span>
      )}
    </button>
  );
};
