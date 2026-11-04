import { json } from "@sveltejs/kit";
import { registrationPayloadSchema } from "$lib/server/ppdb/schema";
import { createRegistration } from "$lib/server/ppdb/registration.service";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json({ message: "Format permintaan tidak valid." }, { status: 400 });
  }

  const raw = formData.get("data");

  if (typeof raw !== "string") {
    return json({ message: "Data pendaftaran tidak ditemukan." }, { status: 400 });
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return json({ message: "Data pendaftaran tidak dapat dibaca." }, { status: 400 });
  }

  const parsed = registrationPayloadSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return json(
      {
        message: "Periksa kembali isian yang ditandai.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 422 }
    );
  }

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  const documents: Array<{ key: string; file: File }> = [];

  for (const [field, value] of formData.entries()) {
    if (!field.startsWith("doc:")) continue;
    if (!(value instanceof File) || value.size === 0) continue;
    documents.push({ key: field.slice(4), file: value });
  }

  try {
    const result = await createRegistration({
      payload: parsed.data,
      photo,
      documents,
      source: "online"
    });

    return json(result, { status: 201 });
  } catch (error) {
    console.error("[ppdb] gagal membuat pendaftaran", error);
    return json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Pendaftaran gagal diproses. Silakan coba lagi."
      },
      { status: 400 }
    );
  }
};
