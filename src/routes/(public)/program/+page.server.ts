import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { getPublishedPage } from "$lib/server/content/content.service";
import { renderMarkdown } from "$lib/server/content/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const [page, categories] = await Promise.all([
    getPublishedPage("program"),
    db
      .select()
      .from(table.santriCategory)
      .where(eq(table.santriCategory.isActive, true))
      .orderBy(asc(table.santriCategory.sortOrder))
  ]);

  return {
    page: page ? { title: page.title, html: renderMarkdown(page.content) } : null,
    categories: categories.map((category) => ({
      code: category.code,
      name: category.name,
      institutionName: category.institutionName,
      educationLevel: category.educationLevel,
      gradeRange: category.gradeRange,
      description: category.description
    }))
  };
};
