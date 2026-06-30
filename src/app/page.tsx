"use client";

import { useState } from "react";

type QuizQ = { question: string; options: string[]; answer: string };

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState<QuizQ[]>([]);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      setError("Please add a title and some notes.");
      return;
    }
    setError("");
    setLoading(true);
    setSummary("");
    setQuiz([]);

    try {
      const res = await fetch("/api/process-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSummary(data.summary || "");
      setQuiz(data.quiz || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">📚 StudentOS</h1>
        <p className="text-gray-500 mb-8">Upload your notes — get an instant summary and quiz.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Photosynthesis Notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Content</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 h-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste your study notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Generating summary & quiz..." : "Generate Summary & Quiz"}
          </button>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">📝 Summary</h2>
            <p className="text-gray-700 whitespace-pre-line">{summary}</p>
          </div>
        )}

        {quiz.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🧠 Quiz</h2>
            {quiz.map((q, i) => (
              <div key={i} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                <p className="font-medium text-gray-800 mb-2">{i + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`text-sm px-3 py-1.5 rounded-md border ${
                        opt[0] === q.answer || opt === q.answer
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}