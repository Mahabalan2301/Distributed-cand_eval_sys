"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
    }
  }, []);

const handleStart = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/start-assessment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ important
    },
  });

  const data = await res.json();

  // ✅ redirect with token in URL
  router.push(`/assessment?token=${data.token}`);
};

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-2xl font-bold">
        Dashboard ✅ Login Successful
      </h1>

      <button
        onClick={handleStart}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Start Assessment
      </button>
    </div>
  );
}