import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";


function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated && !auth.isLoading) {
    auth.signinRedirect()
  }

  if (auth.isAuthenticated) {
    return (
      <>
        <Header/>
        <main>
          <Outlet />
        </main>
      </>
    );
  }
}

// function App() {
//   const auth = useAuth();

//   const signOutRedirect = () => {
//     const clientId = "3mtahugr0fpkbfioidkam7hibs";
//     const logoutUri = "<logout uri>";
//     const cognitoDomain = "https://us-east-14xnbyjtah.auth.us-east-1.amazoncognito.com";
//     window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
//   };

//   if (auth.isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (auth.error) {
//     return <div>Encountering error... {auth.error.message}</div>;
//   }

//     if (auth.isAuthenticated) {
//     return (
//       <div>
//         <button onClick={() => auth.removeUser()}>Sign out</button>

//         <div>
//           <Home/>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <button onClick={() => auth.signinRedirect()}>Sign in</button>
//       <button onClick={() => signOutRedirect()}>Sign out</button>
//     </div>
//   );

// }

export default App
