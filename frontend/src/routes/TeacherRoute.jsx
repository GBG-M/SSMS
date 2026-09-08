import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  isAuthenticated,
  getToken,
} from "../services/authService";

export default function TeacherRoute({ children }) {
  const navigate = useNavigate();

  const [checkingRole, setCheckingRole] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkTeacherRole() {
      if (!isAuthenticated()) {
        setCheckingRole(false);
        return;
      }

      try {
        const token = getToken();

        const response = await fetch("/api/accounts/profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        if (response.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          setHasAccess(false);
          return;
        }

        const profile = await response.json();
        const roles = (profile.role_names || []).map((r) => String(r).toLowerCase());

        const allowed =
          roles.includes("teacher") ||
          roles.includes("admin") ||
          roles.includes("academic_coordinator") ||
          Boolean(profile.is_staff || profile.is_superuser);

        setHasAccess(allowed);
      } catch (error) {
        console.error("Failed to verify teacher role:", error);
        setHasAccess(false);
      } finally {
        setCheckingRole(false);
      }
    }

    checkTeacherRole();
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600">Verifying Faculty Access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
