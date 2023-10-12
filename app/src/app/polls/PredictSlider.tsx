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
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";

type SliderRange = [number] | [number, number, number];

type StartPollProps = {
  question: string;
  lowerPrediction: number | null;
  upperPrediction: number | null;
  onChange: (lower: number | null, upper: number | null) => void;
};

export const PredictSlider: FC<StartPollProps> = ({
  question,
  lowerPrediction,
  upperPrediction,
  onChange,
}: StartPollProps) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfidenceInterval, setIsConfidenceInterval] = useState(
    lowerPrediction !== null &&
      upperPrediction !== null &&
      lowerPrediction < upperPrediction
      ? true
      : false
  );
  const [userLowerPrediction, setUserLowerPrediction] =
    useState(lowerPrediction);
  const [userUpperPrediction, setUserUpperPrediction] =
    useState(upperPrediction);

  const [oldLowerPrediction] = useState(lowerPrediction);
  const [oldUpperPrediction] = useState(upperPrediction);
  const [oldIsConfidenceInterval] = useState(
    lowerPrediction !== null &&
      upperPrediction !== null &&
      lowerPrediction < upperPrediction
      ? true
      : false
  );
  const [prediction, setPrediction] = useState(
    lowerPrediction !== null && upperPrediction !== null
      ? (upperPrediction + lowerPrediction) / 2
      : 50
  );

  const intervalLength = (prediction: number, length: number) => {
    return Math.min(100 - prediction, prediction, Math.round(length / 2));
  };

  const { getPolls } = usePollStore();

  console.log("lower", userLowerPrediction);
  console.log("upper", userUpperPrediction);

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
    <>
      <div className="flex flex-col items-start">
        <div className="w-full flex gap-4 my-4">
          <Slider.Root
            min={0}
            max={100}
            step={1}
            minStepsBetweenThumbs={1}
            className="w-1/2 h-5 block relative cursor-pointer bg-white rounded-full"
            value={
              isConfidenceInterval
                ? [userLowerPrediction!, prediction, userUpperPrediction!]
                : [prediction]
            }
            onValueChange={(sliderRange: SliderRange) => {
              if (sliderRange.length === 1) {
                setPrediction(sliderRange[0]);
                onChange(sliderRange[0], sliderRange[0]);
                setUserLowerPrediction(sliderRange[0]);
                setUserUpperPrediction(sliderRange[0]);
              } else {
                if (sliderRange[1] === prediction) {
                  const interval = sliderRange[2] - sliderRange[0];
                  setUserLowerPrediction(
                    prediction - intervalLength(prediction, interval)
                  );
                  setUserUpperPrediction(
                    prediction + intervalLength(prediction, interval)
                  );
                  onChange(
                    prediction - intervalLength(prediction, interval),
                    prediction + intervalLength(prediction, interval)
                  );
                } else {
                  const interval = sliderRange[2] - sliderRange[0];
                  setUserLowerPrediction(
                    sliderRange[1] - intervalLength(sliderRange[1], interval)
                  );
                  setUserUpperPrediction(
                    sliderRange[1] + intervalLength(sliderRange[1], interval)
                  );
                  setPrediction(sliderRange[1]);
                  onChange(
                    sliderRange[1] - intervalLength(sliderRange[1], interval),
                    sliderRange[1] + intervalLength(sliderRange[1], interval)
                  );
                }
              }
            }}
            orientation="horizontal"
          >
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            {isConfidenceInterval ? (
              <>
                <div
                  className="absolute left-6 right-6 bg-dark-500/80"
                  // style={{
                  //   top: `${lowerHeight}%`,
                  //   bottom: `${higherHeight}%`,
                  // }}
                />
                <Slider.Thumb className="block w-[1px] h-5 bg-black" />
                <Slider.Thumb className="block w-[1px] h-5 bg-red-500" />
                <Slider.Thumb className="block w-[1px] h-5 bg-blue-500" />
              </>
            ) : (
              <Slider.Thumb className="block w-[1px] h-5 bg-red-500" />
            )}
          </Slider.Root>
          {!(
            oldLowerPrediction === lowerPrediction &&
            oldUpperPrediction === upperPrediction
          ) && (
            <button
              className="border border-gray-500 rounded-md py-[1px] px-[2px] text-xs"
              onClick={() => {
                onChange(oldLowerPrediction, oldUpperPrediction);
                setPrediction(
                  oldLowerPrediction && oldUpperPrediction
                    ? (oldLowerPrediction + oldUpperPrediction) / 2
                    : 50
                );
                setIsConfidenceInterval(oldIsConfidenceInterval);
                setUserLowerPrediction(oldLowerPrediction);
                setUserUpperPrediction(oldUpperPrediction);
              }}
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center">
          <label
            className="text-[15px] leading-none pr-[15px]"
            htmlFor="confidence-interval"
          >
            Confidence interval
          </label>
          <Switch.Root
            checked={isConfidenceInterval}
            onCheckedChange={(value) => {
              setIsConfidenceInterval(value);
              if (value) {
                setUserLowerPrediction(
                  userLowerPrediction !== null
                    ? userLowerPrediction - intervalLength(prediction, 20)
                    : 50 - intervalLength(50, 20)
                );
                setUserUpperPrediction(
                  userUpperPrediction !== null
                    ? userUpperPrediction + intervalLength(prediction, 20)
                    : 50 + intervalLength(50, 20)
                );
                onChange(
                  userLowerPrediction !== null
                    ? userLowerPrediction - intervalLength(prediction, 20)
                    : 50 - intervalLength(50, 20),
                  userUpperPrediction !== null
                    ? userUpperPrediction + intervalLength(prediction, 20)
                    : 50 + intervalLength(50, 20)
                );
              } else {
                setUserLowerPrediction(prediction);
                setUserUpperPrediction(prediction);
                onChange(prediction, prediction);
              }
            }}
            className="w-10 h-5 rounded-full relative bg-red-400 data-[state=checked]:bg-green-400 outline-none cursor-default"
            id="confidence-interval"
          >
            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_2px] shadow-black transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-5" />
          </Switch.Root>
        </div>
      </div>
    </>
  );
};
