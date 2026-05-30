import type { Metadata } from "next";
import { getBatchesAction, getClassesAction } from "../../actions";
import SurveyBuilder from "./survey-builder";

export const metadata: Metadata = {
  title: "Create Survey | SchoolPay",
  description: "Compose institutional polls, ratings, and surveys for targeted parent segments.",
};

export default async function NewSurveyPage() {
  // Parallel fetch to resolve classes and batch groupings for builder segment maps.
  const [batches, classes] = await Promise.all([
    getBatchesAction(),
    getClassesAction(),
  ]);

  return <SurveyBuilder batches={batches} classes={classes} />;
}
