"use client"

import type React from "react"

import { useState } from "react"
import { Users, UserPlus, Database, FileSpreadsheet, ChevronRight, LayoutDashboard, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [dataManagementOpen, setDataManagementOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-64px)] bg-black/50 mt-[64px]">
      {/* Sidebar */}
      <div
        className={cn(
          "h-[calc(100vh-64px)] bg-black flex flex-col border-r border-zinc-800 transition-[width] duration-300 fixed",
          collapsed ? "w-[80px]" : "w-[300px]",
        )}
      >
        {/* Logo area */}
        <div className="flex items-center p-4 border-b border-zinc-800">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-md">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <h2 className="text-white font-semibold">Admin Panel</h2>
              <p className="text-xs text-zinc-400">Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          {/* User Management */}
          <div>
            <button
              onClick={() => setUserManagementOpen(!userManagementOpen)}
              className={cn(
                "flex items-center justify-center w-full px-2 py-2 text-sm rounded-md transition-colors",
                "hover:bg-gradient-to-r hover:from-emerald-900/50 hover:to-green-900/30",
                userManagementOpen
                  ? "bg-gradient-to-r from-emerald-900/50 to-green-900/30 text-white"
                  : "text-zinc-400",
              )}
            >
              <Users className="w-5 h-5 text-emerald-500" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left ml-3">User Management</span>
                  <ChevronRight
                    className={cn("w-4 h-4 transition-transform", userManagementOpen ? "rotate-90" : "")}
                  />
                </>
              )}
            </button>

            {/* Submenu */}
            {userManagementOpen && !collapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  href="/admin/dashboard/users/add"
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                    pathname === "/admin/dashboard/users/add"
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <UserPlus className="w-4 h-4 mr-3" />
                  <span>Add Users</span>
                </Link>
                <Link
                  href="/admin/dashboard/users/manage"
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                    pathname === "/admin/dashboard/users/manage"
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span>Manage Users</span>
                </Link>
              </div>
            )}
          </div>

          {/* Data Management */}
          <div>
            <button
              onClick={() => setDataManagementOpen(!dataManagementOpen)}
              className={cn(
                "flex items-center justify-center w-full px-2 py-2 text-sm rounded-md transition-colors",
                "hover:bg-gradient-to-r hover:from-emerald-900/50 hover:to-green-900/30",
                dataManagementOpen
                  ? "bg-gradient-to-r from-emerald-900/50 to-green-900/30 text-white"
                  : "text-zinc-400",
              )}
            >
              <Database className="w-5 h-5 text-emerald-500" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left ml-3">Data Management</span>
                  <ChevronRight
                    className={cn("w-4 h-4 transition-transform", dataManagementOpen ? "rotate-90" : "")}
                  />
                </>
              )}
            </button>

            {/* Submenu */}
            {dataManagementOpen && !collapsed && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  href="/admin/dashboard/data/insert"
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                    pathname === "/admin/dashboard/data/insert"
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <Database className="w-4 h-4 mr-3" />
                  <span>Insert Data</span>
                </Link>
                <Link
                  href="/admin/dashboard/data/insert/author"
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                    pathname === "/admin/dashboard/data/insert/author"
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  <span>Add Authors</span>
                </Link>
                <Link
                  href="/admin/dashboard/data/view"
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                    pathname === "/admin/dashboard/data/view"
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-3" />
                  <span>View Data</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Collapse button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 text-sm text-zinc-400 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 rotate-180 mr-2" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 min-w-0 overflow-auto transition-[margin-left] duration-300 h-full",
          collapsed ? "ml-[80px]" : "ml-[300px]"
        )}
      >
        <div className="h-full w-full">{children}</div>
      </main>
    </div>
  )
}
