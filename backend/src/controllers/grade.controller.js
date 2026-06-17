import { pool, query } from "../config/database.js";
import { writeAuditLog } from "../services/audit-log.service.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

function validateScore(value, field) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be a number from 0 to 10`);
  }

  if (Math.abs(score * 10 - Math.round(score * 10)) > 1e-9) {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must have at most 1 decimal place`);
  }
}

function normalizeGradePayload(payload) {
  const grade = {
    attendanceScore: payload.attendanceScore ?? null,
    assignmentScore: payload.assignmentScore ?? null,
    midtermScore: payload.midtermScore ?? null,
    finalScore: payload.finalScore ?? null,
  };

  validateScore(grade.attendanceScore, "attendanceScore");
  validateScore(grade.assignmentScore, "assignmentScore");
  validateScore(grade.midtermScore, "midtermScore");
  validateScore(grade.finalScore, "finalScore");

  return grade;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return Number(value);
}

function scoreChanged(oldValue, nextValue) {
  const oldScore = toNullableNumber(oldValue);
  const nextScore = toNullableNumber(nextValue);

  if (oldScore === null || nextScore === null) {
    return oldScore !== nextScore;
  }

  return Math.abs(oldScore - nextScore) > 1e-9;
}

function gradeChanged(oldGrade, nextGrade) {
  if (!oldGrade) {
    return Object.values(nextGrade).some((value) => value !== null);
  }

  return (
    scoreChanged(oldGrade.attendance_score, nextGrade.attendanceScore) ||
    scoreChanged(oldGrade.assignment_score, nextGrade.assignmentScore) ||
    scoreChanged(oldGrade.midterm_score, nextGrade.midtermScore) ||
    scoreChanged(oldGrade.final_score, nextGrade.finalScore)
  );
}

function buildPlaceholders(rowCount, columnCount) {
  return Array.from({ length: rowCount }, () => `(${Array(columnCount).fill("?").join(", ")})`).join(", ");
}

async function ensureClassCanReceiveGrades(user, classSectionId) {
  const rows = await query(
    `SELECT cs.id, cs.is_grade_locked AS isGradeLocked, gep.is_open AS isPeriodOpen
     FROM class_sections cs
     JOIN lecturers l ON l.id = cs.lecturer_id
     LEFT JOIN grade_entry_periods gep
       ON gep.semester_id = cs.semester_id
      AND gep.is_open = TRUE
     WHERE cs.id = ?
       AND l.user_id = ?
     LIMIT 1`,
    [classSectionId, user.id],
  );

  const classSection = rows[0];

  if (!classSection) {
    throw new ApiError(403, "FORBIDDEN", "Lecturer is not assigned to this class");
  }

  if (classSection.isGradeLocked) {
    throw new ApiError(409, "CONFLICT", "Grade sheet is locked");
  }

  if (!classSection.isPeriodOpen) {
    throw new ApiError(403, "FORBIDDEN", "Grade entry period is closed");
  }
}

