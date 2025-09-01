import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../../assets/logo.png";
import { useGetMeQuery, api } from "../../../services/api";
import { useAppDispatch } from "../../../store/hooks";

type LinkDef = { to: string; label: string; accent: string };

const links: LinkDef[] = [
  { to: "/about", label: "About", accent: "text-teal-300" },
  { to: "/plans", label: "Plans", accent: "text-amber-300" },
  { to: "/register", label: "Register a Member", accent: "text-amber-300" },
];

const Header: React.FC = () => {
  const { data: isAdmin } = useGetMeQuery();

  const visibleLinks = links.filter(
    (l) => !(l.label === "Register a Member" && isAdmin !== true)
  );

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => !!localStorage.getItem("token")
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") {
        setIsLoggedIn(!!e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Logout handler: remove token, clear RTK Query cache, update UI, redirect to /login
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem("token");

      dispatch(api.util.resetApiState());

      setIsLoggedIn(false);

      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/");
    }
  };

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="bg-gradient-to-r from-sky-500 via-pink-300 via-80% to-purple-600"
    >
      <div className="w-full flex items-center justify-between pl-2 sm:pl-4 pr-4 sm:pr-6 py-4 text-lg">
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="flex-shrink-0"
          >
            <img
              src={logo}
              alt="logo"
              className="w-20 sm:w-24 md:w-28 h-auto"
            />
          </motion.div>

          <nav className="hidden md:flex gap-4 items-center font-medium">
            {visibleLinks.map((link) => (
              <motion.div
                key={link.to}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.975 }}
                className="relative group"
              >
                <NavLink
                  to={link.to}
                  end
                  className={({ isActive }: { isActive: boolean }) =>
                    [
                      "px-3 py-2 rounded-md transition-all duration-200 inline-block relative",
                      isActive
                        ? "text-white backdrop-blur-sm rounded-md ring-2 ring-violet-300/45 bg-purple-500"
                        : "text-white hover:text-gray-100",
                    ].join(" ")
                  }
                >
                  <span className="relative inline-block">
                    {link.label}
                    <span className="absolute left-0 -bottom-1 h-0.5 bg-pink-300 w-0 group-hover:w-full transition-all duration-300 rounded-full" />
                  </span>
                </NavLink>
              </motion.div>
            ))}
          </nav>
        </div>

        <div className="flex items-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="relative inline-block px-5 py-2 rounded-lg font-semibold overflow-hidden group bg-white text-gray-800 border-2 border-white/30"
              >
                <span className="relative z-10">Logout</span>
                <span className="absolute inset-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0 pointer-events-none bg-gradient-to-r from-violet-600 to-pink-500 opacity-90" />
                <span className="absolute inset-0 rounded-lg border border-white/20 z-20 pointer-events-none" />
              </button>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    "relative inline-block px-5 py-2 rounded-lg font-semibold overflow-hidden group",
                    isActive
                      ? "bg-gradient-to-r from-violet-700 to-pink-600 text-white"
                      : "bg-white text-gray-800 border-2 border-white/30",
                  ].join(" ")
                }
              >
                <span className="relative z-10">Login</span>
                <span className="absolute inset-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0 pointer-events-none bg-gradient-to-r from-violet-600 to-pink-500 opacity-90" />
                <span className="absolute inset-0 rounded-lg border border-white/20 z-20 pointer-events-none" />
              </NavLink>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
