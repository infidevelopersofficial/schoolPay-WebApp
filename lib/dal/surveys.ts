import { withTenantRead } from "@/lib/dal/core";
import { prisma } from "@/lib/prisma";
import { withDAL } from "@/lib/dal/utils";
import { getSchoolId, getParentContext } from "@/lib/tenant-context";
import { recordAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { resolveAudienceFilters } from "@/lib/communication/audience-segment";
import { logger } from "@/lib/logger";
import { THRESHOLDS } from "@/lib/observability/performance";
import { SurveyStatus, QuestionType, Prisma } from "@prisma/client";

const log = logger.child({ domain: "surveys.dal" });

export interface CreateQuestionInput {
  type: QuestionType;
  text: string;
  options?: string[]; // Choice options
  isRequired?: boolean;
}

export interface CreateSurveyInput {
  title: string;
  description?: string;
  audienceFilter: any;
  expiresAt?: string;
  questions: CreateQuestionInput[];
}

/**
 * Creates a Survey in DRAFT mode with nested questions.
 */
export async function createSurvey(input: CreateSurveyInput) {
  const schoolId = await getSchoolId();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User context is required for survey creation");
  }

  return withDAL(
    "surveys.create",
    async () => {
      const survey = await prisma.survey.create({
        data: {
          schoolId,
          title: input.title,
          description: input.description,
          audienceFilter: input.audienceFilter,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          createdById: userId,
          status: "DRAFT",
          questions: {
            create: input.questions.map((q, idx) => ({
              order: idx + 1,
              type: q.type,
              text: q.text,
              options: q.options ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
              isRequired: q.isRequired ?? true,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      await recordAuditLog({
        action: "CREATE",
        entityType: "SURVEY",
        entityId: survey.id,
        schoolId,
        newValues: input,
        description: `Created survey draft: ${survey.title}`,
      });

      return survey;
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}

/**
 * Updates a draft Survey. Clears and re-creates questions to prevent orphan states.
 */
export async function updateSurvey(id: string, input: Partial<CreateSurveyInput>) {
  const schoolId = await getSchoolId();

  return withDAL(
    "surveys.update",
    async () => {
      const survey = await prisma.survey.findFirst({
        where: { id, schoolId },
      });

      if (!survey) {
        throw new Error("Survey not found");
      }

      if (survey.status !== "DRAFT") {
        throw new Error("Only draft surveys can be updated");
      }

      const updated = await prisma.$transaction(async (tx) => {
        const s = await tx.survey.update({
          where: { id },
          data: {
            title: input.title,
            description: input.description,
            audienceFilter: input.audienceFilter ? input.audienceFilter : undefined,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          },
        });

        if (input.questions) {
          // Clear existing questions
          await tx.surveyQuestion.deleteMany({
            where: { surveyId: id },
          });

          // Insert updated question list
          await tx.surveyQuestion.createMany({
            data: input.questions.map((q, idx) => ({
              surveyId: id,
              order: idx + 1,
              type: q.type,
              text: q.text,
              options: q.options ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
              isRequired: q.isRequired ?? true,
            })),
          });
        }

        return s;
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "SURVEY",
        entityId: id,
        schoolId,
        newValues: input,
        description: `Updated survey: ${survey.title}`,
      });

      return updated;
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}

/**
 * Publishes a survey, making it active for targeted respondents.
 */
export async function publishSurvey(id: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "surveys.publish",
    async () => {
      const survey = await prisma.survey.findFirst({
        where: { id, schoolId },
      });

      if (!survey) {
        throw new Error("Survey not found");
      }

      const updated = await prisma.survey.update({
        where: { id },
        data: { status: "PUBLISHED" },
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "SURVEY",
        entityId: id,
        schoolId,
        newValues: { status: "PUBLISHED" },
        description: `Published survey: ${survey.title}`,
      });

      return updated;
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  );
}

/**
 * Closes an active survey.
 */
export async function closeSurvey(id: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "surveys.close",
    async () => {
      const survey = await prisma.survey.findFirst({
        where: { id, schoolId },
      });

      if (!survey) {
        throw new Error("Survey not found");
      }

      const updated = await prisma.survey.update({
        where: { id },
        data: { status: "CLOSED" },
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "SURVEY",
        entityId: id,
        schoolId,
        newValues: { status: "CLOSED" },
        description: `Closed survey: ${survey.title}`,
      });

      return updated;
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  );
}

/**
 * Deletes a survey.
 */
export async function deleteSurvey(id: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "surveys.delete",
    async () => {
      const survey = await prisma.survey.findFirst({
        where: { id, schoolId },
      });

      if (!survey) {
        throw new Error("Survey not found");
      }

      await prisma.survey.delete({
        where: { id },
      });

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "SURVEY",
        entityId: id,
        schoolId,
        description: `Deleted survey: ${survey.title}`,
      });

      return { success: true };
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  );
}

/**
 * Fetches a single survey with nested questions and user response state.
 */
export async function getSurvey(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId();
    const session = await auth();
    const userId = session?.user?.id;

    return withDAL(
      "surveys.get",
      async () => {
        const survey = await prisma.survey.findFirst({
          where: { id, schoolId },
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
            responses: userId
              ? {
                  where: { userId },
                  select: { id: true, createdAt: true },
                }
              : undefined,
          },
        });

        return survey;
      },
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
    );
  });
}

/**
 * Lists all surveys paginated, scoped strictly to active school.
 */
export async function listSurveys(page = 1, limit = 10) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId();
    const skip = (page - 1) * limit;

    return withDAL(
      "surveys.list",
      async () => {
        const [items, total] = await prisma.$transaction([
          prisma.survey.findMany({
            where: { schoolId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              questions: { select: { id: true } },
              _count: { select: { responses: true } },
            },
          }),
          prisma.survey.count({ where: { schoolId } }),
        ]);

        return { items, total, page, limit };
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    );
  });
}

/**
 * Lists surveys targeted to the currently logged in parent.
 * Filters published active surveys based on demographic segmentation lists.
 */
export async function listSurveysForParent() {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext();
    const session = await auth();
    const parentUserId = session?.user?.id;

    if (!parentUserId) {
      throw new Error("Unauthenticated parent session");
    }

    return withDAL(
      "surveys.listForParent",
      async () => {
        // Fetch all published/active surveys in school
        const activeSurveys = await prisma.survey.findMany({
          where: {
            schoolId,
            status: "PUBLISHED",
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: {
            questions: { select: { id: true } },
            responses: {
              where: { userId: parentUserId },
              select: { id: true },
            },
          },
        });

        const targetedSurveys: any[] = [];

        for (const survey of activeSurveys) {
          try {
            const filter = survey.audienceFilter as any;
            const recipients = await resolveAudienceFilters(schoolId, filter);

            // Check if the current parent's user is in the resolved target list
            const isTargeted = recipients.some((r) => r.userId === parentUserId);

            if (isTargeted) {
              targetedSurveys.push({
                ...survey,
                isCompleted: survey.responses.length > 0,
              });
            }
          } catch (err) {
            console.error(`[Surveys Target Check] Failed for survey ${survey.id}:`, err);
          }
        }

        return targetedSurveys;
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    );
  });
}

/**
 * Submits a survey response from a user.
 * Enforces transaction safety and idempotency (unique check on surveyId + userId).
 */
export async function submitSurveyResponse(
  surveyId: string,
  answers: { questionId: string; answer: any }[]
) {
  const schoolId = await getSchoolId();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthenticated user response submission");
  }

  return withDAL(
    "surveys.submitResponse",
    async () => {
      // 1. Verify survey exists and is accepting responses
      const survey = await prisma.survey.findFirst({
        where: {
          id: surveyId,
          schoolId,
          status: "PUBLISHED",
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!survey) {
        throw new Error("Survey is either inactive, expired, or does not exist");
      }

      // 2. Check for duplicate submission (Idempotency)
      const existing = await prisma.surveyResponse.findUnique({
        where: {
          surveyId_userId: { surveyId, userId },
        },
      });

      if (existing) {
        throw new Error("You have already submitted a response for this survey");
      }

      // 3. Atomically write response and nested answers in transaction
      const response = await prisma.$transaction(async (tx) => {
        const res = await tx.surveyResponse.create({
          data: {
            surveyId,
            userId,
          },
        });

        const answerData = answers.map((ans) => ({
          responseId: res.id,
          questionId: ans.questionId,
          answer: ans.answer as Prisma.InputJsonValue,
        }));

        await tx.surveyAnswer.createMany({
          data: answerData,
        });

        return res;
      });

      await recordAuditLog({
        action: "CREATE",
        entityType: "SURVEY_RESPONSE",
        entityId: response.id,
        schoolId,
        newValues: { surveyId, answersCount: answers.length },
        description: `Submitted response for survey: ${survey.title}`,
      });

      return response;
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}

/**
 * Aggregates questions feedback and responses for administrative reporting.
 */
export async function getSurveyAnalytics(surveyId: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "surveys.analytics",
    async () => {
      const survey = await prisma.survey.findFirst({
        where: { id: surveyId, schoolId },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          responses: {
            include: {
              answers: true,
            },
          },
        },
      });

      if (!survey) {
        throw new Error("Survey not found");
      }

      const totalResponses = survey.responses.length;
      const questionResults: any[] = [];

      for (const question of survey.questions) {
        const answersList = survey.responses
          .map((res) => res.answers.find((a) => a.questionId === question.id))
          .filter((a) => a !== undefined && a.answer !== null) as any[];

        let aggregate: any = {};

        if (question.type === "RATING") {
          const scores = answersList.map((a) => Number(a.answer)).filter((s) => !isNaN(s));
          const average = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
          
          // Compute score frequencies (1 to 5 stars)
          const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          scores.forEach((s) => {
            const rounded = Math.round(s);
            if (distribution[rounded] !== undefined) {
              distribution[rounded]++;
            }
          });

          aggregate = {
            average: Number(average.toFixed(1)),
            distribution,
          };
        } else if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") {
          const selectionCounts: Record<string, number> = {};
          
          // Seed options
          const options = Array.isArray(question.options) ? (question.options as string[]) : [];
          options.forEach((opt) => {
            selectionCounts[opt] = 0;
          });

          answersList.forEach((a) => {
            const val = a.answer;
            if (Array.isArray(val)) {
              val.forEach((item) => {
                if (typeof item === "string") {
                  selectionCounts[item] = (selectionCounts[item] || 0) + 1;
                }
              });
            } else if (typeof val === "string") {
              selectionCounts[val] = (selectionCounts[val] || 0) + 1;
            }
          });

          // Compile percentages
          const choiceDetails = Object.entries(selectionCounts).map(([option, count]) => ({
            option,
            count,
            percentage: totalResponses > 0 ? Number(((count / totalResponses) * 100).toFixed(1)) : 0,
          }));

          aggregate = {
            choices: choiceDetails,
          };
        } else if (question.type === "TEXT") {
          // Return the latest 10 text responses
          const textAnswers = answersList
            .map((a) => String(a.answer))
            .filter((t) => t.trim().length > 0)
            .slice(-10);

          aggregate = {
            recentResponses: textAnswers,
          };
        }

        questionResults.push({
          id: question.id,
          text: question.text,
          type: question.type,
          order: question.order,
          isRequired: question.isRequired,
          answersCount: answersList.length,
          aggregate,
        });
      }

      return {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        createdAt: survey.createdAt,
        totalResponses,
        questions: questionResults,
      };
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}
