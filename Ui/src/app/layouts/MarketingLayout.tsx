import { Outlet } from "react-router";

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <Outlet />
    </div>
  );
}
