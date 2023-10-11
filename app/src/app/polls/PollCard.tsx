import { Poll } from "@/types/program_types";
import { programId } from "@/utils/anchor";
import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PredictSlider } from "./PredictSlider";

type PollProps = {
  poll: Poll;
};

const PollCard: FC<PollProps> = ({ poll }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [userPredicion, setUserPrediction] = useState("-");

  const handleChange = (prediction: string) => {
    setUserPrediction(prediction);
  };

  useEffect(() => {
    const getUserPrediction = async () => {
      if (!publicKey) return;
      const hexString = createHash("sha256")
        .update(poll.question, "utf8")
        .digest("hex");
      const questionSeed = Uint8Array.from(Buffer.from(hexString, "hex"));

      let [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), questionSeed],
        programId
      );

      let [userPredictionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollPda.toBuffer(),
          publicKey.toBuffer(),
        ],
        programId
      );

      const predictionAccount = await connection.getAccountInfo(
        userPredictionPda
      );
      console.log("prediction accoutn", predictionAccount);
    };
    getUserPrediction();
  }, [connection, poll.question, publicKey]);

  if (!publicKey) {
    return <div></div>;
  }

  return (
    <div>
      <div>{poll.question}</div>
      <div>Crowd prediction: {poll.crowdPrediction || "-"}</div>
      <div>Your prediction: {userPredicion}</div>
      <PredictSlider
        question={poll.question}
        prediction={userPredicion}
        onChange={handleChange}
      />
    </div>
  );
};

export default PollCard;
