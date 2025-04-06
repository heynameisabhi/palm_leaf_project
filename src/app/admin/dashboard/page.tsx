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
import { Clock, Database, FileText, TrendingUp, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GranthaDeck } from "@prisma/client";

import { getWeeklyChartData } from "@/helpers/getWeeklyChartData";

type ChartDataPoint = {
  name: string;
  records: number;
};

let chartData: ChartDataPoint[] = [];
let TotalRecordsThisWeek: number = 0;
let mostActiveDayOfTheWeek: string = "";
let mostActivePercentage: number = 0;

export default function Dashboard() {
  useAuth(["admin"]);

  const { data: session, status } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["granthaDeckRecords"],
    queryFn: async () => {
      const response = await axios.get("/api/users/records/get");

      chartData = getWeeklyChartData(response.data.firstFiveGranthaDeckRecords);

      TotalRecordsThisWeek = chartData.reduce(
        (sum, day) => sum + day.records,
        0
      );

      const mostActiveDayOfTheWeekData = chartData.reduce((max, current) =>
        current.records > max.records ? current : max
      );

      mostActiveDayOfTheWeek = mostActiveDayOfTheWeekData.name;
      mostActivePercentage =
        TotalRecordsThisWeek > 0
          ? (mostActiveDayOfTheWeekData.records / TotalRecordsThisWeek) * 100
          : 0;

      return response.data;
    },
    enabled: !!session, // Only run this query if the session exists
    refetchOnWindowFocus: false,
  });

  const records = data?.firstFiveGranthaDeckRecords || [];
  const recordCount = data?.recordCount || 0;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-green-500">Loading your dashboard...</p>
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
            Could not fetch your records. Please try again later.
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
          <p className="text-zinc-400">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex justify-center px-2 py-2 bg-zinc-900 rounded-md">
              <h1 className="text-2xl font-semibold bg-clip-text text-gray-200">
                Welcome, {session.user?.email?.split("@")[0]}!
              </h1>
            </div>
            <p className="text-zinc-400 mt-1">Your Grantha Deck Dashboard</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-zinc-800 text-zinc-300 border-zinc-700 px-3 py-1"
            >
              <User className="w-4 h-4 mr-1" />
              User Account
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              Last login: Today
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Total Records
              </CardDescription>
              <CardTitle className="text-3xl text-white flex items-center">
                {recordCount}
                <Database className="ml-2 text-green-500 w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                <TrendingUp className="inline w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">
                  +{Math.floor(Math.random() * 10)}%
                </span>{" "}
                from last week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                This Week
              </CardDescription>
              <CardTitle className="text-3xl text-white">
                {TotalRecordsThisWeek || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                <span className="text-green-500">Active</span> record creation
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900/80 transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">
                Recently Added
              </CardDescription>
              <CardTitle className="text-3xl text-white">
                {records.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500">
                Displaying <span className="text-green-500">latest</span>{" "}
                entries
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm col-span-2">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-100">
                Weekly Activity
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Records created over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
                    />
                    <Bar
                      dataKey="records"
                      fill="url(#colorGradient)"
                      radius={[5, 5, 0, 0]}
                      activeBar={{
                        fill: "url(#colorGradient)",
                        stroke: "transparent",
                        strokeWidth: 0,
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="colorGradient"
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
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-100">
                Quick Stats
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your Grantha Deck metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Most active day</span>
                  <span className="text-zinc-100">{mostActiveDayOfTheWeek}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: mostActivePercentage + "%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Recent records</span>
                  <span className="text-zinc-100">
                    {records.length} of {recordCount}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width: `${(records.length / recordCount) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Records */}
        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-zinc-100">
                  Recent Grantha Deck Records
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your latest {records.length} entries
                </CardDescription>
              </div>
              <Badge className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer">
                View All
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {records.length > 0 ? (
                records.map((record: GranthaDeck) => (
                  <div
                    key={record.grantha_deck_id}
                    className="p-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-lg bg-emerald-500 bg-opacity-20 text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-100">
                            {record.grantha_deck_name || "Untitled Record"}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1">
                            Created on {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No records found. Create your first Grantha Deck record to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-zinc-800 bg-zinc-900/30 py-3">
            <div className="text-xs text-zinc-500 w-full text-center">
              Showing {records.length} of {recordCount} records
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
