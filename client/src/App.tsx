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
    <Outlet /> 
  </div>
);

const App = () => {

  return (
    <Routes>
     
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
      </Route>

      
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;
