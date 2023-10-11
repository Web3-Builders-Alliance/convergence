import { Convergence, IDL } from "@/idl/convergence_idl";
import usePollStore from "@/stores/usePollStore";
import useUserAccountStore from "@/stores/useUserAccountStore";
import { programId } from "@/utils/anchor";
import { Idl, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { createHash } from "crypto";
import { FC, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { ImSpinner2 } from "react-icons/im";

type StartPollProps = {
  question: string;
};

export const StartPoll: FC<StartPollProps> = ({ question }: StartPollProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const { getPolls } = usePollStore();

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!", { position: "top-left" });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    const program = new Program(
      IDL as Idl,
      programId
    ) as unknown as Program<Convergence>;

    const hexString = createHash("sha256")
      .update(question, "utf8")
      .digest("hex");
    const questionSeed = Uint8Array.from(Buffer.from(hexString, "hex"));

    let [pollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), questionSeed],
      program.programId
    );

    let [scoreListAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring_list"), pollAccount.toBuffer()],
      program.programId
    );

    setIsLoading(true);
    let signature: TransactionSignature = "";
    try {
      const registerUserInstruction = await program.methods
        .startPoll()
        .accounts({ poll: pollAccount, scoringList: scoreListAccount })
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
      getPolls(publicKey);
    } catch (error: any) {
      toast.error("Transaction failed!: " + error?.message);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, question, getPolls]);

  return (
    <button
      className="shadow rounded-md px-6 py-4 enabled:bg-blue-400 enabled:hover:brightness-110 enabled:hover:cursor-pointer disabled:bg-blue-200"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">
          <ImSpinner2 className="inline mr-2 animate-spin text-sm" />
          Loading...
        </span>
      ) : (
        <div className="">Start Poll</div>
      )}
    </button>
  );
};
