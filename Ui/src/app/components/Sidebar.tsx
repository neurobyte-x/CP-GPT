import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Brain, 
  Map, 
  LineChart, 
  Settings, 
  Code2, 
  LogOut,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/Avatar"; // I need to create this or use a placeholder

export default function Sidebar() {
  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/app/coach", icon: Brain, label: "AI Coach", highlight: true },
    { to: "/app/practice", icon: Map, label: "Practice Paths" },
    { to: "/app/analytics", icon: LineChart, label: "Analytics" },
    { to: "/app/problems", icon: Code2, label: "Problem Set" }, // Placeholder route
  ];

  return (
    <aside className="w-64 fixed h-screen bg-black border-r border-white/10 flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Terminal className="text-cyan-400 mr-2" size={24} />
        <span className="font-bold text-xl tracking-tighter text-white">CP.COACH</span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#06b6d4]" 
                : "text-gray-400 hover:bg-white/5 hover:text-white",
              item.highlight && !isActive && "text-cyan-400 hover:text-cyan-300"
            )}
          >
            <item.icon size={18} className={cn("group-hover:scale-110 transition-transform", item.highlight ? "text-cyan-400" : "")} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white transition-colors">
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 cursor-pointer text-gray-400 hover:text-red-400 transition-colors mt-1">
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </div>
      </div>
    </aside>
  );
}
