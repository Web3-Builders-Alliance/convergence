"use client";

import { Convergence, IDL } from "@/idl/convergence_idl";
import { Poll } from "@/types/program_types";
import { programId } from "@/utils/anchor";
import { Idl, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function PollDetails({ params }: { params: { id: string } }) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [poll, setPoll] = useState<Poll | null>(null);

  useEffect(() => {
    const getPoll = async () => {
      if (!publicKey) return;

      const program = new Program(
        IDL as Idl,
        programId
      ) as unknown as Program<Convergence>;

      const [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), Uint8Array.from(Buffer.from(params.id, "hex"))],
        programId
      );

      const pollAccount = await program.account.poll.fetch(pollPda);
      setPoll(pollAccount);
    };
    getPoll();
  }, [params.id, publicKey]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24 gap-12">
      <div className="font-bold text-3xl">{poll?.question}</div>
      <div>{poll?.description}</div>
    </main>
  );
}
