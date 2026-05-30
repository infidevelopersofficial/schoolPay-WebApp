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

export async function listSurveysAction(page = 1, limit = 10) {
  return await listSurveys(page, limit);
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
  const result = await createSurvey(input);
  revalidatePath("/dashboard/communications/surveys");
  return result;
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
  const result = await updateSurvey(id, input);
  revalidatePath("/dashboard/communications/surveys");
  return result;
}

export async function publishSurveyAction(id: string) {
  const result = await publishSurvey(id);
  revalidatePath("/dashboard/communications/surveys");
  revalidatePath("/parent/surveys");
  return result;
}

export async function closeSurveyAction(id: string) {
  const result = await closeSurvey(id);
  revalidatePath("/dashboard/communications/surveys");
  revalidatePath("/parent/surveys");
  return result;
}

export async function deleteSurveyAction(id: string) {
  const result = await deleteSurvey(id);
  revalidatePath("/dashboard/communications/surveys");
  revalidatePath("/parent/surveys");
  return result;
}

export async function submitSurveyResponseAction(
  surveyId: string,
  answers: { questionId: string; answer: any }[]
) {
  const result = await submitSurveyResponse(surveyId, answers);
  revalidatePath("/parent/surveys");
  return result;
}

export async function getSurveyAnalyticsAction(id: string) {
  return await getSurveyAnalytics(id);
}

