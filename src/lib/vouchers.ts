// Central catalog for Udemy certification exam vouchers.
// Slugs verified against live Udemy /certification-vouchers/* pages (Sept 2026).
// Prices/validity change by region — pages must caveat "check live price".

export const VOUCHER_CAMPAIGN = "https://trk.udemy.com/c/6564357/4028133/39854";
export const VOUCHER_CATALOG_URL = "https://www.udemy.com/all-certification-vouchers/";

export function voucherPageUrl(slug: string): string {
  return `https://www.udemy.com/certification-vouchers/${slug}/`;
}

/** Affiliate deep link (Impact campaign 4028133) to a single voucher page. */
export function voucherAffUrl(slug: string): string {
  return `${VOUCHER_CAMPAIGN}?u=${encodeURIComponent(voucherPageUrl(slug))}`;
}

/** Affiliate deep link to the full voucher catalog. */
export function voucherCatalogAffUrl(): string {
  return `${VOUCHER_CAMPAIGN}?u=${encodeURIComponent(VOUCHER_CATALOG_URL)}`;
}

export interface Voucher {
  slug: string;
  name: string;
  code?: string;
  tag: string;
  note: string;
  priceNote?: string;
}

export interface VoucherGroup {
  title: string;
  items: Voucher[];
}

const NINE_MO =
  "Voucher valid for at least 9 months after purchase. Online or in-person exams.";
const NINE_MO_RETAKE =
  "Voucher + Second Chance valid for at least 9 months after purchase. Online or in-person exams.";

export const COMPTIA_GROUPS: VoucherGroup[] = [
  {
    title: "Core Certifications",
    items: [
      {
        slug: "comptia-security-plus",
        name: "CompTIA Security+",
        code: "SY0-701",
        tag: "Cybersecurity",
        note: NINE_MO_RETAKE,
      },
      {
        slug: "comptia-a-plus",
        name: "CompTIA A+",
        code: "Core 1 & Core 2",
        tag: "IT Support",
        note: "Valid for at least 9 months. One voucher covers either the Core 1 or Core 2 exam.",
      },
      {
        slug: "comptia-network-plus",
        name: "CompTIA Network+",
        code: "N10-009",
        tag: "Networking",
        note: NINE_MO_RETAKE,
      },
      {
        slug: "comptia-tech-plus",
        name: "CompTIA Tech+",
        tag: "Fundamentals",
        note: NINE_MO_RETAKE,
      },
    ],
  },
  {
    title: "Cybersecurity",
    items: [
      { slug: "comptia-cysa-plus", name: "CompTIA CySA+", tag: "Analyst", note: NINE_MO_RETAKE },
      { slug: "comptia-pentest-plus", name: "CompTIA PenTest+", tag: "Pen Testing", note: NINE_MO_RETAKE },
      { slug: "comptia-securityx", name: "CompTIA SecurityX", tag: "Expert", note: NINE_MO_RETAKE },
    ],
  },
  {
    title: "Infrastructure & Cloud",
    items: [
      { slug: "comptia-linux-plus", name: "CompTIA Linux+", tag: "Linux", note: NINE_MO_RETAKE },
      { slug: "comptia-cloud-plus", name: "CompTIA Cloud+", tag: "Cloud", note: NINE_MO_RETAKE },
      { slug: "comptia-cloudnetx", name: "CompTIA CloudNetX", tag: "Cloud Networking", note: NINE_MO, priceNote: "Listed at $476.50 on Udemy — always check the live price before buying." },
      { slug: "comptia-server-plus", name: "CompTIA Server+", tag: "Servers", note: NINE_MO_RETAKE },
    ],
  },
  {
    title: "Data & Project",
    items: [
      { slug: "comptia-data-plus", name: "CompTIA Data+", tag: "Data", note: NINE_MO_RETAKE },
      { slug: "comptia-datasys-plus", name: "CompTIA DataSys+", tag: "Database", note: NINE_MO_RETAKE },
      { slug: "comptia-data-ai", name: "CompTIA DataAI", tag: "AI & Data", note: NINE_MO_RETAKE },
      { slug: "comptia-project-plus", name: "CompTIA Project+", tag: "Project", note: NINE_MO_RETAKE },
    ],
  },
];

