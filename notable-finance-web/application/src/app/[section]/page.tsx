import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinanceWorkspace } from "@/components/finance-workspace";
import { financeSections, getSectionById } from "@/lib/finance-data";
import type { FinanceSectionId } from "@/types/finance";

type SectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return financeSections.map((section) => ({
    section: section.id,
  }));
}

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const match = getSectionById(section);

  if (!match) {
    return {
      title: "Notable Finance",
    };
  }

  return {
    title: `${match.label} | Notable Finance`,
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const match = getSectionById(section);

  if (!match) {
    notFound();
  }

  return <FinanceWorkspace activeSection={match.id as FinanceSectionId} />;
}
