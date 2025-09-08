import React, { useEffect } from "react";
import { RegisterForm } from "@/components/register-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useGetMeQuery } from "@/services/previllageChecker";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // use RTK Query to fetch current user; skip when no token
  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    // if no token, force login
    if (!token) {
      navigate("/login");
      return;
    }

    // if query errored (401 etc.), redirect away
    if (isError) {
      console.error("Error fetching current user with RTK Query");
      navigate("/");
      return;
    }

    // while loading, do nothing (could show spinner)
    if (isLoading) return;

    // when data available, check permissions/role
    if (data) {
      const user = data.user ?? null;
      const permissions = data.permissions ?? null;

      const isAdminOrAllowed =
        user?.user_type === "admin" || permissions?.can_view_members === true;

      if (!isAdminOrAllowed) {
        // not authorized
        navigate("/");
        return;
      }

      // set axios default header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("Admin user verified (RTK):", user);
    }
  }, [token, isLoading, isError, data, navigate]);

  // optionally show a minimal loading state while checking
  if (!token) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-10 bg-gray-50">
        <div className="w-full max-w-md text-center">
          Verifying permissions…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pb-10 bg-gray-50">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
