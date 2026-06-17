import { query } from "../config/database.js";
import { sendSuccess } from "../utils/http-response.js";

export async function listRetakes(req, res) {
  const semesterId = req.query.semesterId ? Number(req.query.semesterId) : null;
  const courseId = req.query.courseId ? Number(req.query.courseId) : null;
  const status = req.query.status || null;

  const rows = await query(
    `SELECT
       rr.id,
       s.student_code AS studentCode,
       s.full_name AS fullName,
       c.course_code AS courseCode,
       c.name AS courseName,
       g.total_score AS totalScore,
       rr.status,
       rr.note,
       rr.created_at AS createdAt
     FROM retake_results rr
     JOIN students s ON s.id = rr.student_id
     JOIN courses c ON c.id = rr.course_id
     LEFT JOIN grades g ON g.id = rr.grade_id
     WHERE (? IS NULL OR rr.semester_id = ?)
       AND (? IS NULL OR rr.course_id = ?)
       AND (? IS NULL OR rr.status = ?)
     ORDER BY rr.created_at DESC`,
    [semesterId, semesterId, courseId, courseId, status, status],
  );

  sendSuccess(res, rows);
}

