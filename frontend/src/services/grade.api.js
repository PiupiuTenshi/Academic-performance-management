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
