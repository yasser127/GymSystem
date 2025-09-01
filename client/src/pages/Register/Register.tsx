import { RegisterForm } from "@/components/register-form";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
const fetchUser = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("http://localhost:3000/auth/register", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (
      response.status !== 200 ||
      !response.data?.user ||
      response.data.user.isAdmin !== 1 // 🚨 require admin
    ) {
      navigate("/");
      return;
    }

    // At this point user is confirmed admin
    console.log("Admin user verified:", response.data.user);
  } catch (err) {
    console.log(err);
    navigate("/");
  }
};


  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center pb-10 bg-gray-50">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
