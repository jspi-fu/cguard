import * as XLSX from 'xlsx';
import type { BatchTemplateRow } from '../types';
import type { WorkBook } from 'xlsx';

import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

(XLSX as unknown as { set_cptable: (table: typeof cpexcel) => void }).set_cptable?.(
  cpexcel as unknown as typeof cpexcel,
);

const SUPPORTED_ENCODINGS = ['utf-8', 'gbk', 'gb2312'] as const;

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : '';

const decodeBuffer = (buffer: ArrayBuffer): string => {
  const uint8 = new Uint8Array(buffer);
  for (const encoding of SUPPORTED_ENCODINGS) {
    try {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(uint8);
    } catch {
      continue;
    }
  }
  return new TextDecoder().decode(uint8);
};

const readWorkbook = async (file: File): Promise<WorkBook> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (ext === 'csv') {
    const text = decodeBuffer(buffer);
    return XLSX.read(text, { type: 'string' });
  }

  return XLSX.read(buffer, { type: 'array' });
};

export const parseBatchTemplate = async (file: File): Promise<BatchTemplateRow[]> => {
  const workbook = await readWorkbook(file);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return rows
    .map((row) => {
      const id = normalizeString(row.ID ?? row.id ?? row.Id);
      const content = normalizeString(row.content ?? row.Content);
      const photo = normalizeString(row.photo ?? row.Photo);

      return {
        id,
        content: content || undefined,
        photo: photo || undefined,
      };
    })
    .filter((row) => row.id);
};

type TemplateFormat = 'csv' | 'xlsx' | 'xls';

export const downloadBatchTemplate = (format: TemplateFormat) => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['ID', 'content', 'photo'],
    ['1', '示例文本内容', 'https://example.com/image.jpg'],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const bookType = format === 'xls' ? 'biff8' : format;
  const filename = `review_template.${format}`;

  XLSX.writeFile(workbook, filename, { bookType });
};

export const createAttachmentKey = (raw?: string) => {
  if (!raw) {
    return '';
  }
  const base = raw.split(/[/\\]/).pop();
  return (base || raw).trim().toLowerCase();
};

