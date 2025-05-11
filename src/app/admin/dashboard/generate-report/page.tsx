"use client";

import { useAuth } from "@/components/useAuth";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { FileText, Download, ArrowLeft, Calendar } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TimeRange = "week" | "month" | "year" | "all";

export default function GenerateReport() {
    useAuth(["admin"]);
    const router = useRouter();
    const { data: session, status } = useSession();
    const [timeRange, setTimeRange] = useState<TimeRange>("all");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true);
            const response = await axios.get(`/api/admin/dashboard/generate-report?timeRange=${timeRange}`, {
                responseType: 'blob'
            });
            
            // Create a blob from the PDF data
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `grantha-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("🟢 Report downloaded successfully!")
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error("🔴 Error generating report!")
        } finally {
            setIsGenerating(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
                <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-green-500">Loading...</p>
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
                    <p className="text-zinc-400">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-zinc-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-zinc-400 bg-zinc-800 hover:text-white hover:bg-zinc-500 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-200">Generate Report</h1>
                            <p className="text-zinc-400 mt-1">Create detailed reports of Grantha records</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-xl text-zinc-100">Report Settings</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Configure your report parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 text-white">
                                <label className="text-sm font-medium text-zinc-300">Time Range</label>
                                <Select
                                    value={timeRange}
                                    onValueChange={(value: TimeRange) => setTimeRange(value)}
                                >
                                    <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                                        <SelectValue placeholder="Select time range" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-none text-white">
                                        <SelectItem value="week">Last Week</SelectItem>
                                        <SelectItem value="month">Last Month</SelectItem>
                                        <SelectItem value="year">Last Year</SelectItem>
                                        <SelectItem value="all">All Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleGenerateReport}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-violet-800 to-blue-700 cursor-pointer text-white"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                        Generating Report...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2 cursor-pointer" />
                                        Generate & Download Report
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl text-zinc-100">Report Information</CardTitle>
                            <CardDescription className="text-zinc-400">
                                What's included in your report
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-200">Grantha Decks</h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        All decks created within the selected time range
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-200">Time Period</h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Records from the selected time range
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-400">
                                    The report will include detailed information about each grantha deck, including:
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                                    <li>• Deck creation details</li>
                                    <li>• User information</li>
                                    <li>• Grantha contents</li>
                                    <li>• Author and language details</li>
                                    <li>• Image counts</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 