"use client";

import usePollStore from "@/stores/usePollStore";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import PollCard from "./PollCard";

export default function Polls() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const { getPolls, livePolls } = usePollStore();

  useEffect(() => {
    getPolls(wallet.publicKey);
  }, [wallet.publicKey, connection, getPolls]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {livePolls.map((poll) => {
          return <PollCard key={poll.question} poll={poll} />;
        })}
      </div>
    </main>
  );
}
