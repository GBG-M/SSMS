import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  isAuthenticated,
  getToken,
} from "../services/authService";

export default function StudentRoute({ children }) {
  const navigate = useNavigate();

  const [checkingRole, setCheckingRole] = useState(true);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    async function checkStudentRole() {
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
          setIsStudent(false);
          return;
        }

        const profile = await response.json();
        const roles = profile.role_names || [];

        setIsStudent(
          roles.some((role) => role.toLowerCase() === "student")
        );
      } catch (error) {
        console.error("Failed to verify student role:", error);
        setIsStudent(false);
      } finally {
        setCheckingRole(false);
      }
    }

    checkStudentRole();
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking access...</p>
      </div>
    );
  }

  if (!isStudent) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}