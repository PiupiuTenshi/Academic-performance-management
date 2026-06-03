import { query } from "../config/database.js";
import { BaseRepository } from "./base.repository.js";

class StudentRepository extends BaseRepository {
  constructor() {
    super("students");
  }

  findByStudentCode(studentCode) {
    return query("SELECT * FROM students WHERE student_code = ? LIMIT 1", [studentCode]);
  }

  findByUserId(userId) {
    return query("SELECT * FROM students WHERE user_id = ? LIMIT 1", [userId]);
  }
}

export const studentRepository = new StudentRepository();

