import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useContext } from "react"
import Login from "./components/Login"
import Register from "./components/Register"
import Adminpanel from "./components/Adminpanel"
import Navbar from "./components/Navbar"
import Chat from "./components/chat"
import { Authprovider, Authcntxt } from "./context/authcontext"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function AppContent() {
  const { isLoading } = useContext(Authcntxt);

  // Show loading spinner while validating token
  if (isLoading) {
    return (
      <div className="App-div" style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255,255,255,0.3)',
          borderTop: '5px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="App-div">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Adminpanel />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          closeOnClick
          draggable
          pauseOnHover
          theme="dark"
        />
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <Authprovider>
      <AppContent />
    </Authprovider>
  )
}

export default App