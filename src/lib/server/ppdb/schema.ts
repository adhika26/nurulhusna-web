import { z } from "zod";

const optionalString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const guardianSchema = z.object({
  name: z.string().trim().min(2).max(160),
  status: z.enum(["alive", "deceased", "unknown"]),
  nationality: z.string().trim().min(1).max(32).default("WNI"),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit"),
  birthPlace: optionalString(120),
  birthDate: optionalString(10),
  lastEducation: optionalString(64),
  occupation: optionalString(120),
  monthlyIncome: optionalNumber,
  phone: optionalString(32),
  kksNumber: optionalString(32)
});

const addressSchema = z.object({
  ownershipStatus: optionalString(64),
  province: z.string().trim().min(2).max(120),
  regency: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(120),
  village: z.string().trim().min(2).max(120),
  provinceCode: optionalString(2),
  regencyCode: optionalString(5),
  districtCode: optionalString(8),
  villageCode: optionalString(13),
  rt: optionalString(8),
  rw: optionalString(8),
  street: optionalString(255),
  postalCode: optionalString(5),
  distanceKm: optionalNumber,
  transportation: optionalString(64),
  travelMinutes: optionalNumber
});

export const registrationPayloadSchema = z.object({
  categoryCode: z.string().trim().min(1).max(16),
  scheme: z.enum(["full", "installment_3"]),
  student: z.object({
    fullName: z.string().trim().min(3).max(160),
    gender: z.enum(["male", "female"]),
    birthPlace: z.string().trim().min(2).max(120),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir tidak valid"),
    religion: z.string().trim().min(1).max(32),
    nationality: z.string().trim().min(1).max(32).default("WNI"),
    nik: z.string().trim().regex(/^\d{16}$/, "NIK santri harus 16 digit"),
    kkNumber: z.string().trim().regex(/^\d{16}$/, "Nomor KK harus 16 digit"),
    nisn: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null))
      .refine((value) => value === null || /^\d{10}$/.test(value), "NISN harus 10 digit"),
    localNis: optionalString(32),
    siblingCount: optionalNumber,
    birthOrder: optionalNumber,
    aspiration: optionalString(160),
    hobby: optionalString(160),
    phone: optionalString(32),
    email: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null))
      .refine(
        (value) => value === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
        "Format email tidak valid"
      ),
    schoolName: z.string().trim().min(2).max(200),
    schoolNpsn: optionalString(16),
    kipNumber: optionalString(32)
  }),
  father: guardianSchema,
  mother: guardianSchema,
  wali: z
    .object({
      name: z.string().trim().min(2).max(160),
      relationship: z.string().trim().min(1).max(64),
      phone: optionalString(32),
      addressSame: z.boolean()
    })
    .nullable(),
  fatherAddress: addressSchema,
  studentAddressSame: z.boolean(),
  studentAddress: addressSchema.nullable(),
  checklist: z.array(z.string()).default([])
}).superRefine((data, ctx) => {
  const phones = [data.student.phone, data.father.phone, data.mother.phone].filter(
    (phone): phone is string => typeof phone === "string" && phone.length > 0
  );

  if (phones.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["student", "phone"],
      message: "Isi minimal satu nomor HP (santri, ayah, atau ibu) untuk cek status."
    });
  }
});

export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;
