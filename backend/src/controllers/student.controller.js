import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

async function canAccessStudentTranscript(user, studentId) {
  if (["academic_staff", "admin"].includes(user.role)) {
    return true;
  }

  if (user.role !== "student") {
    return false;
  }

  const rows = await query("SELECT id FROM students WHERE user_id = ? LIMIT 1", [user.id]);
  return rows[0]?.id === Number(studentId);
}

export async function getTranscript(req, res) {
  const studentId = Number(req.params.id);
  const semesterId = req.query.semesterId ? Number(req.query.semesterId) : null;

  if (!studentId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid student id");
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
       g.attendance_score AS attendanceScore,
       g.assignment_score AS assignmentScore,
       g.midterm_score AS midtermScore,
       g.final_score AS finalScore,
       g.total_score AS totalScore,
       g.status
     FROM enrollments e
     JOIN class_sections cs ON cs.id = e.class_section_id
     JOIN courses c ON c.id = cs.course_id
     JOIN semesters se ON se.id = cs.semester_id
     LEFT JOIN grades g ON g.enrollment_id = e.id
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