export const AWS_GROUPS: VoucherGroup[] = [
  {
    title: "Foundational",
    items: [
      {
        slug: "aws-certified-cloud-practitioner",
        name: "AWS Certified Cloud Practitioner",
        code: "CLF-C02",
        tag: "Foundational",
        note: "Usable for all AWS Foundational exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-ai-practitioner",
        name: "AWS Certified AI Practitioner",
        code: "AIF-C01",
        tag: "Foundational",
        note: "Usable for all AWS Foundational exams. Voucher valid for at least 9 months after purchase.",
      },
    ],
  },
  {
    title: "Associate",
    items: [
      {
        slug: "aws-certified-solutions-architect-associate",
        name: "AWS Solutions Architect – Associate",
        code: "SAA-C03",
        tag: "Architect",
        note: "Usable for all AWS Associate exams. Voucher valid ≥9 months. Note: the SAA + Retake bundle required the first attempt by Dec 31, 2026 and retake by Jan 31, 2027 — verify current terms.",
      },
      {
        slug: "aws-certified-developer-associate",
        name: "AWS Developer – Associate",
        tag: "Developer",
        note: "Usable for all AWS Associate exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-data-engineer-associate",
        name: "AWS Data Engineer – Associate",
        tag: "Data",
        note: "Usable for all AWS Associate exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-cloudops-engineer-associate",
        name: "AWS CloudOps Engineer – Associate",
        tag: "Operations",
        note: "Usable for all AWS Associate exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-machine-learning-engineer-associate",
        name: "AWS ML Engineer – Associate",
        tag: "Machine Learning",
        note: "Usable for all AWS Associate exams. Voucher + Second Chance valid for at least 9 months.",
      },
    ],
  },
  {
    title: "Professional",
    items: [
      {
        slug: "aws-certified-solutions-architect-professional",
        name: "AWS Solutions Architect – Professional",
        tag: "Architect",
        note: "Usable for all AWS Professional & Specialty exams. Voucher valid ≥9 months; Second Chance valid ≥9 months from issuance.",
      },
      {
        slug: "aws-certified-devops-engineer-professional",
        name: "AWS DevOps Engineer – Professional",
        tag: "DevOps",
        note: "Usable for all AWS Professional & Specialty exams. Voucher + Second Chance valid for at least 9 months.",
      },
    ],
  },
  {
    title: "Specialty",
    items: [
      {
        slug: "aws-certified-security-specialty",
        name: "AWS Security – Specialty",
        tag: "Security",
        note: "Usable for all AWS Professional & Specialty exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-machine-learning-specialty",
        name: "AWS Machine Learning – Specialty",
        tag: "Machine Learning",
        note: "Usable for all AWS Professional & Specialty exams. Voucher + Second Chance valid for at least 9 months.",
      },
      {
        slug: "aws-certified-advanced-networking-specialty",
        name: "AWS Advanced Networking – Specialty",
        tag: "Networking",
        note: "Usable for all AWS Professional & Specialty exams. Voucher valid ≥9 months; Second Chance valid ≥9 months from issuance.",
      },
    ],
  },
];

export const MICROSOFT_GROUPS: VoucherGroup[] = [
  {
    title: "Fundamentals",
    items: [
      {
        slug: "microsoft-az-900",
        name: "Azure Fundamentals",
        code: "AZ-900",
        tag: "Fundamentals",
        note: "Save 10% on the exam. Voucher valid for at least 9 months. Online or in-person via Pearson VUE.",
      },
      {
        slug: "microsoft-dp-900",
        name: "Azure Data Fundamentals",
        code: "DP-900",
        tag: "Data",
        note: "Save 10% on the exam. Voucher valid for at least 9 months. Online or in-person via Pearson VUE.",
      },
    ],
  },
  {
    title: "Associate",
    items: [
      {
        slug: "microsoft-az-104",
        name: "Azure Administrator Associate",
        code: "AZ-104",
        tag: "Administrator",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
      {
        slug: "microsoft-az-500",
        name: "Azure Security Engineer Associate",
        code: "AZ-500",
        tag: "Security",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
      {
        slug: "microsoft-ai-102",
        name: "Azure AI Engineer Associate",
        code: "AI-102",
        tag: "AI Engineer",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
      {
        slug: "microsoft-az-800",
        name: "Windows Server Hybrid Administrator Associate",
        code: "AZ-800",
        tag: "Windows Server",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
      {
        slug: "microsoft-md-102",
        name: "Endpoint Administrator Associate",
        code: "MD-102",
        tag: "Microsoft 365",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
    ],
  },
  {
    title: "Expert",
    items: [
      {
        slug: "microsoft-az-305",
        name: "Azure Solutions Architect Expert",
        code: "AZ-305",
        tag: "Architect",
        note: "Voucher + Retake Assurance available. Valid ≥9 months. Schedule via Pearson VUE.",
      },
    ],
  },
];

export function countVouchers(groups: VoucherGroup[]): number {
  return groups.reduce((n, g) => n + g.items.length, 0);
}
