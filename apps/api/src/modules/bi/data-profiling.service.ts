import { isDate, parseISO } from 'date-fns';
import type { BiColumnSummary, BiDatasetModel, BiDatasetProfile, BiSchemaSummary } from './bi.types.js';

function isNumericValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return true;
  return false;
}

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

function isDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }
  return false;
}

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

export function buildSchemaSummary(rows: Record<string, unknown>[]): BiSchemaSummary {
  const first = rows[0] || {};
  return {
    columns: Object.keys(first).map((name) => ({
      name,
      type: detectColumnType(rows, name),
      nullable: rows.some((row) => row[name] === null || row[name] === undefined || row[name] === '')
    }))
  };
}

function detectColumnType(rows: Record<string, unknown>[], column: string): string {
  const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== '');
  if (!values.length) return 'unknown';
  const numeric = values.every((value) => isNumericValue(value));
  if (numeric) return 'number';
  const dates = values.filter((value) => isDateValue(value)).length;
  if (dates / values.length >= 0.7) return 'date';
  const booleans = values.filter((value) => typeof value === 'boolean' || ['true', 'false', '0', '1'].includes(String(value).toLowerCase())).length;
  if (booleans / values.length >= 0.7) return 'boolean';
  return 'string';
}

function median(values: number[]) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function profileRows(rows: Record<string, unknown>[]): BiDatasetProfile {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const summaries: BiColumnSummary[] = columns.map((column) => {
    const values = rows.map((row) => row[column]);
    const defined = values.filter((value) => value !== null && value !== undefined && value !== '');
    const uniqueValues = new Set(defined.map((value) => JSON.stringify(value)));
    const detectedType = detectColumnType(rows, column) as BiColumnSummary['detectedType'];
    const summary: BiColumnSummary = {
      name: column,
      detectedType,
      nullCount: values.length - defined.length,
      uniqueCount: uniqueValues.size,
      sampleValues: defined.slice(0, 5) as BiColumnSummary['sampleValues']
    };

    if (detectedType === 'number') {
      const numeric = defined.map(toNumber).filter((value) => Number.isFinite(value));
      if (numeric.length) {
        summary.min = Math.min(...numeric);
        summary.max = Math.max(...numeric);
        summary.average = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
        summary.median = median(numeric);
      }
    }

    if (detectedType === 'date') {
      const dates = defined.map(toDate).filter((value) => !Number.isNaN(value.getTime()));
      if (dates.length) {
        summary.min = new Date(Math.min(...dates.map((date) => date.getTime()))).toISOString();
        summary.max = new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString();
      }
    }

    const uniqueRatio = defined.length ? uniqueValues.size / defined.length : 0;
    if (detectedType === 'string' && uniqueRatio <= 0.4 && uniqueValues.size <= 50) {
      summary.role = 'dimension';
    } else if (detectedType === 'number') {
      summary.role = 'measure';
    } else if (detectedType === 'date') {
      summary.role = 'date';
    }

    if ((column.toLowerCase().includes('id') || column.toLowerCase().includes('codigo')) && uniqueValues.size === defined.length) {
      summary.role = 'key';
    }

    return summary;
  });

  const dimensionColumns = summaries.filter((column) => column.role === 'dimension' || column.role === 'key').map((column) => column.name);
  const measureColumns = summaries.filter((column) => column.role === 'measure').map((column) => column.name);
  const dateColumns = summaries.filter((column) => column.role === 'date').map((column) => column.name);
  const possibleKeys = summaries.filter((column) => column.role === 'key').map((column) => column.name);

  const issues = summaries.flatMap((column) => {
    const localIssues: string[] = [];
    if (column.nullCount > rows.length * 0.3) {
      localIssues.push(`Coluna ${column.name} possui muitos valores nulos.`);
    }
    if (column.detectedType === 'string' && column.uniqueCount <= 1) {
      localIssues.push(`Coluna ${column.name} parece constante.`);
    }
    return localIssues;
  });

  const suggestedTitle = columns.find((column) => /nome|title|titulo|dataset|relatorio/i.test(column)) || 'Dataset BI';

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columns: summaries,
    issues,
    dimensionColumns,
    measureColumns,
    dateColumns,
    possibleKeys,
    suggestedTitle
  };
}

export function buildBiModel(profile: BiDatasetProfile, factTableName = 'fato_principal'): BiDatasetModel {
  const relationships = profile.dimensionColumns.map((dimension) => ({
    from: factTableName,
    to: dimension,
    type: 'many-to-one' as const
  }));

  const hierarchies = profile.dateColumns.length
    ? [{
        name: 'Calendário',
        fields: ['Ano', 'Trimestre', 'Mês', profile.dateColumns[0]]
      }]
    : [];

  return {
    factTable: factTableName,
    dimensions: profile.dimensionColumns,
    measures: profile.measureColumns,
    dateField: profile.dateColumns[0],
    relationships,
    hierarchies,
    calendarGenerated: Boolean(profile.dateColumns.length)
  };
}

export function previewRows(rows: Record<string, unknown>[], limit = 10) {
  return rows.slice(0, limit);
}
