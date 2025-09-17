import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../../assets/logo.png";
import {
  useGetMeQuery,
  previllageChecker,
} from "../../../services/previllageChecker";
import { useAppDispatch } from "../../../store/hooks";
import type { LinkDef } from "../../../types";
import {
  Home,
  Info,
  Calendar,
  UserPlus,
  CreditCard,
  LogIn,
  LogOut,
  Menu,
  X,
  User,
  Settings,
} from "lucide-react";

const LINKS: LinkDef[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: Info },
  { to: "/plans", label: "Plans", icon: Calendar },
  { to: "/register", label: "Register a Member", icon: UserPlus },
  { to: "/payments", label: "Payment History", icon: CreditCard },
  { to: "/members", label: "Members", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

const SidebarContent: React.FC<{
  collapsed: boolean;
  links: LinkDef[];
  loggedIn: boolean;
  onLogout: (e?: React.MouseEvent) => void;
  onNavClose?: () => void;
}> = ({ collapsed, links, loggedIn, onLogout, onNavClose }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 pl-[50%]">
      <img
        src={logo}
        alt="logo"
        className={`rounded object-contain transition-all duration-200 ${
          collapsed ? "w-10 h-9" : "w-28 h-12"
        }`}
      />
    </div>

    <nav className="flex-1 overflow-y-auto">
      <ul className="py-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.to} className="px-2">
              <NavLink
                to={l.to}
                end={l.to === "/"}
                onClick={onNavClose}
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
                <span
                  className={`font-medium transition-opacity duration-200 ${
                    collapsed
                      ? "opacity-0 pointer-events-none hidden"
                      : "opacity-100"
                  }`}
                >
                  {l.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>

    <div className="px-3 py-4 border-t border-white/10">
      {loggedIn ? (
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-150 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5" />
          <span className={`${collapsed ? "hidden" : "font-semibold"}`}>
            Logout
          </span>
        </button>
      ) : (
        <NavLink
          to="/login"
          onClick={onNavClose}
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
          <span className={`${collapsed ? "hidden" : ""}`}>Login</span>
        </NavLink>
      )}
    </div>
  </div>
);

const Header: React.FC = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data } = useGetMeQuery(undefined, { skip: !token });
  const isAdmin = data?.isAdmin === true;

  const RESTRICTED_FOR_NON_ADMINS = ["/register", "/members", "/settings"];
  const visibleLinks = useMemo(
    () =>
      LINKS.filter(
        (l) =>
          !(RESTRICTED_FOR_NON_ADMINS.includes(l.to) && !isAdmin) &&
          !(l.to === "/payments" && !token)
      ),
    [isAdmin]
  );

  const [loggedIn, setLoggedIn] = useState<boolean>(() => !!token);
  const [open, setOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) =>
      e.key === "token" && setLoggedIn(!!e.newValue);
    const onVisibility = () => setLoggedIn(!!localStorage.getItem("token"));
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("storage", onStorage);
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const width = isMobile ? 0 : open ? 256 : 0;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${width}px`
      );
      document.body.style.overflow = isMobile && open ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  const logout = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      localStorage.removeItem("token");
      dispatch(previllageChecker.util.resetApiState());
      setLoggedIn(false);
      setOpen(false);
      navigate("/login");
    },
    [dispatch, navigate]
  );

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        onClick={() => setOpen((s) => !s)}
        className="fixed top-4 left-4 z-60 inline-flex items-center justify-center p-2 rounded-lg shadow-lg transition-transform duration-150 focus:outline-none"
        style={{
          background: "linear-gradient(180deg,#7c3aed,#5b21b6)",
          color: "white",
        }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobile && (
        <div
          role="button"
          aria-hidden={!open}
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 transition-opacity ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            background: "rgba(0,0,0,0.45)",
            transition: "opacity .18s ease",
          }}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-gradient-to-b from-sky-600 to-purple-700 text-white overflow-hidden"
        style={{
          width: 256,
          maxWidth: "100vw",
          boxSizing: "border-box",
          minHeight: "100vh",
          willChange: "transform",
        }}
      >
        <div style={{ width: 256, overflow: "hidden", height: "100%" }}>
          <SidebarContent
            collapsed={!open}
            links={visibleLinks}
            loggedIn={loggedIn}
            onLogout={logout}
            onNavClose={() => {
              if (window.innerWidth < 768) setOpen(false);
            }}
          />
        </div>
      </motion.aside>
    </>
  );
};

export default Header;
