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
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_4xNByjTAH",
  client_id: "3mtahugr0fpkbfioidkam7hibs",
  redirect_uri: "http://localhost:5173/auth",
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
