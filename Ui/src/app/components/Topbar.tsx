import { Search, Bell, User } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

export default function Topbar() {
  return (
    <header className="h-16 bg-black/50 backdrop-blur-md border-b border-white/10 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <Input 
          placeholder="Search problems, users, or topics..." 
          className="pl-10 bg-white/5 border-white/10 focus-visible:ring-cyan-500/50 text-white placeholder:text-gray-600 rounded-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-white">Alex Coder</div>
            <div className="text-xs text-cyan-400">Rating: 1842</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10">
            AC
          </div>
        </div>
      </div>
    </header>
  );
}
