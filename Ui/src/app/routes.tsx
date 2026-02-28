import { createBrowserRouter, Navigate } from "react-router";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AICoach from "./pages/AICoach";
import PracticePath from "./pages/PracticePath";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import Analytics from "./pages/Analytics";
import AppLayout from "./layouts/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "coach", Component: AICoach },
      { path: "practice", Component: PracticePath },
      { path: "problem/:id", Component: ProblemWorkspace },
      { path: "analytics", Component: Analytics },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
