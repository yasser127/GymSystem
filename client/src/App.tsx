// src/App.tsx
import { Route, Routes, Outlet } from "react-router-dom";
import Header from "./components/common/Header/Header";
import About from "./pages/About/About";
import Plans from "./pages/Plans/Plans";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import PaymentHistory from "./pages/PaymentHistory/PaymentHistory";
import "./App.css"; // IMPORTANT: import the CSS that controls mobile overlay behaviour

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen main-with-sidebar">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
      </Route>

      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;
