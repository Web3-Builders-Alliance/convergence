import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Convergence } from "../target/types/convergence";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const confirmTx = async (signature: string) => {
  const latestBlockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    "confirmed"
  );
  return signature;
};

describe("convergence", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Convergence as Program<Convergence>;

  const precision = 4;

  const question = "First question";
  const description = "Describe exactly when it will resolve to true";
  const startTime = new Date().getTime();
  const endTime = startTime + 1000 * 60 * 60 * 24 * 7;

  const prediction = 456;
  const secondPrediction = 99;
  const updatedSecondPrediction = 500;

  const secondUser = Keypair.generate();

  it("prefunds payer wallet with sol and spl token", async () => {
    const solAmount = 10 * LAMPORTS_PER_SOL;
    await program.provider.connection
      .requestAirdrop(secondUser.publicKey, solAmount)
      .then(confirmTx);
    const solBalance = await program.provider.connection.getBalance(
      secondUser.publicKey
    );

    expect(solBalance).to.eq(solAmount, "Wrong sol amount");
  });

  it("creates poll!", async () => {
    let [pollAddress, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

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
  });

  it("makes a prediction!", async () => {
    let [pollAddress, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), program.provider.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .makePrediction(prediction - 14, prediction + 14)
      .accounts({ poll: pollAddress, userPrediction: predictionAddress })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );

    expect(predictionAccount.lowerPrediction).to.eq(
      prediction - 14,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      prediction + 14,
      "Wrong prediction."
    );
    expect(pollAccount.crowdPrediction).to.eq(
      10 ** precision * prediction,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numPredictions.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
  });

  it("updates crowd prediction when user makes prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), secondUser.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .makePrediction(secondPrediction - 22, secondPrediction + 22)
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
      })
      .signers([secondUser])
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );

    expect(predictionAccount.lowerPrediction).to.eq(
      secondPrediction - 22,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      secondPrediction + 22,
      "Wrong prediction."
    );
    expect(predictionAccount.bump).to.eq(predictionBump, "Wrong bump.");
    expect(pollAccount.crowdPrediction).to.eq(
      Math.floor(
        (10 ** precision * prediction + 10 ** precision * secondPrediction) / 2
      ),
      "Wrong crowd prediction."
    );
    expect(pollAccount.numPredictions.toString()).to.eq(
      "2",
      "Wrong number of predictions."
    );
  });

  it("updates crowd prediction when user updates own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), secondUser.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .updatePrediction(updatedSecondPrediction, updatedSecondPrediction)
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
      })
      .signers([secondUser])
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );

    expect(predictionAccount.lowerPrediction).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(pollAccount.crowdPrediction).to.eq(
      Math.floor(
        (10 ** precision * prediction +
          10 ** precision * updatedSecondPrediction) /
          2
      ),
      "Wrong crowd prediction."
    );
    expect(pollAccount.numPredictions.toString()).to.eq(
      "2",
      "Wrong number of predictions."
    );
  });

  it("updates crowd prediction when user removes own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), secondUser.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .removePrediction()
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
      })
      .signers([secondUser])
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);

    expect(pollAccount.crowdPrediction).to.eq(
      10 ** precision * prediction,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numPredictions.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
  });

  it("removes crowd prediction when every user removes own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), program.provider.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .removePrediction()
      .accounts({
        forecaster: program.provider.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);

    expect(pollAccount.crowdPrediction).to.eq(null, "Wrong crowd prediction.");
    expect(pollAccount.numPredictions.toString()).to.eq(
      "0",
      "Wrong number of predictions."
    );
  });

  it("can make again a prediction after removing it!", async () => {
    let [pollAddress, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [predictionAddress, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_prediction"), program.provider.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .makePrediction(prediction - 25, prediction + 25)
      .accounts({ poll: pollAddress, userPrediction: predictionAddress })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );

    expect(predictionAccount.lowerPrediction).to.eq(
      prediction - 25,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      prediction + 25,
      "Wrong prediction."
    );
    expect(pollAccount.crowdPrediction).to.eq(
      10 ** precision * prediction,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numPredictions.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
  });
});
