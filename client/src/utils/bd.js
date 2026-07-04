// Bangladesh-specific constants for a localized CRM.

// Standard VAT rate in Bangladesh (15%). AIT/TDS varies; keep configurable per document.
export const VAT_RATE = 0.15;
export const VAT_RATE_PERCENT = 15;

// Mobile Financial Services (MFS) + traditional payment methods used in Bangladesh.
export const PAYMENT_METHODS = [
  "bKash",
  "Nagad",
  "Rocket",
  "Upay",
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Card",
];

// The MFS subset that should prompt for a Transaction ID (TrxID).
export const MFS_METHODS = ["bKash", "Nagad", "Rocket", "Upay"];

// Bangladesh has 8 administrative divisions.
export const DIVISIONS = [
  "Barishal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
];

// 64 districts grouped by division.
export const DISTRICTS_BY_DIVISION = {
  Barishal: [
    "Barguna",
    "Barishal",
    "Bhola",
    "Jhalokati",
    "Patuakhali",
    "Pirojpur",
  ],
  Chattogram: [
    "Bandarban",
    "Brahmanbaria",
    "Chandpur",
    "Chattogram",
    "Cox's Bazar",
    "Cumilla",
    "Feni",
    "Khagrachhari",
    "Lakshmipur",
    "Noakhali",
    "Rangamati",
  ],
  Dhaka: [
    "Dhaka",
    "Faridpur",
    "Gazipur",
    "Gopalganj",
    "Kishoreganj",
    "Madaripur",
    "Manikganj",
    "Munshiganj",
    "Narayanganj",
    "Narsingdi",
    "Rajbari",
    "Shariatpur",
    "Tangail",
  ],
  Khulna: [
    "Bagerhat",
    "Chuadanga",
    "Jashore",
    "Jhenaidah",
    "Khulna",
    "Kushtia",
    "Magura",
    "Meherpur",
    "Narail",
    "Satkhira",
  ],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Rajshahi: [
    "Bogura",
    "Chapainawabganj",
    "Joypurhat",
    "Naogaon",
    "Natore",
    "Pabna",
    "Rajshahi",
    "Sirajganj",
  ],
  Rangpur: [
    "Dinajpur",
    "Gaibandha",
    "Kurigram",
    "Lalmonirhat",
    "Nilphamari",
    "Panchagarh",
    "Rangpur",
    "Thakurgaon",
  ],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
};

export const ALL_DISTRICTS = Object.values(DISTRICTS_BY_DIVISION).flat();

// +880 phone helpers.
export const PHONE_COUNTRY_CODE = "+880";
export const normalizeBdPhone = (raw = "") => {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("0")) return `+88${digits}`;
  if (digits.length === 10) return `+880${digits}`;
  return raw;
};
