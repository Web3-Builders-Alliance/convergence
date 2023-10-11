import { Program, AnchorProvider, Idl, setProvider } from "@coral-xyz/anchor";
import { IDL, Convergence } from "../idl/convergence_idl";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

// Create a connection to the devnet cluster
export const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
});

// Create a placeholder wallet to set up AnchorProvider
// const wallet = new NodeWallet(Keypair.generate());

// // Create an Anchor provider
// const provider = new AnchorProvider(connection, wallet, {});

// // Set the provider as the default provider
// setProvider(provider);

// // Convergence program ID
export const programId = new PublicKey(
  "4irSQbid9JUAkhUf5yhnx5o3EgaY3saAErK9oQtPURHo"
);

// export const program = new Program(
//   IDL as Idl,
//   programId
// ) as unknown as Program<Convergence>;

// PDA
// export const [Account] = PublicKey.findProgramAddressSync(
//   [seed],
//   programId
// );
