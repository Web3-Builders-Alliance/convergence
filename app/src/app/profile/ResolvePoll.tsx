import { Convergence, IDL } from "@/idl/convergence_idl";
import usePollStore from "@/stores/usePollStore";
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

type StartPollProps = {
  question: string;
};

export const ResolvePoll: FC<StartPollProps> = ({
  question,
}: StartPollProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const { getPolls } = usePollStore();

  const onClick = useCallback(
    async (result: boolean) => {
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
        const resolvePollInstruction = await program.methods
          .resolvePoll(result)
          .accounts({ poll: pollAccount, scoringList: scoreListAccount })
          .instruction();

        // Get the lates block hash to use on our transaction and confirmation
        let latestBlockhash = await connection.getLatestBlockhash();

        // Create a new TransactionMessage with version and compile it to version 0
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [resolvePollInstruction],
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
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, connection, sendTransaction, question, getPolls]
  );

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 underline">Resolve poll</div>
      <div className="flex justify-between items-center gap-2">
        <button
          className="shadow rounded-md px-6 py-4 bg-green-200 enabled:hover:brightness-110 enabled:hover:cursor-pointer"
          onClick={() => onClick(true)}
          disabled={isLoading}
        >
          <div className="">Yes</div>
        </button>
        <div className="mx-2 text-center">Did it happen?</div>
        <button
          className="shadow rounded-md px-6 py-4 bg-red-200 enabled:hover:brightness-110 enabled:hover:cursor-pointer"
          onClick={() => onClick(true)}
          disabled={isLoading}
        >
          <div className="">No</div>
        </button>
      </div>
    </div>
  );
};
