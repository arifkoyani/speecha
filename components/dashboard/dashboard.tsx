"use client";

import { useState } from "react";

interface AudioFile {
  fileName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  audioUrl?: string;
  audioBase64?: string;
}

export default function Dashboard() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showToast = (message: string, type: "error" | "success") => {
    if (type === "error") {
      setError(message);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleGenerateVoice = async () => {
    if (!text.trim()) {
      showToast("Please enter text to generate voice", "error");
      return;
    }
    if (!voiceId.trim()) {
      showToast("Please enter a voice ID", "error");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioFile(null);
    setAudioUrl(null);

    try {
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();

      if (data.success && data.file) {
        setAudioFile(data.file);

        // If audio URL is provided, use it directly
        if (data.file.audioUrl) {
          setAudioUrl(data.file.audioUrl);
        }
        // If base64 is provided, convert to blob URL
        else if (data.file.audioBase64) {
          const audioBlob = base64ToBlob(
            data.file.audioBase64,
            data.file.mimeType
          );
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        }
        // If audio blob is in response, handle it
        else if (data.audioBlob) {
          const url = URL.createObjectURL(data.audioBlob);
          setAudioUrl(url);
        }

        showToast("Voice generated successfully!", "success");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed";
      showToast(message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendText = async () => {
    if (!text.trim()) {
      showToast("Please enter text to send", "error");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send text");
      }

      const data = await response.json();
      showToast("Text sent successfully!", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send text";
      showToast(message, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setText("");
    setVoiceId("");
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError(null);
    setSuccess(null);
  };

  const handleDownload = () => {
    if (!audioFile) {
      showToast("No audio file available to download", "error");
      return;
    }

    try {
      let url: string;
      let shouldCleanup = false;

      // If we have a blob URL, use it
      if (audioUrl) {
        url = audioUrl;
      }
      // Otherwise, create blob from base64 if available
      else if (audioFile.audioBase64) {
        const blob = base64ToBlob(audioFile.audioBase64, audioFile.mimeType);
        url = URL.createObjectURL(blob);
        shouldCleanup = true;
      } else {
        showToast("No audio data available to download", "error");
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = audioFile.fileName || "data.mpga";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL if we created it from base64
      if (shouldCleanup) {
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }

      showToast("Download started", "success");
    } catch (err) {
      showToast("Failed to download audio file", "error");
      console.error("Download error:", err);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* Toast Notifications */}
      {error && (
        <div
          className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in"
          role="alert"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
          Awazain - Single by moulana elevenlabs khan khatak
        </h1>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          {/* Textarea */}
          <div>
            <label
              htmlFor="text-input"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Enter Text to Speech
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              placeholder="Type your text here..."
              aria-label="Text to speech input"
            />
          </div>

          {/* Voice ID Input */}
          <div>
            <label
              htmlFor="voice-id"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Voice ID
            </label>
            <input
              id="voice-id"
              type="text"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              placeholder="Enter voice ID"
              aria-label="Voice ID input"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleGenerateVoice}
              disabled={isGenerating}
              className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-teal-500"
              aria-label="Generate voice from text"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Voice"
              )}
            </button>

            <button
              onClick={handleSendText}
              disabled={isSending}
              className="flex-1 min-w-[200px] bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Send text to API"
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Text"
              )}
            </button>

            <button
              onClick={handleClear}
              className="flex-1 min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Clear all inputs and audio"
            >
              Clear
            </button>
          </div>

          {/* Audio Player Section */}
          {audioFile && audioUrl && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4 animate-fade-in">
            
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <audio
                  controls
                  src={audioUrl}
                  className="flex-1 w-full"
                  aria-label="Generated audio player"
                >
                  Your browser does not support the audio element.
                </audio>

                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 whitespace-nowrap"
                  aria-label="Download audio file"
                >
                  Download Voice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

