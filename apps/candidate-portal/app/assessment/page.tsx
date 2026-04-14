"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Assessment() {
  const [status, setStatus] = useState("loading");
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        return;
      }

      const res = await fetch("http://localhost:5000/validate-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    };

    validate();
  }, []);

  // 🎯 UI CONTROL
  if (status === "loading") {
    return <h1 className="p-10">Checking access...</h1>;
  }

  if (status === "invalid") {
    return (
      <div className="p-10">
        <h1 className="text-red-500">❌ Access Denied</h1>
        <button onClick={() => router.push("/dashboard")}>
          Go back
        </button>
      </div>
    );
  }

  if (status === "valid") {
  return <QuestionUI />;
}
function QuestionUI() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch("http://localhost:5000/questions");
      const data = await res.json();
      setQuestions(data);
    };

    fetchQuestions();
  }, []);

  const handleSelect = (qId: string, optionIndex: number) => {
    setAnswers({ ...answers, [qId]: optionIndex });
  };

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:5000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    const data = await res.json();
    setScore(data.score);
  };

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Assessment</h1>

      {questions.map((q) => (
        <div key={q.id} className="mb-6">
          <p className="font-semibold">{q.question}</p>

          {q.options.map((opt: string, i: number) => (
            <label key={i} className="block">
              <input
                type="radio"
                name={q.id}
                onChange={() => handleSelect(q.id, i)}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2"
      >
        Submit
      </button>

      {score !== null && (
        <h2 className="mt-4 text-lg">
          🎯 Your Score: {score} / {questions.length}
        </h2>
      )}
    </div>
  );
}
}