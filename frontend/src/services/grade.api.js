import api from "./api";

// GET /academic/semesters
export function getSemesters() {
  return api.get("/academic/semesters").then((r) => r.data.data);
}

// GET /classes?semesterId=
export function getClasses(semesterId) {
  const params = semesterId ? { semesterId } : {};
  return api.get("/classes", { params }).then((r) => r.data.data);
}

// GET /classes/:id/students
export function getClassStudents(classSectionId) {
  return api.get(`/classes/${classSectionId}/students`).then((r) => r.data.data);
}

// POST /grades/bulk
export function saveBulkGrades(classSectionId, grades) {
  return api.post("/grades/bulk", { classSectionId, grades }).then((r) => r.data.data);
}

// PUT /grades/:id
export function updateGrade(gradeId, payload) {
  return api.put(`/grades/${gradeId}`, payload).then((r) => r.data.data);
}

// POST /classes/:id/lock-grades
export function lockGrades(classSectionId) {
  return api.post(`/classes/${classSectionId}/lock-grades`).then((r) => r.data.data);
}

// POST /academic/calculate-final
export function calculateFinal(classSectionId) {
  return api.post("/academic/calculate-final", { classSectionId }).then((r) => r.data.data);
}

// POST /academic/classify
export function classifySemester(semesterId) {
  return api.post("/academic/classify", { semesterId }).then((r) => r.data.data);
}

// GET /retakes
export function getRetakes(params = {}) {
  return api.get("/retakes", { params }).then((r) => r.data.data);
}

// GET /academic/records (Client-side simulation)
export async function getAcademicRecords(params = {}) {
  const { semesterId, classSectionId } = params;
  if (!semesterId) return [];

  try {
    const classes = await getClasses(semesterId);
    
    const classDataList = await Promise.all(
      classes.map(async (c) => {
        try {
          const data = await getClassStudents(c.id);
          return {
            classSectionId: c.id,
            students: data.students || []
          };
        } catch {
          return { classSectionId: c.id, students: [] };
        }
      })
    );

    const studentAggregation = new Map();

    classDataList.forEach(({ students }) => {
      students.forEach((s) => {
        if (!studentAggregation.has(s.studentCode)) {
          studentAggregation.set(s.studentCode, {
            studentId: s.studentId,
            studentCode: s.studentCode,
            fullName: s.fullName,
            scores: [],
            totalClasses: 0
          });
        }
        const record = studentAggregation.get(s.studentCode);
        record.totalClasses += 1;
        if (s.totalScore !== null && s.totalScore !== undefined) {
          record.scores.push(Number(s.totalScore));
        }
      });
    });

    const records = Array.from(studentAggregation.values()).map((record) => {
      let averageScore = null;
      let classification = "—";
      
      if (record.scores.length > 0) {
        const sum = record.scores.reduce((a, b) => a + b, 0);
        averageScore = Math.round((sum / record.scores.length) * 10) / 10;
        
        if (averageScore >= 8.0) classification = "excellent";
        else if (averageScore >= 6.5) classification = "good";
        else if (averageScore >= 5.0) classification = "average";
        else classification = "weak";
      }

      const totalCredits = record.totalClasses * 3;

      return {
        studentId: record.studentId,
        studentCode: record.studentCode,
        fullName: record.fullName,
        averageScore,
        totalCredits,
        classification,
      };
    });

    if (classSectionId) {
      const targetClass = classDataList.find(c => c.classSectionId === Number(classSectionId));
      const targetStudentCodes = new Set((targetClass?.students || []).map(s => s.studentCode));
      return records
        .filter(r => targetStudentCodes.has(r.studentCode))
        .sort((a, b) => a.studentCode.localeCompare(b.studentCode));
    }

    return records.sort((a, b) => a.studentCode.localeCompare(b.studentCode));

  } catch (error) {
    console.error("Error in simulated getAcademicRecords:", error);
    return [];
  }
}



