import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Convergence } from "../target/types/convergence";
import { expect, use } from "chai";
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

  const prediction = 46;
  const secondPrediction = 10;
  const updatedSecondPrediction = 50;

  const uncertainty1 = 0;
  const uncertainty2 = 0;

  const secondUser = Keypair.generate();

  it("pre-funds payer wallet with sol and spl token", async () => {
    const solAmount = 100 * LAMPORTS_PER_SOL;
    await program.provider.connection
      .requestAirdrop(secondUser.publicKey, solAmount)
      .then(confirmTx);
    const solBalance = await program.provider.connection.getBalance(
      secondUser.publicKey
    );

    expect(solBalance).to.eq(solAmount, "Wrong sol amount");
  });

  it("registers user!", async () => {
    let [user1Address, bump1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );
    let [user2Address, bump2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.registerUser().accounts({ user: user1Address }).rpc();
    await program.methods
      .registerUser()
      .accounts({ payer: secondUser.publicKey, user: user2Address })
      .signers([secondUser])
      .rpc();

    const user1Account = await program.account.user.fetch(user1Address);
    const user2Account = await program.account.user.fetch(user2Address);

    expect(user1Account.score).to.eq(100.0);
    expect(user1Account.bump).to.eq(bump1);
    expect(user2Account.score).to.eq(100.0);
    expect(user2Account.bump).to.eq(bump2);
  });

  it("creates poll!", async () => {
    let [pollAddress, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [scoringListAddress, scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    await program.methods
      .createPoll(question, description, new anchor.BN(endTime))
      .accounts({ poll: pollAddress, scoringList: scoringListAddress })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    expect(pollAccount.question).to.eq(question, "Wrong question.");
    expect(pollAccount.description).to.eq(description, "Wrong description");
    expect(pollAccount.startSlot.toString()).to.eq("0");
    expect(pollAccount.endTime.toString()).to.eq(endTime.toString());
    expect(pollAccount.numForecasters.toString()).to.eq("0");
    expect(pollAccount.numPredictionUpdates.toString()).to.eq("0");
    expect(pollAccount.crowdPrediction).to.eq(null);
    expect(pollAccount.accumulatedWeights).to.eq(0.0);
    expect(pollAccount.bump).to.eq(pollBump);
    expect(scoringAccount.options.length).to.eq(101, "Wrong array length");
    expect(scoringAccount.lastSlot.toString()).to.eq("0", "Wrong slot");
    expect(scoringAccount.bump).to.eq(scoringBump);
  });

  it("starts poll!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    await program.methods
      .startPoll()
      .accounts({ poll: pollAddress, scoringList: scoringListAddress })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    const currentSlot = await program.provider.connection.getSlot();
    expect(pollAccount.startSlot.toString()).to.eq(
      currentSlot.toString(),
      "Wrong slot."
    );
    expect(scoringAccount.options.length).to.eq(101, "Wrong array length");
    expect(scoringAccount.lastSlot.toString()).to.eq(
      currentSlot.toString(),
      "Wrong slot."
    );
  });

  it("makes a prediction!", async () => {
    let [pollAddress, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );

    let [userAddress, _userBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    let [userPredictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    // console.log("User score making", pollAddress);

    await program.methods
      .makePrediction(prediction - uncertainty1, prediction + uncertainty1)
      .accounts({
        user: userAddress,
        poll: pollAddress,
        userPrediction: userPredictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollAddress);
    const userAccount = await program.account.user.fetch(userAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      userPredictionAddress
    );
    const updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    ); // need to write tests for this

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "1",
      "Wrong number of prediction updates."
    );
    expect(predictionAccount.lowerPrediction).to.eq(
      prediction - uncertainty1,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      prediction + uncertainty1,
      "Wrong prediction."
    );
    expect(pollAccount.crowdPrediction).to.eq(
      10 ** precision * prediction,
      "Wrong crowd prediction."
    );
    expect(pollAccount.accumulatedWeights).to.eq(
      (1 - (2 * uncertainty1) / 100) * userAccount.score,
      "Wrong accumulated weights"
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.eq(
      10 ** precision * prediction,
      "Wrong prediction stored."
    );
  });

  it("updates crowd prediction when user makes prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollAddress);

    let [user1Address, _user1Bump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), program.provider.publicKey.toBuffer()],
        program.programId
      );

    let [user2Address, _user2Bump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), secondUser.publicKey.toBuffer()],
        program.programId
      );

    let [predictionAddress, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .makePrediction(
        secondPrediction - uncertainty2,
        secondPrediction + uncertainty2
      )
      .accounts({
        forecaster: secondUser.publicKey,
        user: user2Address,
        poll: pollAddress,
        userPrediction: predictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollAddress);
    const user1Account = await program.account.user.fetch(user1Address);
    const user2Account = await program.account.user.fetch(user2Address);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );
    const updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    const weight1 = (1 - (2 * uncertainty1) / 100) * user1Account.score;
    const weight2 = (1 - (2 * uncertainty2) / 100) * user2Account.score;

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "2",
      "Wrong number of prediction updates."
    );
    expect(predictionAccount.lowerPrediction).to.eq(
      secondPrediction - uncertainty2,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      secondPrediction + uncertainty2,
      "Wrong prediction."
    );
    expect(pollAccount.accumulatedWeights).to.eq(
      weight1 + weight2,
      "Wrong accumulated weights"
    );
    expect(predictionAccount.bump).to.eq(predictionBump, "Wrong bump.");
    expect(pollAccount.crowdPrediction).to.eq(
      Math.floor(
        (weight1 * 10 ** precision * prediction +
          weight2 * 10 ** precision * secondPrediction) /
          (weight1 + weight2)
      ),
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "2",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.eq(
      Math.floor(
        (weight1 * 10 ** precision * prediction +
          weight2 * 10 ** precision * secondPrediction) /
          (weight1 + weight2)
      ),
      "Wrong prediction stored."
    );
    expect(scoringAccount.cost[prediction]).to.eq(0, "Wrong cost.");
    expect(scoringAccount.cost[prediction + 1]).to.be.greaterThan(
      0,
      "Wrong cost."
    );
    expect(scoringAccount.cost[prediction - 1]).to.be.lessThan(
      0,
      "Wrong cost."
    );
  });

  it("updates crowd prediction when user updates own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollAddress);

    let [user1Address, _user1Bump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), program.provider.publicKey.toBuffer()],
        program.programId
      );

    let [user2Address, _user2Bump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), secondUser.publicKey.toBuffer()],
        program.programId
      );

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .updatePrediction(updatedSecondPrediction, updatedSecondPrediction)
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollAddress);
    const user1Account = await program.account.user.fetch(user1Address);
    const user2Account = await program.account.user.fetch(user2Address);
    const weight1 = (1 - (2 * uncertainty1) / 100) * user1Account.score;
    const weight2 = user2Account.score;

    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );
    const updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "3",
      "Wrong number of prediction updates."
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
        (weight1 * 10 ** precision * prediction +
          weight2 * 10 ** precision * updatedSecondPrediction) /
          (weight1 + weight2)
      ),
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "2",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.eq(
      Math.floor(
        (weight1 * 10 ** precision * prediction +
          weight2 * 10 ** precision * updatedSecondPrediction) /
          (weight1 + weight2)
      ),
      "Wrong prediction stored."
    );
  });

  it("updates crowd prediction when user removes own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollAddress);

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .removePrediction()
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollAddress);
    let updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "4",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.crowdPrediction).to.approximately(
      10 ** precision * prediction,
      5,
      "Wrong crowd prediction."
    );
    expect(pollAccount.accumulatedWeights).to.eq(
      (1 - (2 * uncertainty1) / 100) * 100.0,
      "Wrong accumulated weights."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.approximately(
      10 ** precision * prediction,
      5,
      "Wrong prediction stored."
    );
  });

  it("removes crowd prediction when every user removes own prediction!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollAddress);

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .removePrediction()
      .accounts({
        forecaster: program.provider.publicKey,
        poll: pollAddress,
        userPrediction: predictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .rpc();

    pollAccount = await program.account.poll.fetch(pollAddress);
    let updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    // console.log("Scoring", scoringAccount);

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "5",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.crowdPrediction).to.eq(null, "Wrong crowd prediction.");
    expect(pollAccount.accumulatedWeights).to.eq(
      0.0,
      "Wrong accumulated weights."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "0",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.eq(null, "Wrong prediction stored.");
  });

  it("can make again a prediction after removing it!", async () => {
    let [pollAddress, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(question)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollAddress);

    let [userAddress, _userBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    let [predictionAddress, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [predictionUpdateAddress, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("prediction_update"),
          pollAddress.toBuffer(),
          pollAccount.numPredictionUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollAddress.toBuffer()],
        program.programId
      );

    let [userScoreAddress, userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollAddress.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );
    // console.log("User score making again", pollAddress);

    await program.methods
      .makePrediction(prediction - uncertainty2, prediction + uncertainty2)
      .accounts({
        user: userAddress,
        poll: pollAddress,
        userPrediction: predictionAddress,
        predictionUpdate: predictionUpdateAddress,
        scoringList: scoringListAddress,
        userScore: userScoreAddress,
      })
      .rpc();

    pollAccount = await program.account.poll.fetch(pollAddress);
    const predictionAccount = await program.account.userPrediction.fetch(
      predictionAddress
    );
    const updateAccount = await program.account.predictionUpdate.fetch(
      predictionUpdateAddress
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    // console.log("Scoring", scoringAccount);

    expect(pollAccount.numPredictionUpdates.toString()).to.eq(
      "6",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.accumulatedWeights).to.eq(
      (1 - (2 * uncertainty2) / 100) * 100.0,
      "Wrong accumulated weights."
    );
    expect(predictionAccount.lowerPrediction).to.eq(
      prediction - uncertainty2,
      "Wrong prediction."
    );
    expect(predictionAccount.upperPrediction).to.eq(
      prediction + uncertainty2,
      "Wrong prediction."
    );
    expect(pollAccount.crowdPrediction).to.eq(
      10 ** precision * prediction,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.prediction).to.eq(
      10 ** precision * prediction,
      "Wrong prediction stored."
    );
  });
});
