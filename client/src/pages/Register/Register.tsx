import { RegisterForm } from "@/components/register-form";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

    
      const response = await axios.get("http://localhost:3000/auth/register", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Basic success check
      if (!(response.status >= 200 && response.status < 300) || !response.data) {
        navigate("/");
        return;
      }


      const user = response.data.user ?? null;
      const permissions = response.data.permissions ?? null;

      const isAdminOrAllowed =
        user?.user_type === "admin" ||
        permissions?.can_view_members === true;

      if (!isAdminOrAllowed) {
        navigate("/");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("Admin user verified:", user);
    } catch (err) {
      console.error("fetchUser error:", err);
      navigate("/");
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center pb-10 bg-gray-50">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
