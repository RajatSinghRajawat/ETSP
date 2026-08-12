import * as XLSX from 'xlsx';

const MIN_COLUMN_WIDTH = 12;
const MAX_COLUMN_WIDTH = 50;

function cellText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

/**
 * Build an .xlsx buffer from a column spec.
 *
 * Every cell is written as text so long phone numbers and pincodes survive the
 * round-trip instead of being reformatted into scientific notation by Excel.
 *
 * @param {object} options
 * @param {string} options.sheetName
 * @param {Array<{header: string, value: (row: object) => unknown}>} options.columns
 * @param {Array<object>} options.rows
 * @returns {Buffer}
 */
export function buildWorkbookBuffer({ sheetName, columns, rows }) {
  const headerRow = columns.map((column) => column.header);
  const bodyRows = rows.map((row) => columns.map((column) => cellText(column.value(row))));

  const sheet = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows], { cellDates: false });

  sheet['!cols'] = columns.map((column, columnIndex) => {
    const widest = bodyRows.reduce(
      (max, row) => Math.max(max, row[columnIndex]?.length ?? 0),
      column.header.length,
    );
    return { wch: Math.min(Math.max(widest + 2, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH) };
  });

  const workbook = XLSX.utils.book_new();
  // Excel rejects sheet names over 31 chars or containing []:*?/\
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.replace(/[[\]:*?/\\]/g, '').slice(0, 31));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
