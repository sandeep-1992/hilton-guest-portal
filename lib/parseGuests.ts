export type GuestRow = {
  guestName: string;
  roomNumber: string;
  food: 'Breakfast' | 'Lunch' | 'Dinner';
  numberOfGuests: number;
  checkInDate: string;
  checkOutDate: string;
  code: string;
};

const FOOD = new Set(['Breakfast', 'Lunch', 'Dinner']);

const HEADER_MAP: Record<string, keyof GuestRow | null> = {
  'guest name': 'guestName',
  guestname: 'guestName',
  name: 'guestName',
  'room number': 'roomNumber',
  roomnumber: 'roomNumber',
  room: 'roomNumber',
  food: 'food',
  'number of guests': 'numberOfGuests',
  numberofguests: 'numberOfGuests',
  guests: 'numberOfGuests',
  'check-in date': 'checkInDate',
  checkindate: 'checkInDate',
  checkin: 'checkInDate',
  'check-out date': 'checkOutDate',
  checkoutdate: 'checkOutDate',
  checkout: 'checkOutDate',
  code: 'code',
  confirmation: 'code',
};

function normHeader(cell: string) {
  return cell.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatDateForForm(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t').map((c) => c.trim());
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseGuestText(text: string): { rows: GuestRow[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
  const errors: string[] = [];
  if (!lines.length) return { rows: [], errors: ['The file looks empty.'] };

  const tabs = (lines[0].match(/\t/g) || []).length;
  const commas = (lines[0].match(/,/g) || []).length;
  const delimiter = tabs > commas ? '\t' : ',';

  const headerCells = splitCsvLine(lines[0], delimiter);
  const keys = headerCells.map((h) => {
    const compact = normHeader(h).replace(/ /g, '');
    const spaced = normHeader(h);
    return HEADER_MAP[spaced] || HEADER_MAP[compact] || null;
  });

  const rows: GuestRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const rec: Partial<GuestRow> = {};
    keys.forEach((key, idx) => {
      if (!key) return;
      (rec as Record<string, string | number>)[key] = cells[idx]?.trim() ?? '';
    });
    const guestName = String(rec.guestName || '').trim();
    if (!guestName) continue;

    const food = String(rec.food || '').trim();
    if (!FOOD.has(food)) {
      errors.push(`Row ${i + 1}: please choose Breakfast, Lunch, or Dinner.`);
      continue;
    }

    const numberOfGuests = Number(rec.numberOfGuests);
    if (!Number.isFinite(numberOfGuests) || numberOfGuests < 1) {
      errors.push(`Row ${i + 1}: number of guests must be at least 1.`);
      continue;
    }

    rows.push({
      guestName,
      roomNumber: String(rec.roomNumber || '').trim(),
      food: food as GuestRow['food'],
      numberOfGuests,
      checkInDate: formatDateForForm(String(rec.checkInDate || '')),
      checkOutDate: formatDateForForm(String(rec.checkOutDate || '')),
      code: String(rec.code || '').trim(),
    });
  }

  return { rows, errors };
}

/** Parse first sheet of an Excel workbook into the same shape as CSV/TSV text. */
export function sheetToText(rows: unknown[][]): string {
  return rows
    .map((row) =>
      (row || [])
        .map((c) => {
          const s = c == null ? '' : String(c);
          return s.includes(',') || s.includes('\t') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join('\t'),
    )
    .join('\n');
}
