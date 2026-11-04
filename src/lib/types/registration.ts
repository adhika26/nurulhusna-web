export type Gender = "male" | "female";
export type GuardianStatus = "alive" | "deceased" | "unknown";
export type PaymentScheme = "full" | "installment_3";

export type GuardianDraft = {
  name: string;
  status: GuardianStatus;
  nationality: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  lastEducation: string;
  occupation: string;
  monthlyIncome: string;
  phone: string;
  kksNumber: string;
};

export type AddressDraft = {
  ownershipStatus: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  villageCode: string;
  rt: string;
  rw: string;
  street: string;
  postalCode: string;
  distanceKm: string;
  transportation: string;
  travelMinutes: string;
};

export type StudentDraft = {
  fullName: string;
  gender: Gender | "";
  birthPlace: string;
  birthDate: string;
  religion: string;
  nationality: string;
  nik: string;
  kkNumber: string;
  nisn: string;
  localNis: string;
  siblingCount: string;
  birthOrder: string;
  aspiration: string;
  hobby: string;
  phone: string;
  email: string;
  schoolName: string;
  schoolNpsn: string;
  kipNumber: string;
};

export type WaliDraft = {
  name: string;
  relationship: string;
  phone: string;
  addressSame: boolean;
};

export type RegistrationDraft = {
  categoryCode: string;
  scheme: PaymentScheme;
  student: StudentDraft;
  father: GuardianDraft;
  mother: GuardianDraft;
  wali: WaliDraft | null;
  fatherAddress: AddressDraft;
  studentAddressSame: boolean;
  studentAddress: AddressDraft;
  checklist: string[];
};

export const RELIGION_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

export const EDUCATION_OPTIONS = [
  "Tidak sekolah",
  "SD / MI",
  "SMP / MTs",
  "SMA / SMK / MA",
  "D1 - D3",
  "S1",
  "S2",
  "S3"
];

export const TRANSPORTATION_OPTIONS = [
  "Jalan kaki",
  "Sepeda",
  "Sepeda motor",
  "Mobil",
  "Angkutan umum",
  "Antar keluarga"
];

export const OWNERSHIP_OPTIONS = [
  "Milik sendiri",
  "Sewa / kontrak",
  "Menumpang",
  "Asrama",
  "Lainnya"
];

export const RELATIONSHIP_OPTIONS = ["Kakek", "Nenek", "Paman", "Bibi", "Kakak", "Saudara", "Lainnya"];

export const CHECKLIST_ITEMS = [
  { key: "photo_3x4", label: "Pas foto latar merah 3×4", count: "4 lembar" },
  { key: "akta", label: "Fotokopi akta kelahiran", count: "2 lembar" },
  { key: "kk", label: "Fotokopi Kartu Keluarga", count: "2 lembar" },
  { key: "ktp_parents", label: "Fotokopi KTP kedua orang tua / wali", count: "2 lembar" },
  { key: "nisn", label: "Fotokopi NISN", count: "2 lembar" },
  { key: "ijazah", label: "Fotokopi ijazah / SKL (dilegalisir)", count: "2 lembar" },
  { key: "kip", label: "Fotokopi KIP (bila ada)", count: "2 lembar" },
  { key: "kks", label: "Fotokopi KKS (bila ada)", count: "2 lembar" },
  { key: "pkh", label: "Fotokopi PKH (bila ada)", count: "2 lembar" }
];

/** Dokumen yang boleh diunggah online. Pas foto ditangani di langkah calon santri. */
export const DOCUMENT_ITEMS = CHECKLIST_ITEMS.filter((item) => item.key !== "photo_3x4");

export const WIZARD_STEPS = [
  { id: 1, title: "Calon santri", subtitle: "Identitas dan sekolah asal" },
  { id: 2, title: "Ayah kandung", subtitle: "Identitas dan pekerjaan" },
  { id: 3, title: "Ibu kandung", subtitle: "Identitas dan pekerjaan" },
  { id: 4, title: "Alamat", subtitle: "Rumah dan jarak" },
  { id: 5, title: "Berkas", subtitle: "Upload dokumen (opsional)" },
  { id: 6, title: "Tinjau", subtitle: "Periksa dan kirim" }
];

export function emptyGuardian(): GuardianDraft {
  return {
    name: "",
    status: "alive",
    nationality: "WNI",
    nik: "",
    birthPlace: "",
    birthDate: "",
    lastEducation: "",
    occupation: "",
    monthlyIncome: "",
    phone: "",
    kksNumber: ""
  };
}

export function emptyAddress(): AddressDraft {
  return {
    ownershipStatus: "",
    province: "",
    regency: "",
    district: "",
    village: "",
    provinceCode: "",
    regencyCode: "",
    districtCode: "",
    villageCode: "",
    rt: "",
    rw: "",
    street: "",
    postalCode: "",
    distanceKm: "",
    transportation: "",
    travelMinutes: ""
  };
}

export function createEmptyDraft(categoryCode: string): RegistrationDraft {
  return {
    categoryCode,
    scheme: "full",
    student: {
      fullName: "",
      gender: "",
      birthPlace: "",
      birthDate: "",
      religion: "Islam",
      nationality: "WNI",
      nik: "",
      kkNumber: "",
      nisn: "",
      localNis: "",
      siblingCount: "",
      birthOrder: "",
      aspiration: "",
      hobby: "",
      phone: "",
      email: "",
      schoolName: "",
      schoolNpsn: "",
      kipNumber: ""
    },
    father: emptyGuardian(),
    mother: emptyGuardian(),
    wali: null,
    fatherAddress: emptyAddress(),
    studentAddressSame: true,
    studentAddress: emptyAddress(),
    checklist: []
  };
}
