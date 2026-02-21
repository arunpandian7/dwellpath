import { Link, useLocation } from "wouter";
import { Home, MapPin, Building, Plus, Settings } from "lucide-react";

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [location] = useLocation();

  const navItems = [
    { label: "Properties", icon: Building, href: "/" },
    { label: "Locations", icon: MapPin, href: "/locations" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card shadow-sm fixed h-full z-10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">HouseHunter</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}>
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-muted/20">
          <div className="rounded-xl p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <h4 className="font-semibold text-sm mb-1">Pro Tip</h4>
            <p className="text-xs text-muted-foreground">Track commutes by adding your office location first.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50 px-6 py-4 flex justify-between items-center shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => (
           <Link key={item.href} href={item.href} className={`
             flex flex-col items-center gap-1
             ${location === item.href ? "text-primary" : "text-muted-foreground"}
           `}>
             <item.icon className="h-6 w-6" />
             <span className="text-[10px] font-medium">{item.label}</span>
           </Link>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
