import { LoginForm } from "@/components/login-form";
import homeButton from "../../assets/homeButton.png";
import { Link } from "react-router-dom";
import login from "../../assets/login.webp";

const Login = () => {
  return (
    <>
      <div className="p-5">
        <Link to="/">
          <img
            src={homeButton}
            alt="home-button"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 cursor-pointer"
          />
        </Link>
      </div>


<div className="flex flex-col lg:flex-row items-center justify-center min-h-[90vh] gap-10 -mt-20 pt-10">

  <div className="w-full max-w-md">
    <LoginForm />
  </div>

  <div className="w-full lg:w-1/2 flex justify-center lg:justify-start lg:ml-10">
    <img
      src={login}
      alt="gym bros using the system"
      className="max-w-full h-auto object-contain"
    />
  </div>
</div>

    </>
  );
};

export default Login;
