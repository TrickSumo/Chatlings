import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App.jsx'
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import LandingPage from './pages/LandingPage.jsx';
import './index.css'



const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth`,
  response_type: "code",
  scope: "email openid phone",
};


createRoot(document.getElementById('root')).render(
  <AuthProvider {...cognitoAuthConfig}>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="auth" element={<Auth />} />
        <Route path="app" element={<App />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
)
