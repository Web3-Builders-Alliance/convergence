import { Convergence, IDL } from "@/idl/convergence_idl";
import { programId } from "@/utils/anchor";
import { Idl, Program } from "@coral-xyz/anchor";
import { Dialog, Transition } from "@headlessui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { createHash } from "crypto";
import { FC, Fragment, useCallback, useState } from "react";
import toast from "react-hot-toast";

export const CreatePoll: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(true);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");

  const closeModal = () => {
    setIsOpen(false);
    setQuestion("");
    setDescription("");
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const onClick = useCallback(async () => {
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

    let signature: TransactionSignature = "";
    try {
      const registerUserInstruction = await program.methods
        .createPoll(question, description, null)
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
    } catch (error: any) {
      toast.error("Transaction failed!: " + error?.message);
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    } finally {
      closeModal();
    }
  }, [publicKey, connection, sendTransaction, description, question]);

  return (
    <>
      <button
        type="button"
        className="shadow rounded-md px-6 py-4 bg-blue-400 hover:brightness-110 hover:cursor-pointer"
        onClick={openModal}
      >
        Create Poll
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Create your own poll
                  </Dialog.Title>
                  <div className="flex flex-col gap-4 mt-8">
                    <label
                      htmlFor="Question"
                      className="relative block rounded-md border border-gray-200 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                    >
                      <input
                        type="text"
                        id="Question"
                        className="w-full peer border-none bg-transparent placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0"
                        placeholder="Question"
                        maxLength={120}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />

                      <span className="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white p-0.5 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs">
                        Question
                      </span>
                    </label>

                    <label
                      htmlFor="Description"
                      className="relative block rounded-md border border-gray-200 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                    >
                      <textarea
                        id="Description"
                        className="w-full peer border-none bg-transparent placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0"
                        placeholder="Description"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />

                      <span className="pointer-events-none absolute start-2.5 -translate-y-1/2 bg-white p-0.5 text-xs text-gray-700 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs">
                        Description
                      </span>
                    </label>
                  </div>
                  <div className="flex justify-between">
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={onClick}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
