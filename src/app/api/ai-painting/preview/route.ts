import { NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toFile } from "openai";

const OPENAI_MODEL = "gpt-image-1";

// Professional oil painting prompts per style
const STYLE_PROMPTS: Record<string, string> = {
  monet: `Transform this photograph into a luminous Impressionist oil painting in the style of Claude Monet.
Use soft, feathery brushstrokes that blend atmospheric light and shadow seamlessly.
Apply a warm, golden palette with hazy reflections, pastel pinks, lilacs, and sky blues.
Create painterly depth through layered color washes rather than hard edges.
Give the canvas the texture of thick impasto oil paint with clearly visible, expressive brushwork.
The result should look like a gallery-quality museum painting.`,

  cezanne: `Convert this photograph into a Post-Impressionist oil painting masterfully inspired by Paul Cézanne.
Use structured, deliberate brushstrokes that build three-dimensional form through modulated color planes.
Apply an earthy palette of warm ochres, muted greens, dusty oranges, and terracotta reds.
Emphasize the geometric underlying architecture of the scene through repeated, overlapping paint marks.
Include subtle distortions of perspective and the composed, analytical character of Cézanne's studio style.
The surface should have rich, tactile oil paint texture with visible directionality.`,

  vangogh: `Reimagine this photograph as a dramatic Expressionist oil painting in the unmistakable style of Vincent van Gogh.
Use bold, swirling, energetic brushstrokes that convey intense movement, emotion, and inner life.
Apply saturated, heightened colors — deep prussian blues, cadmium yellows, viridian greens, and burnt siennas.
Outline forms with dark, emphatic contour strokes in the manner of cloisonnism.
Create a dynamic, turbulent surface with thick impasto paint and clearly directional, rhythmic strokes.
The final result must feel emotionally charged, vivid, and unmistakably hand-painted.`,

  ukiyoe: `Convert this photograph into a refined Japanese Ukiyo-e woodblock print-inspired oil painting.
Use flat, luminous color areas bounded by clean, elegant contour lines in the floating world tradition.
Apply a refined palette of vermilion, indigo, ochre, sumi black, and ivory with decorative pattern work.
Create a graceful two-dimensional aesthetic with strong compositional balance and exquisite detail.
Incorporate subtle textile-like textures, cloud formations, or wave motifs appropriate to the subject.
The painting should feel both serene and graphic, evoking the refined aesthetics of Hiroshige and Hokusai.`,
};

const DEFAULT_STYLE = "monet";

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse("OpenAI API key is not configured.", 500);
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const formData = await request.formData();
  const file = formData.get("file");
  const stylePreset = String(formData.get("style") || DEFAULT_STYLE).toLowerCase();
  const customPrompt = formData.get("customPrompt");

  if (!file || !(file instanceof File)) {
    return errorResponse("A source image file is required.", 400);
  }

  const prompt = customPrompt
    ? String(customPrompt).trim()
    : (STYLE_PROMPTS[stylePreset] ?? STYLE_PROMPTS[DEFAULT_STYLE]);

  // Record session for admin analytics
  const paintingSession = await prisma.aIPaintingSession.create({
    data: {
      userId,
      stylePreset,
      prompt,
      status: "PENDING",
      model: OPENAI_MODEL,
    },
  });

  try {
    const openai = new OpenAI({ apiKey });

    const imageFile = await toFile(file, file.name || "source.jpg", {
      type: file.type || "image/jpeg",
    });

    const response = await openai.images.edit({
      model: OPENAI_MODEL,
      image: imageFile,
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageData = response.data?.[0];
    if (!imageData) {
      throw new Error("OpenAI did not return image data.");
    }

    let imageDataUrl: string;
    if (imageData.b64_json) {
      imageDataUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData.url) {
      imageDataUrl = imageData.url;
    } else {
      throw new Error("OpenAI response contained no image URL or base64 data.");
    }

    await prisma.aIPaintingSession.update({
      where: { id: paintingSession.id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ imageDataUrl, model: OPENAI_MODEL, style: stylePreset });
  } catch (err: any) {
    const message = err?.message || "Image generation failed.";

    await prisma.aIPaintingSession.update({
      where: { id: paintingSession.id },
      data: { status: "FAILED", errorMessage: message },
    }).catch(() => {});

    return errorResponse(message, 500);
  }
}
