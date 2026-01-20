"use client";

import { useAuth } from "@/components/useAuth";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import {
  Clock,
  Database,
  FileText,
  TrendingUp,
  User,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

type UserActivity = {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  status: string;
  total_decks: number;
  last_activity: string;
  recent_decks: {
    grantha_deck_id: string;
    grantha_deck_name: string;
    createdAt: string;
    total_granthas: number;
  }[];
};

type DashboardData = {
  users: UserActivity[];
  userActivityChart: {
    name: string;
    active: number;
    blocked: number;
  }[];
};

export default function AdminDashboard() {
  useAuth(["admin"]);
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/dashboard");
      return response.data;
    },
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  const dashboardData: DashboardData = data || {
    users: [],
    userActivityChart: [],
  };

  console.log("🟢Dashboard data: ", dashboardData);

  const totalUsers = dashboardData.users.length;
  const activeUsers = dashboardData.users.filter(
    (user) => user.status === "ACTIVE"
  ).length;
  const blockedUsers = dashboardData.users.filter(
    (user) => user.status === "BLOCKED"
  ).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-green-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
        <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Error Loading Data
          </h2>
          <p className="text-zinc-400">
            Could not fetch dashboard data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
        <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Access Denied
          </h2>
          <p className="text-zinc-400">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-zinc-100 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex justify-center px-2 py-2 bg-zinc-900 rounded-md">
              <h1 className="text-2xl font-semibold bg-clip-text text-gray-200">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-zinc-400 mt-1">
              User Management & Activity Overview
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-zinc-800 text-zinc-300 border-zinc-700 px-3 py-1"
            >
              <User className="w-4 h-4 mr-1" />
              Admin Account
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              Last login: Today
            </Badge>
            <button
              onClick={() => router.push("/admin/dashboard/generate-report")}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-gradient-to-br from-blue-700 to-violet-700 cursor-pointer hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Total Users
              </CardDescription>
              <CardTitle className="text-3xl text-white flex items-center">
                {totalUsers}
                <Users className="ml-2 text-blue-500 w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                <TrendingUp className="inline w-3 h-3 mr-1 text-blue-500" />
                <span className="text-blue-500">
                  {Math.round((activeUsers / totalUsers) * 100)}%
                </span>{" "}
                active users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Active Users
              </CardDescription>
              <CardTitle className="text-3xl text-white flex items-center">
                {activeUsers}
                <UserCheck className="ml-2 text-green-500 w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                <span className="text-green-500">Currently active</span> users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Blocked Users
              </CardDescription>
              <CardTitle className="text-3xl text-white flex items-center">
                {blockedUsers}
                <UserX className="ml-2 text-red-500 w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                <span className="text-red-500">Currently blocked</span> users
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm col-span-2">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-100">
                User Activity Overview
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Active vs Blocked users over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.userActivityChart}>
                    <XAxis dataKey="name" stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                      }}
                      itemStyle={{
                        color: "#ffffff",
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          const activeUsers =
                            payload.find((item) => item.dataKey === "active")
                              ?.value || 0;
                          const blockedUsers =
                            payload.find((item) => item.dataKey === "blocked")
                              ?.value || 0;
                        //   const total = activeUsers + blockedUsers;
                        //   return `${label} | Total: ${total}`;
                        }
                        return label;
                      }}
                      formatter={(value, name) => {
                        if (name === "active") {
                          return [`${value}`, "Active"];
                        } else if (name === "blocked") {
                          return [`${value}`, "Blocked"];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="active"
                      fill="url(#activeGradient)"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="blocked"
                      fill="url(#blockedGradient)"
                      radius={[5, 5, 0, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="activeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                      <linearGradient
                        id="blockedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor="#ef4444"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-100">
                User Distribution
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Current user status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Active users</span>
                  <span className="text-zinc-100">{activeUsers}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${(activeUsers / totalUsers) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Blocked users</span>
                  <span className="text-zinc-100">{blockedUsers}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full"
                    style={{ width: `${(blockedUsers / totalUsers) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-zinc-100">
                  Recent User Activity
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Latest Grantha Deck records by users
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {dashboardData.users.length > 0 ? (
                dashboardData.users.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/dashboard/users/${user.user_id}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20 text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-100">
                            {user.user_name}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-1">
                            Total Decks: {user.total_decks} | Last Activity:{" "}
                            {formatDate(user.last_activity)}
                          </p>
                          <div className="mt-2 space-y-1">
                            {user.recent_decks.map((deck) => (
                              <p
                                key={deck.grantha_deck_id}
                                className="text-xs text-zinc-500"
                              >
                                • {deck.grantha_deck_name} (
                                {deck.total_granthas} granthas) -{" "}
                                {formatDate(deck.createdAt)}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          user.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No user activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
