import type { Metadata } from "next";
import AIPaintingStudio from "@/components/ai/AIPaintingStudio";

export const metadata: Metadata = {
  title: "AI Painting Studio | Oil Painting",
  description: "Convert your photos into oil paintings with AI-powered style transfer.",
};

export default function AIPaintingPage() {
  return <AIPaintingStudio />;
}
