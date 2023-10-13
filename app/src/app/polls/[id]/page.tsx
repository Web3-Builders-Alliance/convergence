"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Convergence, IDL } from "@/idl/convergence_idl";
import { Poll } from "@/types/program_types";
import { programId } from "@/utils/anchor";
import { BN, Idl, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from "react";

type Update = {
  timestamp: number;
  prediction: number | null;
};

type PredictionData = {
  name: Date;
  data: number | null;
};

export default function PollDetails({ params }: { params: { id: string } }) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [data, setData] = useState<PredictionData[]>([]);

  const datax = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: "Page C",
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: "Page D",
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: "Page E",
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: "Page F",
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: "Page G",
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

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

    const getPredictionUpdates = async () => {
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

      let updateArray: Update[] = [];
      for (let i = 0; i < pollAccount.numPredictionUpdates.toNumber(); i++) {
        const [updatePda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("prediction_update"),
            pollPda.toBuffer(),
            new BN(i).toArrayLike(Buffer, "le", 8),
          ],
          programId
        );

        const updateAccount = await program.account.predictionUpdate.fetch(
          updatePda
        );

        updateArray.push({
          timestamp: updateAccount.timestamp.toNumber(),
          prediction: updateAccount.prediction,
        });
      }

      let today = new Date().getTime();
      for (let i = 0; i < updateArray.length - 1; i++) {
        const time = updateArray[i].timestamp;
        const prediction = updateArray[i].prediction;

        const nextTime = updateArray[i + 1].timestamp;
        for (let j = 0; j < nextTime - time; j = j + 60) {
          setData((data) => [
            ...data,
            {
              name: new Date((time + j) * 1000).toLocaleString(),
              prediction: prediction !== null ? prediction / 10000 : null,
            } as unknown as PredictionData,
          ]);
        }
      }
      const lastTimestamp = updateArray[updateArray.length - 1].timestamp;
      const lastPrediction = updateArray[updateArray.length - 1].prediction;
      for (let k = 0; k < today / 1000 - lastTimestamp; k = k + 60) {
        setData((data) => [
          ...data,
          {
            name: new Date((lastTimestamp + k) * 1000).toLocaleString(),
            prediction: lastPrediction !== null ? lastPrediction / 10000 : null,
          } as unknown as PredictionData,
        ]);
      }
    };
    getPoll();
    getPredictionUpdates();
  }, [params.id, publicKey]);

  return (
    <main className="flex flex-col min-h-screen items-center justify-start p-4 sm:p-24 gap-12">
      <div className="font-bold text-3xl">{poll?.question}</div>
      <div>{poll?.description}</div>
      <div className="font-bold text-xl">Crowd Prediction</div>
      <div className="bg-blue-200 h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis height={100} />
            <Tooltip />
            {/* <Legend /> */}
            <Line
              dot={false}
              type="linear"
              dataKey="prediction"
              stroke="#5F96E8"
              // activeDot={{ r: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
