import { randomUUID } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import type {
  BiDashboardRecord,
  BiDataSourceRecord,
  BiDatasetRecord,
  BiMetricRecord,
  BiQueryRecord,
  BiReportRecord,
  BiTransformationStep
} from './bi.types.js';

const memory = {
  dataSources: new Map<string, BiDataSourceRecord>(),
  datasets: new Map<string, BiDatasetRecord>(),
  transformations: new Map<string, BiTransformationStep[]>(),
  metrics: new Map<string, BiMetricRecord[]>(),
  dashboards: new Map<string, BiDashboardRecord>(),
  reports: new Map<string, BiReportRecord>(),
  queries: new Map<string, BiQueryRecord[]>()
};

export function resetBiStore() {
  memory.dataSources.clear();
  memory.datasets.clear();
  memory.transformations.clear();
  memory.metrics.clear();
  memory.dashboards.clear();
  memory.reports.clear();
  memory.queries.clear();
}

function toJson(value: unknown) {
  return value as never;
}

function dataSourceRowToRecord(row: any): BiDataSourceRecord {
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    name: row.name,
    type: row.type,
    status: row.status,
    configEncryptedJson: row.configEncryptedJson ?? undefined,
    lastSyncAt: row.lastSyncAt ? new Date(row.lastSyncAt).toISOString() : undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString()
  };
}

function datasetRowToRecord(row: any): BiDatasetRecord {
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    dataSourceId: row.dataSourceId || undefined,
    name: row.name,
    description: row.description,
    status: row.status,
    rowCount: row.rowCount,
    columnCount: row.columnCount,
    storagePath: row.storagePath,
    schemaJson: row.schemaJson ?? undefined,
    profileJson: row.profileJson ?? undefined,
    modelJson: row.modelJson ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString()
  };
}

function metricRowToRecord(row: any): BiMetricRecord {
  return {
    id: row.id,
    datasetId: row.datasetId,
    userId: row.userId,
    name: row.name,
    description: row.description,
    expressionJson: row.expressionJson ?? undefined,
    aggregation: row.aggregation,
    field: row.field,
    format: row.format,
    createdAt: new Date(row.createdAt).toISOString()
  };
}

function dashboardRowToRecord(row: any): BiDashboardRecord {
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    datasetId: row.datasetId,
    title: row.title,
    description: row.description,
    layoutJson: row.layoutJson,
    filtersJson: row.filtersJson ?? undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString()
  };
}

function queryRowToRecord(row: any): BiQueryRecord {
  return {
    id: row.id,
    userId: row.userId,
    datasetId: row.datasetId,
    question: row.question,
    answer: row.answer,
    queryJson: row.queryJson ?? undefined,
    createdAt: new Date(row.createdAt).toISOString()
  };
}

export async function saveBiDataSource(record: BiDataSourceRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biDataSource.upsert({
        where: { id: record.id },
        update: {
          name: record.name,
          type: record.type,
          status: record.status,
          configEncryptedJson: record.configEncryptedJson ? toJson(record.configEncryptedJson) : undefined,
          lastSyncAt: record.lastSyncAt ? new Date(record.lastSyncAt) : null
        },
        create: {
          id: record.id,
          userId: record.userId,
          tenantId: record.tenantId,
          name: record.name,
          type: record.type,
          status: record.status,
          configEncryptedJson: record.configEncryptedJson ? toJson(record.configEncryptedJson) : null,
          lastSyncAt: record.lastSyncAt ? new Date(record.lastSyncAt) : null
        }
      });
    }
    return record;
  }

  memory.dataSources.set(record.id, record);
  return record;
}

export async function listBiDataSources(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biDataSource.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
      return rows.map(dataSourceRowToRecord);
    }
  }

  return [...memory.dataSources.values()].filter((item) => item.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBiDataSource(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.biDataSource.findUnique({ where: { id } });
      return row ? dataSourceRowToRecord(row) : null;
    }
  }

  return memory.dataSources.get(id) || null;
}

export async function deleteBiDataSource(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biDataSource.deleteMany({ where: { id } });
      return;
    }
  }

  memory.dataSources.delete(id);
}

export async function saveBiDataset(record: BiDatasetRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biDataset.upsert({
        where: { id: record.id },
        update: {
          name: record.name,
          description: record.description,
          status: record.status,
          rowCount: record.rowCount,
          columnCount: record.columnCount,
          storagePath: record.storagePath,
          schemaJson: record.schemaJson ? toJson(record.schemaJson) : undefined,
          profileJson: record.profileJson ? toJson(record.profileJson) : undefined,
          modelJson: record.modelJson ? toJson(record.modelJson) : undefined
        },
        create: {
          id: record.id,
          userId: record.userId,
          tenantId: record.tenantId,
          dataSourceId: record.dataSourceId || null,
          name: record.name,
          description: record.description,
          status: record.status,
          rowCount: record.rowCount,
          columnCount: record.columnCount,
          storagePath: record.storagePath,
          schemaJson: record.schemaJson ? toJson(record.schemaJson) : null,
          profileJson: record.profileJson ? toJson(record.profileJson) : null,
          modelJson: record.modelJson ? toJson(record.modelJson) : null
        }
      });
    }
    return record;
  }

  memory.datasets.set(record.id, record);
  return record;
}

