"use client";

import usePollStore from "@/stores/usePollStore";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import PollCard from "./PollCard";

export default function Polls() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const { getPolls, allPolls } = usePollStore();

  useEffect(() => {
    getPolls(wallet.publicKey);
  }, [wallet.publicKey, connection, getPolls]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-24">
      {wallet.publicKey === null && (
        <div className="text-3xl self-center">
          Please connect your wallet and register on the profile page!
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {allPolls
          .filter((poll) => poll.open)
          .map((poll) => {
            return <PollCard key={poll.question} poll={poll} />;
          })}
      </div>
    </main>
  );
}
