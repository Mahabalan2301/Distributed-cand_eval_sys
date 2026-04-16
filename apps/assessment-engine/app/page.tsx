"use client";

import { useEffect, useState } from "react";

export default function AssessmentPage() {
  const [status, setStatus] = useState("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
    const validate = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/validate-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });


      const data = await res.json();

      if (res.ok) {
        setUserId(data.userId);
        setApplicationId(data.applicationId);
        setStatus("valid");
      } else {
        setStatus("invalid");
      }

    };

    validate();
  }, []);

  if (!mounted) return <div className="p-10 text-xl">Loading...</div>;

  // 🎯 UI CONTROL
  if (status === "loading") {
    return <h1 className="p-10 text-xl">Checking access...</h1>;
  }

  if (status === "invalid" || status === "error") {
    return (
      <div className="p-10 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-500">❌ Access Denied</h1>
        <p className="text-gray-600">You don't have a valid assessment token or it has expired.</p>
        <a 
          href={`${process.env.NEXT_PUBLIC_PORTAL_URL}/dashboard`}
          className="bg-blue-600 text-white px-4 py-2 rounded w-fit hover:bg-blue-700 transition-colors"
        >
          Go back to Portal
        </a>
      </div>
    );
  }

  if (status === "valid" && userId && applicationId) {
    return <QuestionUI userId={userId} applicationId={applicationId} />;
  }


  return null;
}

function QuestionUI({ userId, applicationId }: { userId: string; applicationId: string }) {

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/questions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setQuestions(data);
    };

    fetchQuestions();

    // 📡 Listen for the score evaluation event
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/assessment/events?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.userId === userId && data.applicationId === applicationId) {
        if (data.status === "success" || data.score !== undefined) {
          setScore(data.score);
          setIsSubmitting(false); // Done!
        } else if (data.status === "error") {
          setIsSubmitting(false);
          alert("Evaluation failed. Please contact support or try again.");
        }
      }
    };


    return () => eventSource.close();
  }, [userId, applicationId, token]);

  const handleSelect = (qId: string, optionIndex: number) => {
    setAnswers({ ...answers, [qId]: optionIndex });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers, userId, applicationId }),
      });

      // The score will arrive via SSE!
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 border-b pb-4">Assessment</h1>

      {questions.map((q) => (
        <div key={q.id} className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-zinc-100">
          <p className="text-lg font-semibold mb-4 text-zinc-800">{q.question}</p>

          <div className="flex flex-col gap-3">
            {q.options.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-50 cursor-pointer transition-colors border border-transparent hover:border-zinc-200">
                <input
                  type="radio"
                  name={q.id}
                  className="w-4 h-4 text-blue-600"
                  onChange={() => handleSelect(q.id, i)}
                />
                <span className="text-zinc-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 flex flex-col gap-6">
        <button
          onClick={handleSubmit}
          className="bg-zinc-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          disabled={isSubmitting || score !== null || Object.keys(answers).length < questions.length}
        >
          {isSubmitting && (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? "Evaluating Your Answers..." : score !== null ? "Assessment Submitted" : "Submit Assessment"}
        </button>

        {score !== null && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Assessment Completed!
            </h2>
            <p className="text-lg text-green-600">
              🎯 Your Final Score: <span className="font-black underline">{score} / {questions.length}</span>
            </p>
            <p className="mt-4 text-zinc-500 text-sm">You can now close this tab and return to the dashboard.</p>
             <a 
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL}/dashboard`}
              className="inline-block mt-4 text-green-700 font-semibold hover:underline"
            >
              ← Back to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
