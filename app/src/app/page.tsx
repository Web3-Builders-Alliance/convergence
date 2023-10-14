import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-start px-4 sm:px-24 lg:px-48 py-24">
      <div>
        <div className="text-2xl sm:text-5xl ">
          Individually, we are one drop. Together, we are an ocean.
        </div>
        <div className="mt-2">– Ryunosuke Satoro</div>
      </div>
      <div className="mt-8 text-lg sm:text-xl">
        <span className="text-[#E8A4CD]">Convergence</span> is a prediction poll
        that leverages the{" "}
        <span className="text-[#4CA7AE]">collective wisdom</span> of its users
        to make predictions about future events. It aims to be{" "}
        <span className="text-[#FDA245]">collaborative</span> rather than
        competitive, encouraging users to share their insights and reasoning
        behind their predictions.{" "}
      </div>
      <div className="mt-8 text-lg sm:text-xl">
        Connect your wallet and register on the{" "}
        <Link href="/profile">
          {" "}
          <span className="text-[#4CA7AE]">profile page</span>
        </Link>
        . This will create a PDA that enables you to{" "}
        <span className="text-[#E8A4CD]">
          participate on polls or to create your own polls
        </span>
        . Your prediction is weighted by your{" "}
        <span className="text-[#FDA245]">score and your certainty</span>. You
        maximize your expected score if you predict the true probability, i.e.
        if you predict the probability of a fair coin flip you would maximize
        your expected score by predicting 50%.
      </div>
    </main>
  );
}
