"use client";

import { ChangeEvent, useEffect, useState } from "react";

const DEFAULT_PROMPT =
  "Convert this photo into a realistic oil painting with rich brush strokes, warm lighting, and gallery-quality detail.";

export default function AIPaintingStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResultUrl(null);

    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);

    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please choose a photo to convert.");
      return;
    }

    setGenerating(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);

      const response = await fetch("/api/ai-painting/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate the oil painting preview.");
      }

      if (!data?.imageDataUrl) {
        throw new Error("The AI backend did not return an image.");
      }

      setResultUrl(data.imageDataUrl);
    } catch (generationError: any) {
      setError(generationError?.message || "Unable to generate the artwork.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-6 py-10 text-[#1a1614]">
      <div className="rounded-3xl border border-[#eadfcb] bg-[#fffaf2] p-8 shadow-sm shadow-[#7b62576d]/20">
        <h1 className="text-4xl font-bold tracking-[0.04em] text-[#3e322a]">
          AI Oil Painting Studio
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#5c4f45]">
          Upload your photo and let AI convert it into an oil painting preview using
          <strong> OpenAI DALL-E 3</strong>.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-[#eadfcb] bg-white p-8 shadow-sm shadow-[#7b62576d]/10">
          <div>
            <label className="block text-sm font-semibold text-[#6b5d54]">Source photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-3 block w-full rounded-2xl border border-[#d4c7ad] bg-[#fffaf2] px-4 py-3 text-sm text-[#1a1614] shadow-sm outline-none transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#6b5d54]">Art direction</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              className="mt-3 w-full resize-none rounded-2xl border border-[#d4c7ad] bg-[#fffaf2] px-4 py-3 text-sm text-[#1a1614] shadow-sm outline-none transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/30"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center rounded-2xl bg-[#d4a574] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b88d4d] disabled:cursor-not-allowed disabled:bg-[#e6d7b4]"
          >
            {generating ? "Generating…" : "Generate Oil Painting"}
          </button>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-3xl border border-[#eadfcb] bg-[#fffaf2] p-6">
            <h2 className="text-lg font-semibold text-[#3e322a]">How it works</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#5c4f45]">
              <li>1. Upload a photo from your device.</li>
              <li>2. DALL-E transforms it into an oil painting preview.</li>
              <li>3. Save the image or continue with the rest of your site flow.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6 rounded-3xl border border-[#eadfcb] bg-white p-8 shadow-sm shadow-[#7b62576d]/10">
          <div className="rounded-3xl border border-[#e9dfcf] bg-[#fffaf2] p-6">
            <h2 className="text-lg font-semibold text-[#3e322a]">Preview</h2>
            <p className="mt-3 text-sm leading-6 text-[#5c4f45]">
              Your source photo and the generated oil painting will appear here.
            </p>
          </div>

          <div className="grid gap-6">
            {previewUrl ? (
              <div className="overflow-hidden rounded-3xl border border-[#eadfcb] bg-[#fbf7f0]">
                <p className="border-b border-[#eadfcb] bg-[#f7f1e4] px-5 py-4 text-sm font-semibold text-[#6b5d54]">
                  Source photo
                </p>
                <img src={previewUrl} alt="Source photo preview" className="h-full w-full object-contain" />
              </div>
            ) : null}

            {resultUrl ? (
              <div className="overflow-hidden rounded-3xl border border-[#eadfcb] bg-[#fbf7f0]">
                <p className="border-b border-[#eadfcb] bg-[#f7f1e4] px-5 py-4 text-sm font-semibold text-[#6b5d54]">
                  AI oil painting preview
                </p>
                <img src={resultUrl} alt="Generated oil painting" className="h-full w-full object-contain" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
