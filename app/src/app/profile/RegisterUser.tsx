import { program } from "@/utils/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { FC, useCallback, useState } from "react";
import toast from "react-hot-toast";

export const RegisterUser: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!", { position: "top-left" });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    let [userAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), publicKey.toBuffer()],
      program.programId
    );

    let signature: TransactionSignature = "";
    try {
      const registerUserInstruction = await program.methods
        .registerUser()
        .accounts({ user: userAccount })
        .instruction();

      // Get the lates block hash to use on our transaction and confirmation
      let latestBlockhash = await connection.getLatestBlockhash();

      // Create a new TransactionMessage with version and compile it to version 0
      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [registerUserInstruction],
      }).compileToV0Message();

      // Create a new VersionedTransaction to support the v0 message
      const transaction = new VersionedTransaction(messageV0);

      // Send transaction and await for signature
      signature = await sendTransaction(transaction, connection);

      // Await for confirmation
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      console.log(signature);
      toast.success("Transaction successful!");
    } catch (error: any) {
      toast.error("Transaction failed!" + error?.message);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    }
  }, [publicKey, connection, sendTransaction]);

  return (
    <button
      className="px-2 bg-gradient-to-br rounded-md from-indigo-500/50 to-fuchsia-500/50 disabled:from-gray-400 disabled:to-gray-400 enabled:hover:from-white enabled:hover:to-purple-300 text-black text-xs"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        <div className="shadow rounded-md px-6 py-4 bg-blue-400 hover:brightness-110 hover:cursor-pointer">
          Register User
        </div>
      )}
    </button>
  );
};
