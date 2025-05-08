"use client"; // Required for using hooks like useSession and event handlers

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import React, { useState, ChangeEvent } from "react"; // Added ChangeEvent

export default function HomePage() {
  const { data: session, status } = useSession();
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("Analyze this webpage UI and suggest improvements.");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // New state for Auth State Upload
  const [targetDomain, setTargetDomain] = useState("");
  const [authStateFile, setAuthStateFile] = useState<File | null>(null);
  const [isUploadingAuthState, setIsUploadingAuthState] = useState(false);
  const [uploadAuthError, setUploadAuthError] = useState("");
  const [uploadAuthSuccess, setUploadAuthSuccess] = useState("");

  if (status === "loading" && !session) { // Show loading only if no session yet
    return <p>Loading session...</p>;
  }

  const handleAnalyze = async () => {
    if (!imageUrl || !prompt) {
      setAnalysisError("Image URL and prompt are required.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisResult("");

    try {
      // Basic image type detection (can be improved)
      let mimeType = "image/png";
      if (imageUrl.endsWith(".jpg") || imageUrl.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      } else if (imageUrl.endsWith(".webp")) {
        mimeType = "image/webp";
      } // Add more types if needed

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, prompt, mimeType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Analysis failed");
      }
      setAnalysisResult(data.analysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setAnalysisError(errorMessage);
      console.error("Analysis error:", err);
    }
    setIsAnalyzing(false);
  };

  const handleAuthStateFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAuthStateFile(event.target.files[0]);
      setUploadAuthSuccess("");
      setUploadAuthError("");
    }
  };

  const handleUploadAuthState = async () => {
    if (!targetDomain) {
      setUploadAuthError("Target Domain is required.");
      return;
    }
    if (!authStateFile) {
      setUploadAuthError("Please select an auth state file (.json).");
      return;
    }
    if (authStateFile.type !== "application/json") {
      setUploadAuthError("Invalid file type. Please upload a .json file.");
      return;
    }

    setIsUploadingAuthState(true);
    setUploadAuthError("");
    setUploadAuthSuccess("");

    const formData = new FormData();
    formData.append("targetDomain", targetDomain);
    formData.append("authStateFile", authStateFile);

    try {
      const response = await fetch("/api/upload-auth-state", { // New API endpoint
        method: "POST",
        body: formData, // FormData will set the Content-Type to multipart/form-data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Auth state upload failed");
      }
      setUploadAuthSuccess(data.message || "Auth state uploaded successfully!");
      setTargetDomain(""); // Optionally reset fields
      setAuthStateFile(null);
      // Clear the file input visually (hacky, better with a proper form reset or key change)
      const fileInput = document.getElementById('authStateFile') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during auth state upload.";
      setUploadAuthError(errorMessage);
      console.error("Auth state upload error:", err);
    }
    setIsUploadingAuthState(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-12 md:p-24 space-y-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Page Analyzer App
        </p>
        <div className="fixed bottom-0 left-0 flex h-auto py-4 lg:py-0 lg:h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          {session ? (
            <div className="flex flex-col items-center gap-4">
              {session.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt={session.user.name || "User avatar"} 
                  width={60} // Reduced size slightly
                  height={60} 
                  className="rounded-full"
                />
              )}
              <span>{session.user?.email}</span>
              <button 
                onClick={() => signOut()} 
                className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 text-sm"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>Not signed in</p>
              <button 
                onClick={() => signIn("google")} 
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth State Upload Section */}
      {session && (
        <section className="w-full max-w-2xl bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Upload Target Site Auth State</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="targetDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Domain (e.g., myportal.example.com):
              </label>
              <input 
                type="text" 
                id="targetDomain" 
                value={targetDomain} 
                onChange={(e) => setTargetDomain(e.target.value)} 
                placeholder="myportal.example.com" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="authStateFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Auth State File (storageState.json):
              </label>
              <input 
                type="file" 
                id="authStateFile" 
                accept=".json"
                onChange={handleAuthStateFileChange} 
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700"
              />
            </div>
            <button 
              onClick={handleUploadAuthState} 
              disabled={isUploadingAuthState || !targetDomain || !authStateFile}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isUploadingAuthState ? "Uploading..." : "Upload Auth State"}
            </button>
          </div>
          {uploadAuthError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">Error: {uploadAuthError}</p>}
          {uploadAuthSuccess && <p className="mt-4 text-sm text-green-600 dark:text-green-400">{uploadAuthSuccess}</p>}
        </section>
      )}

      {/* AI Analysis Section - Only show if logged in */} 
      {session && (
        <section className="w-full max-w-2xl bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Analyze Page UI</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL:</label>
              <input 
                type="text" 
                id="imageUrl" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                placeholder="https://example.com/image.png" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt:</label>
              <textarea 
                id="prompt" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                rows={3} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !imageUrl}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Image"}
            </button>
          </div>
          {analysisError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">Error: {analysisError}</p>}
          {analysisResult && (
            <div className="mt-6 p-4 border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-700/50">
              <h3 className="text-lg font-semibold mb-2">Analysis Result:</h3>
              {/* Basic Markdown-like display - can be improved with a library */}
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{analysisResult}</pre>
            </div>
          )}
        </section>
      )}

      {/* Original Next.js welcome content - can be removed or kept for reference */} 
      {!session && (
        <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px] mt-12">
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </div>
      )}
    </main>
  );
}
