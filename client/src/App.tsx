import { Route, Routes, Outlet } from "react-router-dom";
import Header from "./components/common/Header/Header";
import About from "./pages/About/About";
import Plans from "./pages/Plans/Plans";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";

const MainLayout = () => (
  <div>
    <Header />
    <Outlet /> {/* this is where nested routes render */}
  </div>
);

const App = () => {
  return (
    <Routes>
      {/* Routes with header */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Routes without header */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;
