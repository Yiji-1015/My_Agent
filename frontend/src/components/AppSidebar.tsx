import { Home, CalendarDays, BarChart3, User, Bot, ListTodo } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "홈", url: "/", icon: Home },
  { title: "일정 리뷰", url: "/review", icon: CalendarDays },
  { title: "대시보드", url: "/dashboard", icon: BarChart3 },
  { title: "태스크 큐", url: "/tasks", icon: ListTodo },
  { title: "내 프로필", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="glass-panel border-0 rounded-none h-full pt-4">
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 pb-4 mb-2 border-b border-border/30 ${collapsed ? "justify-center" : ""}`}>
          <Bot className="w-7 h-7 text-primary animate-float shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg font-bold neon-text-pink tracking-wider">
              EZ Agent
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                      activeClassName="bg-primary/10 text-primary neon-glow-pink font-semibold"
                    >
                      <item.icon className="w-5 h-5 mr-3 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
