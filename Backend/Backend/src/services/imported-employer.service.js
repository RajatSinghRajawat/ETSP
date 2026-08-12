import * as XLSX from 'xlsx';
import { ImportedEmployer } from '../models/imported-employer.model.js';
import { AppError } from '../utils/app-error.js';
import { buildWorkbookBuffer } from '../utils/excel.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const EXPORT_LIMIT = 20000;

const allowedSpreadsheetMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/octet-stream',
]);

const allowedSpreadsheetExtensions = /\.(xlsx|xls|csv)$/i;

const HEADER_FIELD_MAP = {
  COMPANYNAME: 'companyName',
  COMPANY: 'companyName',
  CATEGORY: 'category',
  ORGANIZATIONTYPE: 'category',
  STATE: 'state',
  CITYCITIES: 'cities',
  CITIES: 'cities',
  CITY: 'cities',
  CONTACT: 'contactName',
  CONTACTPERSON: 'contactName',
  CONTACTNAME: 'contactName',
  FIRSTNAME: 'firstName',
  LASTNAME: 'lastName',
  DESIGNATION: 'designation',
  CONTACTNUMBER: 'contactNumber',
  PHONENUMBER: 'contactNumber',
  PHONE: 'contactNumber',
  MOBILE: 'contactNumber',
  MOBILENUMBER: 'contactNumber',
  WHATSAPPNO: 'whatsappNumber',
  WHATSAPP: 'whatsappNumber',
  WHATSAPPNUMBER: 'whatsappNumber',
  EMAIL: 'email',
  EMAILID: 'email',
  WEBSITE: 'website',
  ADDRESS: 'address',
  PINCODE: 'pincode',
  ABOUTUS: 'aboutUs',
  ABOUT: 'aboutUs',
  OVERVIEW: 'aboutUs',
  STAFFSIZE: 'staffSize',
  TEAMSIZE: 'staffSize',
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function normalizeHeader(header) {
  return String(header ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function cellText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

export function normalizePhoneDigits(value) {
  const digits = cellText(value).replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  // Drop country/STD prefixes so 91XXXXXXXXXX and XXXXXXXXXX match each other
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeEmail(value) {
  const email = cellText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function splitContactName(value) {
  const parts = cellText(value).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function parseCities(value) {
  return cellText(value)
    .split(/[,;/|]/)
    .map((city) => city.trim())
    .filter(Boolean);
}

function mapRowToEmployer(row, headers) {
  const record = {};

  headers.forEach((field, columnIndex) => {
    if (!field) {
      return;
    }

    const raw = cellText(row[columnIndex]);
    if (!raw) {
      return;
    }

    if (field === 'cities') {
      record.cities = parseCities(raw);
      return;
    }

    if (field === 'contactName') {
      const { firstName, lastName } = splitContactName(raw);
      record.firstName = record.firstName || firstName;
      record.lastName = record.lastName || lastName;
      return;
    }

    if (field === 'email') {
      record.email = normalizeEmail(raw);
      return;
    }

    record[field] = raw;
  });

  record.contactNumberDigits = normalizePhoneDigits(record.contactNumber);
  record.whatsappNumberDigits = normalizePhoneDigits(record.whatsappNumber);

  return record;
}

function buildIdentifierFilters({ email, contactNumberDigits, whatsappNumberDigits }) {
  const filters = [];

  if (email) {
    filters.push({ email });
  }

  const digits = [contactNumberDigits, whatsappNumberDigits].filter(Boolean);
  if (digits.length > 0) {
    filters.push({ contactNumberDigits: { $in: digits } });
    filters.push({ whatsappNumberDigits: { $in: digits } });
  }

  return filters;
}

export async function importEmployersFromExcel(file) {
  if (!file) {
    throw new AppError('Excel file is required', 400);
  }

  const fileName = file.filename ?? '';
  const isAllowedType =
    allowedSpreadsheetMimeTypes.has(file.mimetype) || allowedSpreadsheetExtensions.test(fileName);

  if (!isAllowedType || !allowedSpreadsheetExtensions.test(fileName)) {
    throw new AppError('Only Excel (.xlsx, .xls) or CSV files are allowed', 400);
  }

  const buffer = await file.toBuffer();

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new AppError('Unable to read the uploaded file. Please upload a valid Excel file.', 400);
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new AppError('The uploaded file has no sheets', 400);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (rows.length < 2) {
    throw new AppError('The uploaded file has no employer rows below the header', 400);
  }

  const headers = rows[0].map((header) => HEADER_FIELD_MAP[normalizeHeader(header)] ?? null);
  if (!headers.some(Boolean)) {
    throw new AppError(
      'No recognizable columns found. Expected headers like COMPANY NAME, CONTACT NUMBER, WHATSAPP NO., EMAIL.',
      400,
    );
  }

  const summary = {
    totalRows: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };
  const seenIdentifiers = new Set();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const isEmptyRow = !row.some((cell) => cellText(cell));
    if (isEmptyRow) {
      continue;
    }

    summary.totalRows += 1;
    const rowNumber = rowIndex + 1;
    const record = mapRowToEmployer(row, headers);

    if (!record.email && !record.contactNumberDigits && !record.whatsappNumberDigits) {
      summary.skipped += 1;
      summary.errors.push({
        row: rowNumber,
        reason: 'Missing email, contact number, and WhatsApp number — at least one is required',
      });
      continue;
    }

    if (!record.companyName) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: 'Missing company name' });
      continue;
    }

    const identifierKey = [record.email, record.contactNumberDigits, record.whatsappNumberDigits]
      .filter(Boolean)
      .join('|');
    if (seenIdentifiers.has(identifierKey)) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: 'Duplicate row within the file' });
      continue;
    }
    seenIdentifiers.add(identifierKey);

    try {
      const existing = await ImportedEmployer.findOne({
        $or: buildIdentifierFilters(record),
      });

      if (existing) {
        existing.set({ ...record, sourceFileName: fileName });
        await existing.save();
        summary.updated += 1;
      } else {
        await ImportedEmployer.create({ ...record, sourceFileName: fileName });
        summary.imported += 1;
      }
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: error.message ?? 'Failed to save row' });
    }
  }

  return summary;
}

