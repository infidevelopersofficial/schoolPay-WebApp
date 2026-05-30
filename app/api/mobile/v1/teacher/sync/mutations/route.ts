import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { SyncMutationsRequest, SyncMutationsResponse } from "@/lib/mobile/sync-types";

export async function POST(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body: SyncMutationsRequest = await request.json();
    if (!body.mutations || !Array.isArray(body.mutations)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const response: SyncMutationsResponse = {
      processed: 0,
      failed: [],
    };

    for (const mutation of body.mutations) {
      try {
        const actionDate = new Date(mutation.actionAt);
        if (isNaN(actionDate.getTime())) {
          throw new Error("Invalid actionAt timestamp");
        }

        switch (mutation.type) {
          case "MARK_ATTENDANCE": {
            const { studentId, batchId, date, status, remarks } = mutation.payload;
            if (!studentId || !batchId || !date || !status) {
              throw new Error("Missing required payload fields");
            }

            // Verify teacher has access to this batch
            const hasAccess = await prisma.batch.findFirst({
              where: {
                id: batchId,
                teacherId: session.teacherId,
              },
            });

            if (!hasAccess) {
              throw new Error("Forbidden: Not assigned to this batch");
            }

            const parsedDate = new Date(date);

            // Fetch existing attendance to check LWW
            const existingAttendance = await prisma.attendance.findUnique({
              where: {
                studentId_date_schoolId: {
                  studentId,
                  date: parsedDate,
                  schoolId: session.schoolId,
                },
              },
            });

            // If existing attendance was updated MORE recently than our offline action timestamp,
            // we skip updating (Last-Write-Wins logic).
            if (existingAttendance && actionDate < existingAttendance.updatedAt) {
              // Successfully ignored due to LWW
              break;
            }

            await prisma.attendance.upsert({
              where: {
                studentId_date_schoolId: {
                  studentId,
                  date: parsedDate,
                  schoolId: session.schoolId,
                },
              },
              update: {
                status,
                remarks: remarks || null,
                updatedAt: actionDate, // Use actionDate to reflect true time of mutation
              },
              create: {
                studentId,
                batchId,
                date: parsedDate,
                status,
                remarks: remarks || null,
                schoolId: session.schoolId,
                createdAt: actionDate,
                updatedAt: actionDate,
              },
            });

            break;
          }
          
          case "PUBLISH_ANNOUNCEMENT": {
            const { title, content, targetAudience, priority, category } = mutation.payload;
            if (!title || !content || !targetAudience || !priority || !category) {
              throw new Error("Missing required payload fields");
            }

            // Acknowledging the mutation but creating it with actual server time to avoid weird historical announcement listings
            // unless we want to honor actionDate for creation time. We'll use actionDate.
            await prisma.announcement.create({
              data: {
                title,
                content,
                targetAudience,
                priority,
                category,
                date: actionDate.toISOString(),
                author: "Teacher",
                schoolId: session.schoolId,
                createdAt: actionDate,
              },
            });
            break;
          }

          default:
            throw new Error(`Unsupported mutation type: ${mutation.type}`);
        }

        response.processed++;
      } catch (error: any) {
        response.failed.push({
          id: mutation.id,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Sync Mutations API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