export async function saveBulkGrades(req, res) {
  const classSectionId = Number(req.body.classSectionId);
  const grades = Array.isArray(req.body.grades) ? req.body.grades : [];

  if (!classSectionId || grades.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "classSectionId and grades are required");
  }

  await ensureClassCanReceiveGrades(req.user, classSectionId);

  const connection = await pool.getConnection();
  const errors = [];
  let savedCount = 0;
  let skippedCount = 0;

  try {
    await connection.beginTransaction();

    const normalizedByEnrollment = new Map();

    for (const item of grades) {
      try {
        const enrollmentId = Number(item.enrollmentId);
        const grade = normalizeGradePayload(item);

        if (!enrollmentId) {
          throw new ApiError(422, "VALIDATION_ERROR", "enrollmentId is required");
        }

        normalizedByEnrollment.set(enrollmentId, { enrollmentId, grade });
      } catch (error) {
        errors.push({
          enrollmentId: item.enrollmentId,
          code: error.code || "ROW_ERROR",
          message: error.message,
        });
      }
    }

    const normalizedRows = [...normalizedByEnrollment.values()];

    if (normalizedRows.length > 0) {
      const enrollmentIds = normalizedRows.map((item) => item.enrollmentId);
      const enrollmentPlaceholders = enrollmentIds.map(() => "?").join(", ");
      const [enrollmentRows] = await connection.query(
        `SELECT id FROM enrollments WHERE class_section_id = ? AND id IN (${enrollmentPlaceholders})`,
        [classSectionId, ...enrollmentIds],
      );
      const validEnrollmentIds = new Set(enrollmentRows.map((row) => Number(row.id)));
      const validRows = [];

      for (const row of normalizedRows) {
        if (validEnrollmentIds.has(row.enrollmentId)) {
          validRows.push(row);
        } else {
          errors.push({
            enrollmentId: row.enrollmentId,
            code: "NOT_FOUND",
            message: "Enrollment not found in class",
          });
        }
      }

      if (validRows.length > 0) {
        const validEnrollmentIdList = validRows.map((row) => row.enrollmentId);
        const validPlaceholders = validEnrollmentIdList.map(() => "?").join(", ");
        const [oldRows] = await connection.query(
          `SELECT * FROM grades WHERE enrollment_id IN (${validPlaceholders})`,
          validEnrollmentIdList,
        );
        const oldByEnrollment = new Map(oldRows.map((row) => [Number(row.enrollment_id), row]));
        const changedRows = validRows.filter((row) => gradeChanged(oldByEnrollment.get(row.enrollmentId), row.grade));

        skippedCount = validRows.length - changedRows.length;

        if (changedRows.length > 0) {
          const gradeParams = changedRows.flatMap((row) => [
            row.enrollmentId,
            row.grade.attendanceScore,
            row.grade.assignmentScore,
            row.grade.midtermScore,
            row.grade.finalScore,
          ]);

          await connection.query(
            `INSERT INTO grades (
               enrollment_id, attendance_score, assignment_score, midterm_score, final_score
             )
             VALUES ${buildPlaceholders(changedRows.length, 5)}
             ON DUPLICATE KEY UPDATE
               attendance_score = VALUES(attendance_score),
               assignment_score = VALUES(assignment_score),
               midterm_score = VALUES(midterm_score),
               final_score = VALUES(final_score),
               updated_at = CURRENT_TIMESTAMP`,
            gradeParams,
          );

          const auditParams = changedRows.flatMap((row) => [
            req.user.id,
            "UPSERT_GRADE",
            "grades",
            row.enrollmentId,
            oldByEnrollment.has(row.enrollmentId) ? JSON.stringify(oldByEnrollment.get(row.enrollmentId)) : null,
            JSON.stringify(row.grade),
          ]);

          await connection.query(
            `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, old_value, new_value)
             VALUES ${buildPlaceholders(changedRows.length, 6)}`,
            auditParams,
          );

          savedCount = changedRows.length;
        }
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  sendSuccess(res, {
    savedCount,
    skippedCount,
    failedCount: errors.length,
    errors,
  });
}

export async function updateGrade(req, res) {
  const gradeId = Number(req.params.id);
  const grade = normalizeGradePayload(req.body);

  if (!gradeId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid grade id");
  }

  const rows = await query(
    `SELECT g.*, e.class_section_id AS classSectionId, cs.is_grade_locked AS isGradeLocked
     FROM grades g
     JOIN enrollments e ON e.id = g.enrollment_id
     JOIN class_sections cs ON cs.id = e.class_section_id
     WHERE g.id = ?
     LIMIT 1`,
    [gradeId],
  );
  const oldGrade = rows[0];

  if (!oldGrade) {
    throw new ApiError(404, "NOT_FOUND", "Grade not found");
  }

  if (req.user.role === "lecturer") {
    await ensureClassCanReceiveGrades(req.user, oldGrade.classSectionId);
  }

  if (req.user.role === "academic_staff" && oldGrade.isGradeLocked) {
    // Academic Staff can adjust locked grades for correction, audit log records the change.
  }

  await query(
    `UPDATE grades
     SET attendance_score = ?,
         assignment_score = ?,
         midterm_score = ?,
         final_score = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [grade.attendanceScore, grade.assignmentScore, grade.midtermScore, grade.finalScore, gradeId],
  );

  await writeAuditLog({
    actorUserId: req.user.id,
    action: "UPDATE_GRADE",
    entityType: "grades",
    entityId: gradeId,
    oldValue: oldGrade,
    newValue: grade,
  });

  sendSuccess(res, {
    id: gradeId,
    ...grade,
  });
}

