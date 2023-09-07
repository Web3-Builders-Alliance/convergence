import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Convergence } from "../target/types/convergence";
import { expect } from "chai";

describe("convergence", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Convergence as Program<Convergence>;

  it("creates poll!", async () => {
    const question = "First question";
    const description = "Describe when it will resolve to true";
    const startTime = new Date().getTime();
    const endTime = startTime + 1000 * 60 * 60 * 24 * 7;

    let [pollAddress, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    console.log("Pll", pollAddress);

    await program.methods
      .createPoll(
        question,
        description,
        new anchor.BN(startTime),
        new anchor.BN(endTime)
      )
      .accounts({ poll: pollAddress })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);

    expect(pollAccount.question).to.eq(question, "Wrong question.");
    expect(pollAccount.description).to.eq(description, "Wrong description");
    expect(pollAccount.startTime.toString()).to.eq(startTime.toString());
    expect(pollAccount.endTime.toString()).to.eq(endTime.toString());
    expect(pollAccount.numPredictions.toString()).to.eq("0");
    expect(pollAccount.crowdPrediction).to.eq(null);
    expect(pollAccount.bump).to.eq(bump);

    expect;
  });
});
