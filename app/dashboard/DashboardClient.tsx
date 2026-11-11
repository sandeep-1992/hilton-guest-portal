'use client';

import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { parseGuestText, sheetToText, type GuestRow } from '@/lib/parseGuests';

export default function DashboardClient() {
  const [count, setCount] = useState<number | null>(null);
  const [countError, setCountError] = useState('');
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [parseNote, setParseNote] = useState('');
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const loadCount = useCallback(async () => {
    setCountError('');
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setCountError(data.error || 'Could not load the count right now.');
        return;
      }
      setCount(data.count);
    } catch {
      setCountError('Could not load the count right now.');
    }
  }, []);

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 60_000);
    return () => clearInterval(t);
  }, [loadCount]);

  async function onFile(file: File | null) {
    setParseNote('');
    setRows([]);
    setResults([]);
    if (!file) return;

    try {
      const name = file.name.toLowerCase();
      let text = '';
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buf = await file.arrayBuffer();
        const book = XLSX.read(buf, { type: 'array' });
        const sheet = book.Sheets[book.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
        text = sheetToText(matrix);
      } else {
        text = await file.text();
      }
      const parsed = parseGuestText(text);
      setRows(parsed.rows);
      if (parsed.errors.length) {
        setParseNote(`Some lines were skipped: ${parsed.errors.slice(0, 3).join(' ')}`);
      } else if (parsed.rows.length) {
        setParseNote(`${parsed.rows.length} guest${parsed.rows.length === 1 ? '' : 's'} ready to send.`);
      } else {
        setParseNote('We could not find any guests in that file. Please check the columns.');
      }
    } catch {
      setParseNote('We could not read that file. Please try Excel or a simple table file.');
    }
  }

  async function sendAll() {
    if (!rows.length || runState === 'running') return;
    setRunState('running');
    setProgress(0);
    setResults([]);
    setStatus('Sending guests one at a time. This may take a few minutes per person—please keep this page open.');

    const lines: string[] = [];
    let ok = 0;
    const max = Math.min(rows.length, 50);

    for (let i = 0; i < max; i++) {
      const row = rows[i];
      setProgress(Math.round(((i + 0.2) / max) * 100));
      setStatus(`Preparing ${row.guestName}… (${i + 1} of ${max})`);

      try {
        const res = await fetch('/api/guests/submit-one', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row }),
        });
        const data = await res.json();
        if (data.ok) {
          ok += 1;
          lines.push(`✓ ${row.guestName} — saved`);
        } else {
          lines.push(`✗ ${row.guestName} — ${data.error || 'not saved'}`);
        }
      } catch {
        lines.push(`✗ ${row.guestName} — please try again later`);
      }
      setProgress(Math.round(((i + 1) / max) * 100));
      setResults([...lines]);
    }

    setStatus(`Finished. ${ok} of ${max} guests saved.`);
    setRunState('done');
    loadCount();
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const preview = rows.slice(0, 5);

  return (
  <>
      <div className="topbar">
        <div>
          <p className="eyebrow" style={{ margin: 0, textAlign: 'left' }}>
            Front desk
          </p>
          <h1 className="brand-mark" style={{ textAlign: 'left', fontSize: '1.75rem' }}>
            Hilton
          </h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="stat-grid">
        <motionStat count={count} error={countError} onRefresh={loadCount} />
        <article className="stat">
          <div className="stat-label">Your upload</div>
          <div className="stat-value" style={{ fontSize: '2rem' }}>
            {rows.length || '—'}
          </div>
          <p className="stat-note">Guests ready from your latest spreadsheet</p>
        </article>
      </div>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, marginTop: 0 }}>
          Add guests from a spreadsheet
        </h2>
        <p className="muted">
          Use the same columns as your usual list: name, room, meal choice, number of guests, dates, and
          confirmation code.
        </p>
        <label htmlFor="file" style={{ marginTop: '1.25rem' }}>
          Choose file
        </label>
        <input
          id="file"
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {parseNote ? <p className="muted" style={{ marginTop: '1rem' }}>{parseNote}</p> : null}

        {preview.length > 0 ? (
          <table className="preview-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Meal</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r) => (
                <tr key={r.code}>
                  <td>{r.guestName}</td>
                  <td>{r.roomNumber}</td>
                  <td>{r.food}</td>
                  <td>{r.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {rows.length > 5 ? <p className="muted">…and {rows.length - 5} more</p> : null}

        <button
          type="button"
          className="btn"
          style={{ marginTop: '1.5rem' }}
          disabled={!rows.length || runState === 'running'}
          onClick={sendAll}
        >
          {runState === 'running' ? 'Sending…' : 'Send to front desk'}
        </button>

        {runState !== 'idle' ? (
          <>
            <div className="progress" aria-hidden>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="muted" style={{ marginTop: '0.75rem' }}>{status}</p>
          </>
        ) : null}

        {results.length > 0 ? (
          <pre
            style={{
              marginTop: '1rem',
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem',
              background: '#faf8f5',
              padding: '1rem',
              border: '1px solid #e4dfd6',
            }}
          >
            {results.join('\n')}
          </pre>
        ) : null}
      </section>
    </>
  );
}

function motionStat({
  count,
  error,
  onRefresh,
}: {
  count: number | null;
  error: string;
  onRefresh: () => void;
}) {
  return (
    <article className="stat">
      <div className="stat-label">Guests on file</div>
      <div className="stat-value">{count != null ? count.toLocaleString() : '—'}</div>
      <p className="stat-note">
        {error
          ? error
          : 'Live total from your property records. Updates about every minute.'}
      </p>
      <button type="button" className="btn btn-ghost" style={{ marginTop: '0.75rem' }} onClick={onRefresh}>
        Refresh
      </button>
    </article>
  );
}
