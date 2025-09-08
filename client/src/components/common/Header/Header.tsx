// src/components/common/Header/Header.tsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../../assets/logo.png";
import {
  useGetMeQuery,
  previllageChecker,
} from "../../../services/previllageChecker";
import { useAppDispatch } from "../../../store/hooks";
import {
  Home,
  Info,
  Calendar,
  UserPlus,
  CreditCard,
  LogIn,
  LogOut,
} from "lucide-react";

type LinkDef = {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const links: LinkDef[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: Info },
  { to: "/plans", label: "Plans", icon: Calendar },
  { to: "/register", label: "Register a Member", icon: UserPlus },
  { to: "/payment-history", label: "Payment History", icon: CreditCard },
];

const Header: React.FC = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data } = useGetMeQuery(undefined, { skip: !token });
  const isAdmin = data?.isAdmin === true;

  const visibleLinks = links.filter(
    (l) => !(l.label === "Register a Member" && isAdmin !== true)
  );

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!token);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setIsLoggedIn(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handle = () => setIsLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("visibilitychange", handle);
    return () => window.removeEventListener("visibilitychange", handle);
  }, []);

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      localStorage.removeItem("token");
      dispatch(previllageChecker.util.resetApiState());
      setIsLoggedIn(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/login");
    }
  };

  return (
    <motion.aside
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 min-h-screen bg-gradient-to-b from-sky-600 to-purple-700 text-white flex-shrink-0"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img
            src={logo}
            alt="logo"
            className="w-24 h-12 sm:w-28 sm:h-14 md:w-32 md:h-16 lg:w-36 lg:h-18 xl:w-40 xl:h-20 rounded"
          />
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to} className="px-2">
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-3 py-2 rounded-md mx-1 transition-colors duration-150",
                        isActive
                          ? "bg-white/10 ring-1 ring-white/20"
                          : "hover:bg-white/10",
                      ].join(" ")
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                [
                  "w-full inline-flex items-center gap-3 px-3 py-2 rounded-md font-semibold",
                  isActive
                    ? "bg-white text-gray-800"
                    : "bg-white text-gray-800 hover:opacity-95",
                ].join(" ")
              }
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Header;
