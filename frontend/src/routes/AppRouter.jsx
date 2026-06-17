import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import StudentTranscriptPage from "../pages/StudentTranscriptPage";
import GradeInputPage from "../pages/GradeInputPage";
import AcademicProcessingPage from "../pages/AcademicProcessingPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AuditLogPage from "../pages/AuditLogPage";
import SystemStatusPage from "../pages/SystemStatusPage";

// Layout bao gồm Sidebar + Header + nội dung
function AppLayout({ children, title }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header pageTitle={title} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected: tất cả role */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout title="Tổng quan">
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Student: xem bảng điểm */}
        <Route path="/transcript" element={
          <ProtectedRoute roles={["student", "academic_staff", "admin"]}>
            <AppLayout title="Bảng điểm">
              <StudentTranscriptPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Lecturer: nhập điểm */}
        <Route path="/grades/input" element={
          <ProtectedRoute roles={["lecturer"]}>
            <AppLayout title="Nhập điểm">
              <GradeInputPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Giáo vụ: xử lý học vụ */}
        <Route path="/academic" element={
          <ProtectedRoute roles={["academic_staff"]}>
            <AppLayout title="Xử lý học vụ">
              <AcademicProcessingPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin: quản lý user */}
        <Route path="/admin/users" element={
          <ProtectedRoute roles={["admin"]}>
            <AppLayout title="Quản lý tài khoản">
              <AdminUsersPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin: audit log */}
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute roles={["admin"]}>
            <AppLayout title="Nhật ký hệ thống">
              <AuditLogPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin: trạng thái hệ thống */}
        <Route path="/admin/system" element={
          <ProtectedRoute roles={["admin"]}>
            <AppLayout title="Trạng thái hệ thống">
              <SystemStatusPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Redirect mặc định */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
