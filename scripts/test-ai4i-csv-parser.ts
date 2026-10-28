import { readFileSync } from "fs";
import { parseCsv, buildColumnMap, parseRow, REQUIRED_HEADERS } from "../scripts/import-ai4i";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    console.error(`FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// Test 1: CSV header validation
const validCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,L,298.1,308.6,2469,12.8,143,0,0,0,0,0,0`;
const rows = parseCsv(validCsv);
assert(rows.length === 2, "parseCsv returns header + 1 data row");
assert(rows[0].length === 14, "parseCsv returns 14 columns");

const colMap = buildColumnMap(rows[0]);
assert(colMap !== null, "buildColumnMap finds all required headers");

// Test 2: Missing headers
const badCsv = "UDI,Product ID,Type\n1,L001863,L";
const badRows = parseCsv(badCsv);
const badMap = buildColumnMap(badRows[0]);
assert(badMap === null, "buildColumnMap returns null for missing headers");

// Test 3: Valid row parsing
const { record, reason } = parseRow(rows[1], colMap!, 2);
assert(record !== null, "parseRow returns a record for valid row");
assert(reason === null, "parseRow returns null reason for valid row");
if (record) {
  assertEqual(record.udi, 1, "udi parsed correctly");
  assertEqual(record.productId, "L001863", "productId parsed correctly");
  assertEqual(record.type, "L", "type parsed correctly");
  assertEqual(record.airTemperatureK, 298.1, "airTemperatureK parsed correctly");
  assertEqual(record.processTemperatureK, 308.6, "processTemperatureK parsed correctly");
  assertEqual(record.rotationalSpeedRpm, 2469, "rotationalSpeedRpm parsed correctly");
  assertEqual(record.torqueNm, 12.8, "torqueNm parsed correctly");
  assertEqual(record.toolWearMin, 143, "toolWearMin parsed correctly");
  assertEqual(record.machineFailure, false, "machineFailure parsed correctly");
  assertEqual(record.twf, false, "twf parsed correctly");
}

// Test 4: Invalid Type value
const badTypeCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,X,298.1,308.6,2469,12.8,143,0,0,0,0,0,0`;
const badTypeRows = parseCsv(badTypeCsv);
const badTypeMap = buildColumnMap(badTypeRows[0]);
const { record: badRecord, reason: badReason } = parseRow(badTypeRows[1], badTypeMap!, 2);
assert(badRecord === null, "parseRow returns null for invalid Type");
assert(badReason !== null && badReason.includes("invalid Type"), "parseRow reports invalid Type");

// Test 5: Missing required field
const missingFieldCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [kmissing],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,L,298.1,308.6,2469,12.8,143,0,0,0,0,0,0`;
const missingFieldRows = parseCsv(missingFieldCsv);
const missingFieldMap = buildColumnMap(missingFieldRows[0]);
assert(missingFieldMap === null, "buildColumnMap returns null for missing Process temperature [K]");

// Test 6: Binary field parsing
const binaryCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,L,298.1,308.6,2469,12.8,143,1,1,0,1,0,0`;
const binaryRows = parseCsv(binaryCsv);
const binaryMap = buildColumnMap(binaryRows[0]);
const { record: binRecord } = parseRow(binaryRows[1], binaryMap!, 2);
if (binRecord) {
  assertEqual(binRecord.machineFailure, true, "machineFailure=true parsed correctly");
  assertEqual(binRecord.twf, true, "twf=true parsed correctly");
  assertEqual(binRecord.hdf, false, "hdf=false parsed correctly");
  assertEqual(binRecord.pwf, true, "pwf=true parsed correctly");
}

// Test 7: Negative values rejected
const negativeCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,L,-1.0,308.6,2469,12.8,143,0,0,0,0,0,0`;
const negativeRows = parseCsv(negativeCsv);
const negativeMap = buildColumnMap(negativeRows[0]);
const { record: negRecord, reason: negReason } = parseRow(negativeRows[1], negativeMap!, 2);
assert(negRecord === null, "parseRow returns null for negative temperature");
assert(negReason !== null && negReason.includes("invalid"), "parseRow reports invalid negative value");

// Test 8: Non-binary values rejected
const nonBinaryCsv = `UDI,Product ID,Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min],Machine failure,TWF,HDF,PWF,OSF,RNF
1,L001863,L,298.1,308.6,2469,12.8,143,2,0,0,0,0,0`;
const nonBinaryRows = parseCsv(nonBinaryCsv);
const nonBinaryMap = buildColumnMap(nonBinaryRows[0]);
const { record: nbRecord, reason: nbReason } = parseRow(nonBinaryRows[1], nonBinaryMap!, 2);
assert(nbRecord === null, "parseRow returns null for non-binary machine failure");
assert(nbReason !== null && nbReason.includes("invalid"), "parseRow reports invalid machine failure value");

console.log("\nAll CSV parsing tests completed.");
