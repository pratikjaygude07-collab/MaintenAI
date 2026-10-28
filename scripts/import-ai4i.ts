import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  ai4iTelemetryRecords,
  dataOriginEnum,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const DATASET_NAME = "ai4i_2020";
const DATASET_SOURCE_URL =
  "https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset";
const DATASET_LICENSE = "CC BY 4.0";

interface ImportStats {
  rowsRead: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  rowsRejected: number;
  rejectionReasons: string[];
  failureCount: number;
  failureByMode: Record<string, number>;
}

interface AIRawRecord {
  udi: number;
  productId: string;
  type: string;
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  machineFailure: boolean;
  twf: boolean;
  hdf: boolean;
  pwf: boolean;
  osf: boolean;
  rnf: boolean;
}

export const REQUIRED_HEADERS = [
  "UDI",
  "Product ID",
  "Type",
  "Air temperature [K]",
  "Process temperature [K]",
  "Rotational speed [rpm]",
  "Torque [Nm]",
  "Tool wear [min]",
  "Machine failure",
  "TWF",
  "HDF",
  "PWF",
  "OSF",
  "RNF",
];

type ColumnMap = Map<string, number>;

export function parseCsv(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: string[][] = [];
  for (const line of lines) {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);
    rows.push(fields);
  }
  return rows;
}

export function buildColumnMap(headers: string[]): ColumnMap | null {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const map = new Map<string, number>();
  for (const required of REQUIRED_HEADERS) {
    const idx = normalizedHeaders.indexOf(required.toLowerCase());
    if (idx === -1) {
      return null;
    }
    map.set(required, idx);
  }
  return map;
}

export function parseRow(
  fields: string[],
  colMap: ColumnMap,
  lineNumber: number
): { record: AIRawRecord | null; reason: string | null } {
  const get = (header: string): string | null => {
    const idx = colMap.get(header);
    if (idx === undefined || idx >= fields.length) return null;
    const val = fields[idx]?.trim();
    return val === "" ? null : val;
  };

  const udiStr = get("UDI");
  const productId = get("Product ID");
  const type = get("Type");
  const airTempStr = get("Air temperature [K]");
  const processTempStr = get("Process temperature [K]");
  const rpmStr = get("Rotational speed [rpm]");
  const torqueStr = get("Torque [Nm]");
  const toolWearStr = get("Tool wear [min]");
  const machineFailureStr = get("Machine failure");
  const twfStr = get("TWF");
  const hdfStr = get("HDF");
  const pwfStr = get("PWF");
  const osfStr = get("OSF");
  const rnfStr = get("RNF");

  const errors: string[] = [];

  if (!udiStr) errors.push(`missing UDI at line ${lineNumber}`);
  if (!productId) errors.push(`missing Product ID at line ${lineNumber}`);
  if (!type || !["L", "M", "H"].includes(type)) {
    errors.push(`invalid Type "${type ?? ""}" at line ${lineNumber}`);
  }

  const parsePositiveNumber = (
    str: string | null,
    label: string
  ): { value: number | null; error: string | null } => {
    if (str === null) return { value: null, error: `missing ${label} at line ${lineNumber}` };
    const num = Number(str);
    if (!Number.isFinite(num) || num < 0) {
      return { value: null, error: `invalid ${label} "${str}" at line ${lineNumber}` };
    }
    return { value: num, error: null };
  };

  const parseIntNumber = (
    str: string | null,
    label: string
  ): { value: number | null; error: string | null } => {
    const res = parsePositiveNumber(str, label);
    if (res.error) return res;
    if (res.value !== null && !Number.isInteger(res.value)) {
      return { value: null, error: `non-integer ${label} "${str}" at line ${lineNumber}` };
    }
    return res;
  };

  const parseBinary = (
    str: string | null,
    label: string
  ): { value: boolean | null; error: string | null } => {
    if (str === null) return { value: null, error: `missing ${label} at line ${lineNumber}` };
    if (str === "0") return { value: false, error: null };
    if (str === "1") return { value: true, error: null };
    return { value: null, error: `invalid ${label} "${str}" at line ${lineNumber}` };
  };

  const udiRes = parseIntNumber(udiStr, "UDI");
  const airTempRes = parsePositiveNumber(airTempStr, "Air temperature [K]");
  const processTempRes = parsePositiveNumber(processTempStr, "Process temperature [K]");
  const rpmRes = parseIntNumber(rpmStr, "Rotational speed [rpm]");
  const torqueRes = parsePositiveNumber(torqueStr, "Torque [Nm]");
  const toolWearRes = parseIntNumber(toolWearStr, "Tool wear [min]");
  const mfRes = parseBinary(machineFailureStr, "Machine failure");
  const twfRes = parseBinary(twfStr, "TWF");
  const hdfRes = parseBinary(hdfStr, "HDF");
  const pwfRes = parseBinary(pwfStr, "PWF");
  const osfRes = parseBinary(osfStr, "OSF");
  const rnfRes = parseBinary(rnfStr, "RNF");

  for (const res of [
    udiRes, airTempRes, processTempRes, rpmRes, torqueRes, toolWearRes,
    mfRes, twfRes, hdfRes, pwfRes, osfRes, rnfRes,
  ]) {
    if (res.error) errors.push(res.error);
  }

  if (errors.length > 0) {
    return { record: null, reason: errors.join("; ") };
  }

  return {
    record: {
      udi: udiRes.value!,
      productId: productId!,
      type: type!,
      airTemperatureK: airTempRes.value!,
      processTemperatureK: processTempRes.value!,
      rotationalSpeedRpm: rpmRes.value!,
      torqueNm: torqueRes.value!,
      toolWearMin: toolWearRes.value!,
      machineFailure: mfRes.value!,
      twf: twfRes.value!,
      hdf: hdfRes.value!,
      pwf: pwfRes.value!,
      osf: osfRes.value!,
      rnf: rnfRes.value!,
    },
    reason: null,
  };
}

function readCsvFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = require("fs");
    fs.readFile(filePath, "utf8", (err: NodeJS.ErrnoException | null, data: string) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0] ?? "data/ai4i/ai4i-2020-predictive-maintenance.csv";

  if (!csvPath.endsWith(".csv")) {
    console.error("Error: CSV file path must end with .csv");
    process.exit(1);
  }

  let csvText: string;
  try {
    csvText = await readCsvFile(csvPath);
  } catch (err) {
    console.error(`Error: Could not read CSV file at "${csvPath}"`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    console.error("Error: CSV file must contain a header row and at least one data row.");
    process.exit(1);
  }

  const colMap = buildColumnMap(rows[0]);
  if (!colMap) {
    const missing = REQUIRED_HEADERS.filter((h) => !rows[0].some((c) => c.trim().toLowerCase() === h.toLowerCase()));
    console.error(`Error: CSV headers missing required columns: ${missing.join(", ")}`);
    process.exit(1);
  }

  const stats: ImportStats = {
    rowsRead: rows.length - 1,
    rowsInserted: 0,
    rowsUpdated: 0,
    rowsSkipped: 0,
    rowsRejected: 0,
    rejectionReasons: [],
    failureCount: 0,
    failureByMode: {},
  };

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await pool.query("BEGIN");

    for (let i = 1; i < rows.length; i++) {
      const lineNumber = i + 1;
      const { record, reason } = parseRow(rows[i], colMap, lineNumber);

      if (!record || reason) {
        stats.rowsRejected++;
        stats.rejectionReasons.push(`Line ${lineNumber}: ${reason ?? "parse failed"}`);
        continue;
      }

      if (record.machineFailure) {
        stats.failureCount++;
        for (const mode of ["twf", "hdf", "pwf", "osf", "rnf"]) {
          if (record[mode as keyof AIRawRecord]) {
            stats.failureByMode[mode] = (stats.failureByMode[mode] ?? 0) + 1;
          }
        }
      }

      const existing = await db
        .select({ udi: ai4iTelemetryRecords.udi })
        .from(ai4iTelemetryRecords)
        .where(eq(ai4iTelemetryRecords.udi, record.udi))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(ai4iTelemetryRecords)
          .set({
            productId: record.productId,
            type: record.type,
            airTemperatureK: record.airTemperatureK,
            processTemperatureK: record.processTemperatureK,
            rotationalSpeedRpm: record.rotationalSpeedRpm,
            torqueNm: record.torqueNm,
            toolWearMin: record.toolWearMin,
            machineFailure: record.machineFailure,
            twf: record.twf,
            hdf: record.hdf,
            pwf: record.pwf,
            osf: record.osf,
            rnf: record.rnf,
            sourceFile: csvPath,
            sourceDataset: DATASET_NAME,
            dataOrigin: "operational_telemetry",
            isFixtureSeed: false,
          })
          .where(eq(ai4iTelemetryRecords.udi, record.udi));
        stats.rowsUpdated++;
      } else {
        await db.insert(ai4iTelemetryRecords).values({
          udi: record.udi,
          productId: record.productId,
          type: record.type,
          airTemperatureK: record.airTemperatureK,
          processTemperatureK: record.processTemperatureK,
          rotationalSpeedRpm: record.rotationalSpeedRpm,
          torqueNm: record.torqueNm,
          toolWearMin: record.toolWearMin,
          machineFailure: record.machineFailure,
          twf: record.twf,
          hdf: record.hdf,
          pwf: record.pwf,
          osf: record.osf,
          rnf: record.rnf,
          sourceFile: csvPath,
          sourceDataset: DATASET_NAME,
          dataOrigin: "operational_telemetry",
          isFixtureSeed: false,
        });
        stats.rowsInserted++;
      }
    }

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Import failed, transaction rolled back:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log("AI4I dataset import complete:");
  console.log(`  Rows read:        ${stats.rowsRead}`);
  console.log(`  Rows inserted:    ${stats.rowsInserted}`);
  console.log(`  Rows updated:     ${stats.rowsUpdated}`);
  console.log(`  Rows skipped:     ${stats.rowsSkipped}`);
  console.log(`  Rows rejected:    ${stats.rowsRejected}`);
  console.log(`  Machine failures: ${stats.failureCount}`);
  console.log(`  Failure by mode:  ${JSON.stringify(stats.failureByMode)}`);
  if (stats.rejectionReasons.length > 0) {
    console.log(`  Rejection reasons (first 5):`);
    for (const r of stats.rejectionReasons.slice(0, 5)) {
      console.log(`    - ${r}`);
    }
  }
}

const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("import-ai4i.ts");

if (isDirectExecution) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
