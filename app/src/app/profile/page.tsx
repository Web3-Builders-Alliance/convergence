"use client";
import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import useUserSOLBalanceStore from "@/stores/useUserSOLBalanceStore";
import { RequestAirdrop } from "./RequestAirdrop";
import { RegisterUser } from "./RegisterUser";
import useUserAccountStore from "@/stores/useUserAccountStore";
import { CreatePoll } from "./CreatePoll";
import usePollStore from "@/stores/usePollStore";
import { StartPoll } from "./StartPoll";
import { ResolvePoll } from "./ResolvePoll";
import { CollectPoints } from "./CollectPoints";
import { PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { programId } from "@/utils/anchor";
import { Idl, Program } from "@coral-xyz/anchor";
import { Convergence, IDL } from "@/idl/convergence_idl";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Profile() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  const { getUserAccount, isRegistered, score } = useUserAccountStore();

  const { getPolls, onwPolls, livePolls, pastPolls } = usePollStore();

  useEffect(() => {
    getUserSOLBalance(connection, wallet.publicKey);
    getUserAccount(connection, wallet.publicKey);
    getPolls(wallet.publicKey);
  }, [
    wallet.publicKey,
    connection,
    getUserSOLBalance,
    getUserAccount,
    getPolls,
  ]);

  let categories = {
    "Past Polls": pastPolls,
    "Live Polls": livePolls,
    "Own Polls": onwPolls,
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-24">
      <div className="flex self-start gap-4 md:gap-16 items-start">
        <div className="flex flex-col items-start rounded-md border border-black py-4 px-6 gap-4">
          <div>Score: {score.toFixed(2)}</div>
          <div>
            <div>Balance: {balance.toFixed(4)} SOL</div>
            {balance < 10.5 && <RequestAirdrop />}
          </div>
        </div>
        {isRegistered ? <CreatePoll /> : <RegisterUser />}
      </div>
      <div className="w-full px-2 py-16 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {Object.keys(categories).map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700",
                    selected
                      ? "bg-white shadow"
                      : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {wallet.publicKey !== null ? (
              Object.values(categories).map((polls, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    "rounded-xl bg-white p-3",
                    "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                  )}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {polls.map(async (poll) => {
                      const hasStarted = poll.startSlot.toNumber() > 0;
                      const hasResolved = poll.result !== null;
                      const hexString = createHash("sha256")
                        .update(poll.question, "utf8")
                        .digest("hex");
                      const questionSeed = Uint8Array.from(
                        Buffer.from(hexString, "hex")
                      );

                      let [pollPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from("poll"), questionSeed],
                        programId
                      );

                      let [userScorePda] = PublicKey.findProgramAddressSync(
                        [
                          Buffer.from("user_score"),
                          pollPda.toBuffer(),
                          wallet.publicKey!.toBuffer(),
                        ],
                        programId
                      );
                      const hasCollected =
                        (await connection.getAccountInfo(userScorePda)) ===
                        null;

                      console.log("");

                      return (
                        <div
                          key={poll.question}
                          className="flex flex-col mx-2 border rounded-md p-4"
                        >
                          <div className="h-20">{poll.question}</div>
                          <div className="my-2">
                            Crowd prediction:{" "}
                            {poll.crowdPrediction
                              ? (poll.crowdPrediction / 10000).toFixed(2) + "%"
                              : "-"}
                          </div>

                          {idx === 2 &&
                            (hasStarted ? (
                              hasResolved ? (
                                <div className="text-center p-4 rounded-md border bg-blue-200">
                                  This market has been resolved
                                </div>
                              ) : (
                                <ResolvePoll question={poll.question} />
                              )
                            ) : (
                              <StartPoll question={poll.question} />
                            ))}
                          {idx === 0 &&
                            (hasResolved ? (
                              hasCollected ? (
                                <div>Points collected</div>
                              ) : (
                                <CollectPoints question={poll.question} />
                              )
                            ) : (
                              <div></div>
                            ))}
                        </div>
                        // <li
                        //   key={poll.question}
                        //   className="relative rounded-md p-3 hover:bg-gray-100"
                        // >
                        //   <h3 className="text-sm font-medium leading-5">
                        //     {poll.question}
                        //   </h3>

                        //   {/* <ul className="mt-1 flex space-x-1 text-xs font-normal leading-4 text-gray-500">
                        //   <li>{poll.date}</li>
                        //   <li>&middot;</li>
                        //   <li>{poll.commentCount} comments</li>
                        //   <li>&middot;</li>
                        //   <li>{poll.shareCount} shares</li>
                        // </ul> */}

                        //   <a
                        //     href="#"
                        //     className={classNames(
                        //       "absolute inset-0 rounded-md",
                        //       "ring-blue-400 focus:z-10 focus:outline-none focus:ring-2"
                        //     )}
                        //   />
                        // </li>
                      );
                    })}
                  </div>
                </Tab.Panel>
              ))
            ) : (
              <div className="sm:text-3xl text-center m-12 sm:my-24">
                Please connect your wallet and register.
              </div>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </main>
  );
}
