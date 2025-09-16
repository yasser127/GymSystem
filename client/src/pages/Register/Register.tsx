import React, { useEffect } from "react";
import { RegisterForm } from "@/components/register-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useGetMeQuery } from "@/services/previllageChecker";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;


  const { data, isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
   
    if (!token) {
      navigate("/login");
      return;
    }

   
    if (isError) {
      console.error("Error fetching current user with RTK Query");
      navigate("/");
      return;
    }

   
    if (isLoading) return;

  
    if (data) {
      const user = data.user ?? null;
      const permissions = data.permissions ?? null;

      const isAdminOrAllowed =
        user?.user_type === "admin" || permissions?.can_view_members === true;

      if (!isAdminOrAllowed) {
       
        navigate("/");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("Admin user verified (RTK):", user);
    }
  }, [token, isLoading, isError, data, navigate]);

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
