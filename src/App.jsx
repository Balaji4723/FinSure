import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Eligibility from "./pages/Eligibility"
import EMICalculator from "./pages/EMICalculator"
import Policy from "./pages/Policy"
import Register from "./pages/Register"
import Login from "./pages/Login"
import History from "./pages/History"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/eligibility" element={<ProtectedRoute><Eligibility /></ProtectedRoute>} />
        <Route path="/emi" element={<ProtectedRoute><EMICalculator /></ProtectedRoute>} />
        <Route path="/policy" element={<ProtectedRoute><Policy /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
