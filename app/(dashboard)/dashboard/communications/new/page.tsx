import type { Metadata } from "next";
import { getBatchesAction, getClassesAction } from "../actions";
import CampaignBuilderClient from "./builder-client";

export const metadata: Metadata = {
  title: "Create Campaign | SchoolPay",
  description: "Configure mass communication campaign target segments, channels, templates, and schedules.",
};

export default async function NewCampaignPage() {
  // Fetch active school batches and student classes in parallel to feed the wizard segment lists.
  const [batches, classes] = await Promise.all([
    getBatchesAction(),
    getClassesAction(),
  ]);

  return <CampaignBuilderClient batches={batches} classes={classes} />;
}
