"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";

require("@solana/wallet-adapter-react-ui/styles.css");

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (wallet) {
      const provider = new AnchorProvider(connection, wallet, {});
      setProvider(provider);
    }
  }, [wallet, connection]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="md:flex md:items-center md:gap-12">
            <Link className="flex gap-4 items-center text-gray-700" href="/">
              <span className="sr-only">Home</span>
              <div className="hidden sm:block md:text-lg lg:text-2xl">
                Convergence
              </div>
              <Image
                src="/logoipsum-275.svg"
                alt="Logo"
                className="md:block dark:invert"
                width={64}
                height={64}
                priority
              />
            </Link>
          </div>

          <div className="hidden md:block">
            <nav aria-label="Global">
              <ul className="flex items-center gap-16 text-sm">
                <li>
                  <Link
                    className="text-gray-500 transition hover:text-gray-500/75 text-lg"
                    href="/polls"
                  >
                    Polls
                  </Link>
                </li>

                <li>
                  <Link
                    className="text-gray-500 transition hover:text-gray-500/75 text-lg"
                    href="/profile"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* <div className="sm:flex sm:gap-4"> */}
            <WalletMultiButtonDynamic className="text-lg mr-6 bg-red-500 hover:bg-green-600" />
            {/* </div> */}

            <div className="block md:hidden">
              <button
                className="rounded bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75"
                onClick={toggleMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`block md:hidden transition-height duration-700 ease-in-out overflow-hidden border border-t ${
          isMenuOpen ? "h-20" : "h-0"
        }`}
      >
        <nav aria-label="Global">
          <ul className="flex flex-col items-center gap-4 text-sm py-1">
            <li>
              <Link
                className="text-gray-500 transition hover:text-gray-500/75 text-lg"
                href="/polls"
              >
                Polls
              </Link>
            </li>

            <li>
              <Link
                className="text-gray-500 transition hover:text-gray-500/75 text-lg"
                href="/profile"
              >
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
