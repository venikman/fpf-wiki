import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { parts, partNames, type Artifact, type Part } from "@shared/schema";
import { useState } from "react";

export function AppSidebar() {
  const [location] = useLocation();
  const [openParts, setOpenParts] = useState<Record<string, boolean>>({
    A: true,
    B: false,
    C: false,
    D: false,
    E: false,
    F: false,
    G: false,
  });

  const { data: artifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const getArtifactsByPart = (part: Part) => {
    return artifacts
      .filter((a) => a.part === part)
      .sort((a, b) => a.patternId.localeCompare(b.patternId, undefined, { numeric: true }));
  };

  const togglePart = (part: string) => {
    setOpenParts((prev) => ({ ...prev, [part]: !prev[part] }));
  };

  const isActive = (path: string) => location === path;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <i className="ti ti-book-2 text-primary-foreground text-lg" />
          </div>
          <div>
            <span className="font-bold text-sidebar-foreground">FPF Wiki</span>
            <p className="text-xs text-muted-foreground">Knowledge Base</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={isActive("/")}>
                  <Link href="/" data-testid="link-home">
                    <i className="ti ti-home" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={isActive("/search")}>
                  <Link href="/search" data-testid="link-search">
                    <i className="ti ti-search" />
                    <span>Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-3">
            Parts A-G
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {parts.map((part) => {
              const partArtifacts = getArtifactsByPart(part);
              return (
                <Collapsible
                  key={part}
                  open={openParts[part]}
                  onOpenChange={() => togglePart(part)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-between"
                      data-testid={`button-part-${part}`}
                    >
                      <div className="flex items-center gap-2">
                        <i className="ti ti-folder" />
                        <span className="font-medium">Part {part}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {partArtifacts.length}
                        </Badge>
                        <i
                          className={`ti ti-chevron-right transition-transform ${
                            openParts[part] ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-6 border-l border-sidebar-border ml-3 mt-1">
                      {partArtifacts.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2 px-2">
                          No artifacts yet
                        </div>
                      ) : (
                        partArtifacts.map((artifact) => (
                          <SidebarMenuItem key={artifact.id}>
                            <SidebarMenuButton
                              asChild
                              data-active={isActive(`/${artifact.patternId}`)}
                            >
                              <Link
                                href={`/${artifact.patternId}`}
                                data-testid={`link-artifact-${artifact.patternId}`}
                              >
                                <i className="ti ti-file-text text-muted-foreground" />
                                <span className="truncate text-sm">
                                  <span className="font-mono text-primary">
                                    {artifact.patternId}
                                  </span>
                                  {" - "}
                                  <span className="text-muted-foreground">
                                    {artifact.title.length > 20
                                      ? artifact.title.slice(0, 20) + "..."
                                      : artifact.title}
                                  </span>
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive("/admin")}>
              <Link href="/admin" data-testid="link-admin">
                <i className="ti ti-settings" />
                <span>Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
