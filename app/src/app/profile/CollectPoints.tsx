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

export const CollectPoints: FC<StartPollProps> = ({
  question,
}: StartPollProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const { getPolls } = usePollStore();
  const { getUserAccount } = useUserAccountStore();

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

    let [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), publicKey.toBuffer()],
      program.programId
    );

    const hexString = createHash("sha256")
      .update(question, "utf8")
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

    let [scoreListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring_list"), pollPda.toBuffer()],
      program.programId
    );

    let [userScorePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_score"), pollPda.toBuffer(), publicKey.toBuffer()],
      program.programId
    );

    setIsLoading(true);
    let signature: TransactionSignature = "";
    try {
      const resolvePollInstruction = await program.methods
        .collectPoints()
        .accounts({
          user: userPda,
          poll: pollPda,
          userPrediction: userPredictionPda,
          scoringList: scoreListPda,
          userScore: userScorePda,
        })
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
      getUserAccount(connection, publicKey);
    } catch (error: any) {
      toast.error("Transaction failed!: " + error?.message);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [
    publicKey,
    connection,
    sendTransaction,
    question,
    getPolls,
    getUserAccount,
  ]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-center gap-2">
        <button
          className="shadow rounded-md px-6 py-4 bg-green-200 enabled:hover:brightness-110 enabled:hover:cursor-pointer"
          onClick={() => onClick()}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-pulse">
              <ImSpinner2 className="inline mr-2 animate-spin text-sm" />
              Loading...
            </span>
          ) : (
            <div className="">Collect Points</div>
          )}
        </button>
      </div>
    </div>
  );
};
