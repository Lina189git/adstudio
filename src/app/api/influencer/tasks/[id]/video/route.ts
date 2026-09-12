import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

export const dynamic = "force-dynamic";

// POST /api/influencer/tasks/[id]/video â€” submit a video for a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findFirst({ where: { id: params.id, influencerId } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (task.status === "CANCELLED" || task.status === "COMPLETED") {
    return NextResponse.json({ error: "This task is no longer accepting submissions." }, { status: 400 });
  }

  const body = await request.json();
  const { videoUrl, thumbnailUrl, title, description } = body;
  if (!videoUrl?.trim()) return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const video = await prisma.videoSubmission.create({
    data: {
      taskId: task.id,
      influencerId,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || null,
      title: title.trim(),
      description: description?.trim() || null,
    },
  });

  await prisma.adTask.update({ where: { id: task.id }, data: { status: "SUBMITTED" } });

  return NextResponse.json(video, { status: 201 });
}
