import { Poll } from "@/types/program_types";
import { programId } from "@/utils/anchor";
import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PredictSlider } from "./PredictSlider";
import { FaPlusMinus } from "react-icons/fa6";
import { Idl, Program } from "@coral-xyz/anchor";
import { Convergence, IDL } from "@/idl/convergence_idl";

type PollProps = {
  poll: Poll;
};

const PollCard: FC<PollProps> = ({ poll }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [lower, setLower] = useState<number | null>(null);
  const [upper, setUpper] = useState<number | null>(null);
  const [lowerPrediction, setLowerPrediction] = useState<number | null>(null);
  const [upperPrediction, setUpperPrediction] = useState<number | null>(null);

  const handleChange = (lower: number | null, upper: number | null) => {
    setLowerPrediction(lower);
    setUpperPrediction(upper);
  };

  useEffect(() => {
    const getUserPrediction = async () => {
      if (!publicKey) return;

      const program = new Program(
        IDL as Idl,
        programId
      ) as unknown as Program<Convergence>;

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

      try {
        const predictionAccount = await program.account.userPrediction.fetch(
          userPredictionPda
        );
        if (predictionAccount) {
          console.log("prediction account", predictionAccount);
          setLower(predictionAccount.lowerPrediction);
          setUpper(predictionAccount.upperPrediction);
          setLowerPrediction(predictionAccount.lowerPrediction);
          setUpperPrediction(predictionAccount.upperPrediction);
        }
      } catch (e) {
        console.log(e);
      }
    };
    getUserPrediction();
  }, [connection, poll.question, publicKey]);

  if (!publicKey) {
    return <div></div>;
  }
  console.log("upper", upperPrediction);
  console.log("lower", lowerPrediction);
  return (
    <div>
      <div className="font-bold h-20">{poll.question}</div>
      <div>
        Crowd prediction:{" "}
        {poll.crowdPrediction
          ? (poll.crowdPrediction / 10000).toFixed(2) + "%"
          : "-"}
      </div>
      <div># Forecasters: {poll.numForecasters.toString()}</div>
      <div className="flex gap-2 mt-4">
        <div>
          Your prediction:{" "}
          {lowerPrediction !== null && upperPrediction !== null
            ? (lowerPrediction + upperPrediction) / 2
            : "-"}
        </div>
        {lowerPrediction !== null &&
        upperPrediction !== null &&
        lowerPrediction < upperPrediction ? (
          <span className="flex items-center gap-1 text-sm text-gray-700">
            <FaPlusMinus />
            {(upperPrediction - lowerPrediction) / 2}
          </span>
        ) : (
          <></>
        )}
      </div>
      <PredictSlider
        question={poll.question}
        lowerPrediction={lower}
        upperPrediction={upper}
        onChange={handleChange}
      />
    </div>
  );
};

export default PollCard;
