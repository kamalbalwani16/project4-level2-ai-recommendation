"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getRecommendations = async () => {
    if (!query.trim()) {
      setError("Please enter what you are looking for.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-xl font-bold">
            <span className="text-blue-400">AI</span> Recommender
          </div>

          <div className="hidden text-sm text-gray-400 sm:block">
            Personalized recommendations powered by Gemini
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-20">
        <div className="mx-auto max-w-4xl text-center">

          <div className="mb-6 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            ✨ AI-Powered Recommendations
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Find Your
            <span className="block text-blue-500">
              Perfect Choice
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Tell us what you are looking for and let AI discover
            recommendations tailored to your needs.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl sm:flex-row">

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") getRecommendations();
              }}
              placeholder="Try: Best laptops for coding under 80000"
              className="flex-1 rounded-xl bg-slate-900 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={getRecommendations}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-8 py-4 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Get Recommendations"}
            </button>

          </div>

          {/* Quick examples */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              "Coding laptops",
              "Action movies",
              "Travel destinations",
              "Gaming headphones",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-blue-500/50 hover:text-blue-400"
              >
                {example}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </div>
      </section>

      {/* Loading */}
      {loading && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />

            <h2 className="text-xl font-semibold">
              Finding the best options...
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Gemini AI is analyzing your request.
            </p>
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Personalized Results
              </p>

              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Your Recommendations
              </h2>

              <p className="mt-2 text-gray-400">
                Based on:{" "}
                <span className="text-blue-400">{query}</span>
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

              {recommendations.map((item, index) => (
                <article
                  key={index}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.07]"
                >

                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 font-bold text-blue-400">
                      {index + 1}
                    </div>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                      AI Match
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold transition group-hover:text-blue-400">
  {item.name}
</h3>

<p className="mt-2 text-lg font-bold text-green-400">
  {item.price}
</p>

<p className="mt-3 leading-7 text-gray-400">
  {item.description}
</p>
                  <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Why we recommend it
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.reason}
                    </p>
                  </div>

                </article>
              ))}

            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {!recommendations.length && !loading && (
        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-2xl">🤖</div>
              <h3 className="mt-4 font-bold">AI Powered</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Get intelligent recommendations generated by Gemini AI.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-2xl">🎯</div>
              <h3 className="mt-4 font-bold">Personalized</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Recommendations are based on exactly what you ask for.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-2xl">⚡</div>
              <h3 className="mt-4 font-bold">Simple & Fast</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Enter your requirement and discover useful options instantly.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-500">
        AI Recommender • Built with Next.js & Gemini
      </footer>

    </main>
  );
}