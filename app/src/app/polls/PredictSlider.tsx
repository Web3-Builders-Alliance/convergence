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
import { ChangeEvent, FC, useCallback, useState } from "react";
import toast from "react-hot-toast";

type StartPollProps = {
  question: string;
  prediction: string;
  onChange: (value: string) => void;
};

export const PredictSlider: FC<StartPollProps> = ({
  question,
  prediction,
  onChange,
}: StartPollProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [oldPrediction] = useState(prediction);

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
        const registerUserInstruction = await program.methods
          .resolvePoll(result)
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
    <div className="flex items-center">
      <input
        type="range"
        min="0"
        max="100"
        value={prediction}
        onChange={(e) => onChange(e.target.value)}
        className="slider appearance-none h-4 bg-gray-300 rounded-full"
      />

      {/* <span className="ml-2">{prediction}</span> */}
      <button onClick={() => onChange(oldPrediction)}>Reset</button>
      <button onClick={() => onChange(oldPrediction)}>Submit</button>
    </div>
  );
};
