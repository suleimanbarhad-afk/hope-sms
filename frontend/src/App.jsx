import AppRoutes from "./routes/AppRoutes";
import InstallPWA from "./components/InstallPWA";
import AIChat from "./components/AIChat";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <AppRoutes />
      <InstallPWA />
      {user && <AIChat />}
    </>
  );
}