function buildListFilters(query = {}) {
  const filters = {};

  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filters.$or = [
      { companyName: keyword },
      { email: keyword },
      { contactNumber: keyword },
      { whatsappNumber: keyword },
      { firstName: keyword },
      { lastName: keyword },
      { state: keyword },
      { cities: keyword },
    ];
  }

  if (query.status && ['imported', 'registered'].includes(query.status)) {
    filters.status = query.status;
  }

  return filters;
}

export async function getImportedEmployers(query = {}) {
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filters = buildListFilters(query);

  const [items, total] = await Promise.all([
    ImportedEmployer.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ImportedEmployer.countDocuments(filters),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

// Canonical headers for the import sheet. Each one resolves through
// HEADER_FIELD_MAP, so a file exported with these columns re-imports as-is.
const IMPORT_TEMPLATE_COLUMNS = [
  { header: 'COMPANY NAME', value: (row) => row.companyName },
  { header: 'CATEGORY', value: (row) => row.category },
  {
    header: 'CONTACT PERSON',
    value: (row) => [row.firstName, row.lastName].filter(Boolean).join(' '),
  },
  { header: 'DESIGNATION', value: (row) => row.designation },
  { header: 'CONTACT NUMBER', value: (row) => row.contactNumber },
  { header: 'WHATSAPP NO.', value: (row) => row.whatsappNumber },
  { header: 'EMAIL', value: (row) => row.email },
  { header: 'WEBSITE', value: (row) => row.website },
  { header: 'ADDRESS', value: (row) => row.address },
  { header: 'CITY/CITIES', value: (row) => row.cities },
  { header: 'STATE', value: (row) => row.state },
  { header: 'PINCODE', value: (row) => row.pincode },
  { header: 'STAFF SIZE', value: (row) => row.staffSize },
  { header: 'ABOUT US', value: (row) => row.aboutUs },
];

// Read-only context for the admin. Unmapped headers are ignored by the
// importer, so these extra columns do not break a re-upload.
const EXPORT_COLUMNS = [
  ...IMPORT_TEMPLATE_COLUMNS,
  { header: 'STATUS', value: (row) => row.status },
  { header: 'SOURCE FILE', value: (row) => row.sourceFileName },
  { header: 'IMPORTED ON', value: (row) => row.createdAt },
];

const TEMPLATE_SAMPLE_ROW = {
  companyName: 'Acme Veterinary Pvt Ltd',
  category: 'Veterinary Hospital',
  firstName: 'Ramesh',
  lastName: 'Kumar',
  designation: 'HR Manager',
  contactNumber: '9876543210',
  whatsappNumber: '9876543210',
  email: 'hr@acmevet.in',
  website: 'https://acmevet.in',
  address: '12 MG Road',
  cities: ['Jaipur', 'Ajmer'],
  state: 'Rajasthan',
  pincode: '302001',
  staffSize: '51-200',
  aboutUs: 'Multi-speciality veterinary care since 2005.',
};

/** Blank import sheet with one sample row showing the expected format. */
export function buildImportTemplateWorkbook() {
  return buildWorkbookBuffer({
    sheetName: 'Employer Import Format',
    columns: IMPORT_TEMPLATE_COLUMNS,
    rows: [TEMPLATE_SAMPLE_ROW],
  });
}

/** Every imported employer matching the admin's current search/status filters. */
export async function exportImportedEmployers(query = {}) {
  const rows = await ImportedEmployer.find(buildListFilters(query))
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  return buildWorkbookBuffer({
    sheetName: 'Imported Employers',
    columns: EXPORT_COLUMNS,
    rows,
  });
}

export async function deleteImportedEmployer(id) {
  const employer = await ImportedEmployer.findByIdAndDelete(id).lean();

  if (!employer) {
    throw new AppError('Imported employer not found', 404);
  }

  return employer;
}

function formatWebsite(website) {
  const value = cellText(website);

  if (!value) {
    return '';
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function findImportedEmployerPrefill(identifier) {
  const value = cellText(identifier);

  if (value.length < 5) {
    throw new AppError('Enter your full contact number, WhatsApp number, or email', 400);
  }

  let filters;
  if (value.includes('@')) {
    const email = normalizeEmail(value);
    if (!email) {
      throw new AppError('Enter a valid email address', 400);
    }
    filters = [{ email }];
  } else {
    const digits = normalizePhoneDigits(value);
    if (digits.length < 8) {
      throw new AppError('Enter a valid contact or WhatsApp number', 400);
    }
    filters = [
      { contactNumberDigits: digits },
      { whatsappNumberDigits: digits },
    ];
  }

  const employer = await ImportedEmployer.findOne({ $or: filters }).lean();

  if (!employer) {
    throw new AppError(
      'No imported employer record found for these details. Please fill the form manually.',
      404,
    );
  }

  const headquarters = [employer.cities?.[0], employer.state].filter(Boolean).join(', ');

  return {
    companyName: employer.companyName ?? '',
    organizationType: employer.category ?? '',
    firstName: employer.firstName ?? '',
    lastName: employer.lastName ?? '',
    phoneNumber: employer.contactNumberDigits || employer.whatsappNumberDigits || '',
    email: employer.email ?? '',
    website: formatWebsite(employer.website),
    teamSize: employer.staffSize ?? '',
    headquarters,
    overview: employer.aboutUs ?? '',
    hiringRegions: employer.cities ?? [],
    status: employer.status,
  };
}

export async function markImportedEmployerRegistered({ email, phoneNumber, profileId }) {
  const filters = buildIdentifierFilters({
    email: normalizeEmail(email),
    contactNumberDigits: normalizePhoneDigits(phoneNumber),
    whatsappNumberDigits: '',
  });

  if (filters.length === 0) {
    return;
  }

  await ImportedEmployer.updateMany(
    { $or: filters },
    { $set: { status: 'registered', registeredProfile: profileId ?? null } },
  );
}
