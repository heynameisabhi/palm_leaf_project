"use client"

import type { User } from "next-auth"
import { type FC, useState, useRef, useEffect } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { LogOut, Settings, UserIcon, LayoutDashboard } from "lucide-react"

interface UserAccountNavProps {
  user: Pick<User, "name" | "image" | "email">
}

const UserAccountNav: FC<UserAccountNavProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getInitials = () => {
    return user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"
  }

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full flex items-center justify-center"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-white font-bold bg-zinc-800 border-zinc-700 cursor-pointer hover:border-emerald-500 transition-all duration-200">
          {user.image ? (
            <img src={user.image || "/placeholder.svg"} alt="User Avatar" className="h-full w-full rounded-full" />
          ) : (
            <span>{getInitials()}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[280px] bg-zinc-900 shadow-lg rounded-lg border border-zinc-800 z-50 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-5">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <div className="h-10 w-14 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-800 to-green-700 text-white font-bold shadow-md">
              {user.image ? (
                <img src={user.image || "/placeholder.svg"} alt="User Avatar" className="h-full w-full rounded-full" />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            <div className="flex flex-col space-y-1 leading-none">
              {user.name && <p className="font-semibold text-white">{user.name}</p>}
              {user.email && <p className="w-[200px] truncate text-sm text-zinc-400">{user.email}</p>}
            </div>
          </div>
          <ul className="py-2">
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="h-4 w-4 text-emerald-500" />
                Profile
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4 text-emerald-500" />
                Settings
              </Link>
            </li>
            <div className="my-2 border-t border-zinc-800" />
            <li>
              <button
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/sign-in` })}
                className="flex items-center gap-2 w-full text-left px-4 py-2 cursor-pointer text-zinc-300 hover:bg-zinc-800 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default UserAccountNav

