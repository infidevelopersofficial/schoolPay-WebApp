"use server";

import { revalidatePath } from "next/cache";
import {
  createSurvey,
  updateSurvey,
  publishSurvey,
  closeSurvey,
  deleteSurvey,
  listSurveys,
  submitSurveyResponse,
  getSurveyAnalytics,
} from "@/lib/dal/surveys";
import { withTenantAuth } from "@/lib/tenant-auth";

export async function listSurveysAction(page = 1, limit = 10) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      return await listSurveys(page, limit);
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to list surveys");
  }
}

export async function createSurveyAction(input: {
  title: string;
  description?: string;
  audienceFilter: any;
  expiresAt?: string;
  questions: {
    type: any;
    text: string;
    options?: string[];
    isRequired?: boolean;
  }[];
}) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await createSurvey(input);
      revalidatePath("/dashboard/communications/surveys");
      return result;
    });
  } catch (e: any) {
    return { error: e.message || "Failed to create survey" };
  }
}

export async function updateSurveyAction(
  id: string,
  input: {
    title?: string;
    description?: string;
    audienceFilter?: any;
    expiresAt?: string;
    questions?: {
      type: any;
      text: string;
      options?: string[];
      isRequired?: boolean;
    }[];
  }
) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await updateSurvey(id, input);
      revalidatePath("/dashboard/communications/surveys");
      return result;
    });
  } catch (e: any) {
    return { error: e.message || "Failed to update survey" };
  }
}

export async function publishSurveyAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await publishSurvey(id);
      revalidatePath("/dashboard/communications/surveys");
      revalidatePath("/parent/surveys");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to publish survey");
  }
}

export async function closeSurveyAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await closeSurvey(id);
      revalidatePath("/dashboard/communications/surveys");
      revalidatePath("/parent/surveys");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to close survey");
  }
}

export async function deleteSurveyAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await deleteSurvey(id);
      revalidatePath("/dashboard/communications/surveys");
      revalidatePath("/parent/surveys");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to delete survey");
  }
}

export async function submitSurveyResponseAction(
  surveyId: string,
  answers: { questionId: string; answer: any }[]
) {
  try {
    return await withTenantAuth(null, null, async () => {
      const result = await submitSurveyResponse(surveyId, answers);
      revalidatePath("/parent/surveys");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to submit survey response");
  }
}

export async function getSurveyAnalyticsAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      return await getSurveyAnalytics(id);
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to get survey analytics");
  }
}