export async function listBiDatasets(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biDataset.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
      return rows.map(datasetRowToRecord);
    }
  }

  return [...memory.datasets.values()].filter((item) => item.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBiDataset(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.biDataset.findUnique({ where: { id } });
      return row ? datasetRowToRecord(row) : null;
    }
  }

  return memory.datasets.get(id) || null;
}

export async function deleteBiDataset(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biDataset.deleteMany({ where: { id } });
      await prisma.biTransformation.deleteMany({ where: { datasetId: id } });
      await prisma.biMetric.deleteMany({ where: { datasetId: id } });
      await prisma.biDashboard.deleteMany({ where: { datasetId: id } });
      await prisma.biQuery.deleteMany({ where: { datasetId: id } });
      return;
    }
  }

  memory.datasets.delete(id);
  memory.transformations.delete(id);
  memory.metrics.delete(id);
  memory.dashboards.delete(id);
  memory.queries.delete(id);
}

export async function saveBiTransformation(record: BiTransformationStep) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biTransformation.upsert({
        where: { id: record.id },
        update: {
          stepOrder: record.stepOrder,
          type: record.type,
          configJson: record.configJson ? toJson(record.configJson) : undefined
        },
        create: {
          id: record.id,
          datasetId: record.datasetId,
          userId: record.userId,
          stepOrder: record.stepOrder,
          type: record.type,
          configJson: record.configJson ? toJson(record.configJson) : null
        }
      });
    }
    return record;
  }

  const current = memory.transformations.get(record.datasetId) || [];
  const next = [...current.filter((item) => item.id !== record.id), record].sort((a, b) => a.stepOrder - b.stepOrder);
  memory.transformations.set(record.datasetId, next);
  return record;
}

export async function listBiTransformations(datasetId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biTransformation.findMany({ where: { datasetId }, orderBy: { stepOrder: 'asc' } });
      return rows.map((row) => ({
        id: row.id,
        datasetId: row.datasetId,
        userId: row.userId,
        stepOrder: row.stepOrder,
        type: row.type,
        configJson: row.configJson ?? undefined,
        createdAt: new Date(row.createdAt).toISOString()
      }));
    }
  }

  return memory.transformations.get(datasetId) || [];
}

export async function saveBiMetric(record: BiMetricRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biMetric.upsert({
        where: { id: record.id },
        update: {
          name: record.name,
          description: record.description,
          expressionJson: record.expressionJson ? toJson(record.expressionJson) : undefined,
          aggregation: record.aggregation,
          field: record.field,
          format: record.format
        },
        create: {
          id: record.id,
          datasetId: record.datasetId,
          userId: record.userId,
          name: record.name,
          description: record.description,
          expressionJson: record.expressionJson ? toJson(record.expressionJson) : null,
          aggregation: record.aggregation,
          field: record.field,
          format: record.format
        }
      });
    }
    return record;
  }

  const current = memory.metrics.get(record.datasetId) || [];
  const next = [...current.filter((item) => item.id !== record.id), record];
  memory.metrics.set(record.datasetId, next);
  return record;
}

export async function listBiMetrics(datasetId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biMetric.findMany({ where: { datasetId }, orderBy: { createdAt: 'asc' } });
      return rows.map(metricRowToRecord);
    }
  }

  return memory.metrics.get(datasetId) || [];
}

export async function saveBiDashboard(record: BiDashboardRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biDashboard.upsert({
        where: { id: record.id },
        update: {
          title: record.title,
          description: record.description,
          layoutJson: toJson(record.layoutJson),
          filtersJson: record.filtersJson ? toJson(record.filtersJson) : undefined
        },
        create: {
          id: record.id,
          userId: record.userId,
          tenantId: record.tenantId,
          datasetId: record.datasetId,
          title: record.title,
          description: record.description,
          layoutJson: toJson(record.layoutJson),
          filtersJson: record.filtersJson ? toJson(record.filtersJson) : null
        }
      });
    }
    return record;
  }

  memory.dashboards.set(record.id, record);
  return record;
}

export async function listBiDashboards(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biDashboard.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
      return rows.map(dashboardRowToRecord);
    }
  }

  return [...memory.dashboards.values()].filter((item) => item.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBiDashboard(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.biDashboard.findUnique({ where: { id } });
      return row ? dashboardRowToRecord(row) : null;
    }
  }

  return memory.dashboards.get(id) || null;
}

export async function saveBiReport(record: BiReportRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biReport.create({
        data: {
          id: record.id,
          userId: record.userId,
          dashboardId: record.dashboardId,
          title: record.title,
          summary: record.summary,
          exportPath: record.exportPath
        }
      });
    }
    return record;
  }

  memory.reports.set(record.id, record);
  return record;
}

export async function saveBiQuery(record: BiQueryRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.biQuery.create({
        data: {
          id: record.id,
          userId: record.userId,
          datasetId: record.datasetId,
          question: record.question,
          answer: record.answer,
          queryJson: record.queryJson ? toJson(record.queryJson) : null
        }
      });
    }
    return record;
  }

  const current = memory.queries.get(record.datasetId) || [];
  current.unshift(record);
  memory.queries.set(record.datasetId, current);
  return record;
}

export async function listBiQueries(datasetId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.biQuery.findMany({ where: { datasetId }, orderBy: { createdAt: 'desc' } });
      return rows.map(queryRowToRecord);
    }
  }

  return memory.queries.get(datasetId) || [];
}
