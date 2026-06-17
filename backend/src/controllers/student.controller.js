import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

/**
 * Resolve the actual students.id for a student user.
 * Returns null if no student profile found.
 */
async function resolveStudentId(userId) {
  const rows = await query("SELECT id FROM students WHERE user_id = ? LIMIT 1", [userId]);
  return rows[0]?.id ?? null;
}

async function canAccessStudentTranscript(user, resolvedStudentId) {
  if (["academic_staff", "admin"].includes(user.role)) {
    return true;
  }

  if (user.role !== "student") {
    return false;
  }

  // Compare against the already-resolved student.id
  const ownStudentId = await resolveStudentId(user.id);
  return ownStudentId === Number(resolvedStudentId);
}

export async function getTranscript(req, res) {
  const studentParam = req.params.id;
  const semesterId = req.query.semesterId ? Number(req.query.semesterId) : null;
  let studentId = null;

  if (req.user.role === "student") {
    const resolvedId = await resolveStudentId(req.user.id);
    if (!resolvedId) {
      throw new ApiError(404, "NOT_FOUND", "Student profile not found for this account");
    }
    studentId = resolvedId;
  } else {
    // Try to find by student_code first
    const codeRows = await query("SELECT id FROM students WHERE student_code = ? LIMIT 1", [studentParam]);
    if (codeRows.length > 0) {
      studentId = codeRows[0].id;
    } else if (!isNaN(Number(studentParam))) {
      // Fallback to numeric student database ID
      studentId = Number(studentParam);
    }
  }

  if (!studentId) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  if (!(await canAccessStudentTranscript(req.user, studentId))) {
    throw new ApiError(403, "FORBIDDEN", "Students can only view their own transcript");
  }

  const students = await query(
    "SELECT id, student_code, full_name, email FROM students WHERE id = ? LIMIT 1",
    [studentId],
  );

  if (!students[0]) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  const items = await query(
    `SELECT
       c.course_code AS courseCode,
       c.name AS courseName,
       c.credits,
       se.name AS semesterName,
       cs.semester_id AS semesterId,
       cs.section_code AS sectionCode,
       g.attendance_score AS attendanceScore,
       g.assignment_score AS assignmentScore,
       g.midterm_score AS midtermScore,
       g.final_score AS finalScore,
       g.total_score AS totalScore,
       g.status,
       gr.attendance_weight AS attendanceWeight,
       gr.assignment_weight AS assignmentWeight,
       gr.midterm_weight AS midtermWeight,
       gr.final_weight AS finalWeight
     FROM enrollments e
     JOIN class_sections cs ON cs.id = e.class_section_id
     JOIN courses c ON c.id = cs.course_id
     JOIN semesters se ON se.id = cs.semester_id
     LEFT JOIN grades g ON g.enrollment_id = e.id
     LEFT JOIN grade_rules gr ON gr.course_id = c.id
     WHERE e.student_id = ?
       AND (? IS NULL OR cs.semester_id = ?)
     ORDER BY se.id DESC, c.course_code`,
    [studentId, semesterId, semesterId],
  );

  sendSuccess(res, {
    student: {
      id: students[0].id,
      studentCode: students[0].student_code,
      fullName: students[0].full_name,
      email: students[0].email,
    },
    items,
  });
}

