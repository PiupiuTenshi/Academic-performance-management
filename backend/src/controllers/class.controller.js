import { pool, query } from "../config/database.js";
import { writeAuditLog } from "../services/audit-log.service.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

async function ensureLecturerOwnsClass(user, classSectionId) {
  if (["academic_staff", "admin"].includes(user.role)) {
    return;
  }

  if (user.role !== "lecturer") {
    throw new ApiError(403, "FORBIDDEN", "Only assigned lecturers can access this class");
  }

  const rows = await query(
    `SELECT cs.id
     FROM class_sections cs
     JOIN lecturers l ON l.id = cs.lecturer_id
     WHERE cs.id = ? AND l.user_id = ?
     LIMIT 1`,
    [classSectionId, user.id],
  );

  if (!rows[0]) {
    throw new ApiError(403, "FORBIDDEN", "Lecturer is not assigned to this class");
  }
}

export async function getClassStudents(req, res) {
  const classSectionId = Number(req.params.id);

  if (!classSectionId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid class id");
  }

  await ensureLecturerOwnsClass(req.user, classSectionId);

  const classRows = await query(
    `SELECT id, section_code AS sectionCode, is_grade_locked AS isGradeLocked
     FROM class_sections
     WHERE id = ?
     LIMIT 1`,
    [classSectionId],
  );

  if (!classRows[0]) {
    throw new ApiError(404, "NOT_FOUND", "Class section not found");
  }

  const students = await query(
    `SELECT
       e.id AS enrollmentId,
       s.id AS studentId,
       s.student_code AS studentCode,
       s.full_name AS fullName,
       g.id AS gradeId,
       g.attendance_score AS attendanceScore,
       g.assignment_score AS assignmentScore,
       g.midterm_score AS midtermScore,
       g.final_score AS finalScore,
       g.total_score AS totalScore,
       g.status
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     LEFT JOIN grades g ON g.enrollment_id = e.id
     WHERE e.class_section_id = ?
     ORDER BY s.student_code`,
    [classSectionId],
  );

  sendSuccess(res, {
    classSection: classRows[0],
    students,
  });
}

export async function lockGrades(req, res) {
  const classSectionId = Number(req.params.id);

  if (!classSectionId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid class id");
  }

  await ensureLecturerOwnsClass(req.user, classSectionId);

  const missingRows = await query(
    `SELECT COUNT(*) AS missingCount
     FROM enrollments e
     LEFT JOIN grades g ON g.enrollment_id = e.id
     WHERE e.class_section_id = ?
       AND (
         g.id IS NULL OR
         g.attendance_score IS NULL OR
         g.assignment_score IS NULL OR
         g.midterm_score IS NULL OR
         g.final_score IS NULL
       )`,
    [classSectionId],
  );

  if (Number(missingRows[0].missingCount) > 0) {
    throw new ApiError(409, "CONFLICT", "Cannot lock grades while required scores are missing");
  }

  await query("UPDATE class_sections SET is_grade_locked = TRUE WHERE id = ?", [classSectionId]);
  await writeAuditLog({
    actorUserId: req.user.id,
    action: "LOCK_GRADES",
    entityType: "class_sections",
    entityId: classSectionId,
    oldValue: { isGradeLocked: false },
    newValue: { isGradeLocked: true },
  });

  sendSuccess(res, {
    classSectionId,
    isGradeLocked: true,
  });
}

