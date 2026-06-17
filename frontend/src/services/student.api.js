import api from "./api";

// GET /students/:id/transcript?semesterId=
export function getTranscript(studentId, semesterId) {
  const params = semesterId ? { semesterId } : {};
  return api.get(`/students/${studentId}/transcript`, { params }).then((r) => r.data.data);
}
