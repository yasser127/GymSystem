import React, { Suspense, lazy } from "react";
import { Route, Routes, Outlet } from "react-router-dom";
import Header from "./components/common/Header/SideBar";
import About from "./pages/About/About";
import Plans from "./pages/Plans/Plans";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
const Payments = lazy(() => import("./components/admin/Payments"));

import "./App.css";
const Register = lazy(() => import("./pages/Register/Register"));
const MembersAdmin = lazy(() => import("./components/admin/MembersAdmin"));
const Settings = lazy(() => import("./pages/settings/Settings"));
import { useGetMeQuery } from "./services/previllageChecker";
import Footer from "./components/common/Footer/Footer";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen main-with-sidebar">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
};

const App = (): React.ReactElement => {
  const { data: me, } = useGetMeQuery();
  const isAdmin = !!me?.isAdmin;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/about" element={<About />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/login" element={<Login />} />
        {isAdmin && (
          <Route
          element={
            <Suspense
            fallback={<div className="p-6 text-center">Loading…</div>}
            >
                <Outlet />
              </Suspense>
            }
            >
            <Route path="/register" element={<Register />} />
            <Route path="/members" element={<MembersAdmin />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        )}
      </Route>
    </Routes>
  );
};

export default App;
