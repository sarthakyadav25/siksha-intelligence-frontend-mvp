import type { ParsedSheetData } from "../types";

export const STUDENT_HEADERS: string[] = [
  "firstName",
  "lastName",
  "middleName",
  "email",
  "dateOfBirth",
  "rollNo",
  "gender",
  "enrollmentNumber",
  "enrollmentDate",
  "className",
  "sectionName",
];

export const STAFF_HEADERS: string[] = [
  "firstName",
  "lastName",
  "middleName",
  "email",
  "dateOfBirth",
  "gender",
  "employeeId",
  "joiningDate",
  "jobTitle",
  "department",
  "staffType",
];

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateString(val: string | undefined | null): boolean {
  return val != null && String(val).trim() !== "";
}

function validateEmail(val: string | undefined | null): boolean {
  if (!validateString(val)) return false;
  return EMAIL_PATTERN.test(String(val).trim());
}

function validateDate(val: string | undefined | null): boolean {
  if (!validateString(val)) return false;
  const trimmed = String(val).trim();
  if (!DATE_PATTERN.test(trimmed)) return false;
  const date = new Date(trimmed);
  return !isNaN(date.getTime());
}

function validateInt(val: string | undefined | null): boolean {
  if (!validateString(val)) return false;
  const num = Number(val);
  return !isNaN(num) && Number.isInteger(num);
}

// Case insensitive enum matcher
function validateEnum(val: string | undefined | null, allowedValues: string[]): boolean {
  if (!validateString(val)) return false;
  const lowerVal = String(val).trim().toLowerCase();
  return allowedValues.map((v) => v.toLowerCase()).includes(lowerVal);
}

/**
 * Validates the uploaded CSV/Excel headers and raw row data
 * based on the backend CsvValidationHelper.java rules.
 *
 * @returns An error message string if invalid, or null if fully valid.
 */
export function validateCsvData(
  userType: "students" | "staff",
  data: ParsedSheetData
): string | null {
  const expectedHeaders = userType === "students" ? STUDENT_HEADERS : STAFF_HEADERS;

  // 1. Validate Headers
  const uploadedHeaders = data.headers.map((h) => h.trim());
  const missingHeaders = expectedHeaders.filter((h) => !uploadedHeaders.includes(h));

  if (missingHeaders.length > 0) {
    return `Invalid CSV header. Expected: [${expectedHeaders.join(", ")}]. Missing: [${missingHeaders.join(", ")}]. You might have uploaded the wrong template!`;
  }

  // 2. Validate Data Types per row
  const headerIndices: Record<string, number> = {};
  uploadedHeaders.forEach((h, i) => {
    headerIndices[h] = i;
  });

  for (let i = 0; i < data.rows.length; i++) {
    const row = data.rows[i];
    // Row 1 is headers, so i=0 is Row 2 in Excel
    const rowNum = i + 2;

    const firstName = row[headerIndices["firstName"]];
    if (!validateString(firstName)) return `Row ${rowNum}: firstName cannot be empty.`;

    const lastName = row[headerIndices["lastName"]];
    if (!validateString(lastName)) return `Row ${rowNum}: lastName cannot be empty.`;

    const email = row[headerIndices["email"]];
    if (!validateEmail(email)) return `Row ${rowNum}: Invalid email format '${email || ""}'.`;

    const dob = row[headerIndices["dateOfBirth"]];
    if (validateString(dob) && !validateDate(dob)) {
      return `Row ${rowNum}: Invalid dateOfBirth '${dob}'. Expected format: yyyy-MM-dd.`;
    }

    const gender = row[headerIndices["gender"]];
    if (validateString(gender) && !validateEnum(gender, ["MALE", "FEMALE", "OTHER"])) {
      return `Row ${rowNum}: Invalid gender '${gender}'. Expected MALE, FEMALE, or OTHER.`;
    }

    if (userType === "students") {
      const rollNo = row[headerIndices["rollNo"]];
      if (validateString(rollNo) && !validateInt(rollNo)) {
        return `Row ${rowNum}: rollNo is not a valid number: '${rollNo}'.`;
      }

      const enrollmentNumber = row[headerIndices["enrollmentNumber"]];
      if (!validateString(enrollmentNumber)) {
        return `Row ${rowNum}: enrollmentNumber cannot be empty.`;
      }

      const enrollmentDate = row[headerIndices["enrollmentDate"]];
      if (validateString(enrollmentDate) && !validateDate(enrollmentDate)) {
        return `Row ${rowNum}: Invalid enrollmentDate '${enrollmentDate}'. Expected format: yyyy-MM-dd.`;
      }

      const className = row[headerIndices["className"]];
      if (!validateString(className)) return `Row ${rowNum}: className cannot be empty.`;

      const sectionName = row[headerIndices["sectionName"]];
      if (!validateString(sectionName)) return `Row ${rowNum}: sectionName cannot be empty.`;
    } else {
      // staff validation
      const employeeId = row[headerIndices["employeeId"]];
      if (!validateString(employeeId)) return `Row ${rowNum}: employeeId cannot be empty.`;

      const joiningDate = row[headerIndices["joiningDate"]];
      if (validateString(joiningDate) && !validateDate(joiningDate)) {
        return `Row ${rowNum}: Invalid joiningDate '${joiningDate}'. Expected format: yyyy-MM-dd.`;
      }

      const staffType = row[headerIndices["staffType"]];
      if (!validateString(staffType)) {
        return `Row ${rowNum}: staffType cannot be empty.`;
      }
    }
  }

  return null;
}
