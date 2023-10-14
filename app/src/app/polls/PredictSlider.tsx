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
import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

  const [oldLowerPrediction, setOldLowerPrediction] = useState(lowerPrediction);
  const [oldUpperPrediction, setOldUpperPrediction] = useState(upperPrediction);

  const [oldIsConfidenceInterval, setOldIsConfidenceInterval] = useState(
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

  const { getPolls } = usePollStore();

  useEffect(() => {
    setOldLowerPrediction(lowerPrediction);
    setOldUpperPrediction(upperPrediction);
    setIsConfidenceInterval(
      lowerPrediction !== null &&
        upperPrediction !== null &&
        lowerPrediction < upperPrediction
        ? true
        : false
    );
    setUserLowerPrediction(lowerPrediction);
    setUserUpperPrediction(upperPrediction);
    setOldIsConfidenceInterval(
      lowerPrediction !== null &&
        upperPrediction !== null &&
        lowerPrediction < upperPrediction
        ? true
        : false
    );
    setPrediction(
      lowerPrediction !== null && upperPrediction !== null
        ? (upperPrediction + lowerPrediction) / 2
        : 50
    );
  }, [lowerPrediction, upperPrediction]);

  const intervalLength = (prediction: number, length: number) => {
    return Math.min(100 - prediction, prediction, Math.round(length / 2));
  };

  const makePrediction = useCallback(async () => {
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
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userPredictionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_prediction"),
        pollPda.toBuffer(),
        publicKey.toBuffer(),
      ],
      program.programId
    );

    let [predictionUpdatePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction_update"),
        pollPda.toBuffer(),
        pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
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
      const userAccount = await program.account.user.fetch(userPda);
      try {
        const makePredictionInstruction = await program.methods
          .makePrediction(
            userLowerPrediction !== null ? userLowerPrediction : 0,
            userUpperPrediction != null ? userUpperPrediction : 100
          )
          .accounts({
            user: userPda,
            poll: pollPda,
            userPrediction: userPredictionPda,
            predictionUpdate: predictionUpdatePda,
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
          instructions: [makePredictionInstruction],
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
        setOldLowerPrediction(userLowerPrediction);
        setOldUpperPrediction(userUpperPrediction);
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
    } catch (e) {
      toast.error("Please register first on your profile page.");
    }
  }, [
    publicKey,
    connection,
    sendTransaction,
    question,
    userLowerPrediction,
    userUpperPrediction,
    getPolls,
  ]);

  const updatePrediction = useCallback(async () => {
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

    let [pollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), questionSeed],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userPredictionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_prediction"),
        pollPda.toBuffer(),
        publicKey.toBuffer(),
      ],
      program.programId
    );

    let [predictionUpdatePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("prediction_update"),
        pollPda.toBuffer(),
        pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
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
      console.log("lower", userLowerPrediction);
      console.log("upper", userUpperPrediction);
      const updatePredictionInstruction = await program.methods
        .updatePrediction(
          userLowerPrediction !== null ? userLowerPrediction : 0,
          userUpperPrediction != null ? userUpperPrediction : 100
        )
        .accounts({
          poll: pollPda,
          userPrediction: userPredictionPda,
          predictionUpdate: predictionUpdatePda,
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
        instructions: [updatePredictionInstruction],
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
      setOldLowerPrediction(userLowerPrediction);
      setOldUpperPrediction(userUpperPrediction);
      getPolls(publicKey);
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
    userLowerPrediction,
    userUpperPrediction,
    getPolls,
  ]);

  return (
    <>
      <div className="flex flex-col items-start">
        <div className="w-full flex gap-4 my-8">
          <Slider.Root
            min={0}
            max={100}
            step={1}
            minStepsBetweenThumbs={1}
            className="w-1/2 h-5 block relative bg-white rounded-full"
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
                {/* <div
                  className="absolute left-6 right-6 bg-dark-500/80"
                  // style={{
                  //   top: `${lowerHeight}%`,
                  //   bottom: `${higherHeight}%`,
                  // }}
                /> */}
                <CustomThumb />
                <CustomThumb middle />
                <CustomThumb />
              </>
            ) : (
              <CustomThumb />
            )}
          </Slider.Root>

          {!(
            oldLowerPrediction === userLowerPrediction &&
            oldUpperPrediction === userUpperPrediction
          ) && (
            <button
              className="border border-gray-500 rounded-md py-[1px] px-[2px] text-xs"
              onClick={() => {
                onChange(oldLowerPrediction, oldUpperPrediction);
                setPrediction(
                  oldLowerPrediction !== null && oldUpperPrediction !== null
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

        <div className="flex items-center mb-4">
          <label
            className="text-[15px] leading-none pr-[15px]"
            htmlFor="confidence-interval"
          >
            Confidence interval
          </label>
          <Switch.Root
            disabled={userLowerPrediction === 100 || userUpperPrediction === 0}
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
            className="w-10 h-5 rounded-full relative bg-red-400 data-[state=checked]:bg-green-400 outline-none cursor-default disabled:bg-gray-300"
            id="confidence-interval"
          >
            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_2px] shadow-black transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-5" />
          </Switch.Root>
        </div>
        {oldLowerPrediction === null ? (
          userLowerPrediction === null ? (
            <></>
          ) : (
            <button
              className="bg-blue-300 rounded-md px-2 py-1 hover:bg-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                makePrediction();
              }}
            >
              Make Prediction
            </button>
          )
        ) : userLowerPrediction === oldLowerPrediction &&
          userUpperPrediction === oldUpperPrediction ? (
          <></>
        ) : (
          <button
            className="bg-blue-300 rounded-md px-2 py-1 hover:bg-blue-400"
            onClick={(e) => {
              e.stopPropagation();
              updatePrediction();
            }}
          >
            Update Prediction
          </button>
        )}
      </div>
    </>
  );
};

const CustomThumb = ({ middle = false }: { middle?: boolean }) => {
  return (
    <Slider.Thumb
      className={`flex flex-col justify-between focus-visible:outline-none bg-blue-300 w-[2px]  ${
        middle ? "h-5 mx-4" : "h-12 -translate-y-2"
      }`}
    >
      {/* <div
        className={`w-2 h-2 mt-px rounded-full bg-black -translate-y-1/2 ${
          middle ? "opacity-0" : "animate-showCircle"
        }`}
      /> */}
      {/* <div
        className={`w-0 h-0 mt-px border-solid border-y-[8px] border-l-[13px] border-transparent border-l-black translate-y-1/2 ${
          middle ? "opacity-0" : "animate-showTriangle"
        }`}
      /> */}
      <div
        className={`w-2 h-2 rounded-full bg-blue-300 -translate-y-1 -translate-x-[3px] ${
          middle ? "opacity-0" : ""
        }`}
      />
      <div
        className={`w-0 h-0 mt-px border-b-8 border-x-8 border-transparent border-solid border-b-blue-300 -translate-x-[7px] ${
          middle ? "opacity-0" : ""
        }`}
      />
    </Slider.Thumb>
  );
};
