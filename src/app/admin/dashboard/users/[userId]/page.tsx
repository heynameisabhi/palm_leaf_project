"use client";

import { useAuth } from "@/components/useAuth";
import { useSession } from "next-auth/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, User, Mail, Shield, Calendar, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type UserDetails = {
    user_id: string;
    user_name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    total_decks: number;
    total_granthas: number;
    decks: {
        grantha_deck_id: string;
        grantha_deck_name: string;
        createdAt: string;
        granthas: {
            grantha_id: string;
            grantha_name: string;
        }[];
    }[];
};

export default function UserActivityPage() {
    useAuth(["admin"]);
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const { data: session, status } = useSession();

    const { data, isLoading, error } = useQuery({
        queryKey: ["user-details", userId],
        queryFn: async () => {
            try {
                const response = await axios.get(`/api/admin/users/${userId}`);
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    toast.error("User not found");
                    router.push("/admin/dashboard");
                } else if (error.response?.status === 401) {
                    toast.error("Unauthorized access");
                    router.push("/admin/dashboard");
                } else {
                    toast.error("Failed to load user details");
                }
                throw error;
            }
        },
        enabled: !!session && !!userId,
        retry: false,
        staleTime: 60000, // 1 minute
    });

    const userDetails: UserDetails = data;

    if (status === "loading" || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
                <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-green-500">Loading user details...</p>
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
                        Could not fetch user details. Please try again later.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/admin/dashboard")}
                    >
                        Return to Dashboard
                    </Button>
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
                    <p className="text-zinc-400">Please log in to view this page.</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }
            
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
        } catch (error) {
            console.error("Date formatting error:", error);
            return "Invalid date";
        }
    };

    if (!userDetails) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-black">
                <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800">
                    <h2 className="text-2xl font-bold text-yellow-500 mb-2">
                        No Data Found
                    </h2>
                    <p className="text-zinc-400">
                        Could not retrieve user details at this time.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/admin/dashboard")}
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-zinc-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-zinc-100">
                                User Activity Details
                            </h1>
                            <p className="text-zinc-400">Detailed view of user records and activity</p>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm mb-8">
                    <CardHeader>
                        <CardTitle className="text-xl text-zinc-100">
                            User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20">
                                    <User className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Username</p>
                                    <p className="text-zinc-100">{userDetails?.user_name || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-green-500 bg-opacity-20">
                                    <Mail className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Email</p>
                                    <p className="text-zinc-100">{userDetails?.email || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-purple-500 bg-opacity-20">
                                    <Shield className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Role</p>
                                    <p className="text-zinc-100">{userDetails?.role || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-20">
                                    <Calendar className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Joined</p>
                                    <p className="text-zinc-100">{formatDate(userDetails?.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-zinc-400">
                                Total Decks
                            </CardDescription>
                            <CardTitle className="text-3xl text-white flex items-center">
                                {userDetails?.total_decks || 0}
                                <Database className="ml-2 text-blue-500 w-5 h-5" />
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-zinc-400">
                                Total Granthas
                            </CardDescription>
                            <CardTitle className="text-3xl text-white flex items-center">
                                {userDetails?.total_granthas || 0}
                                <FileText className="ml-2 text-green-500 w-5 h-5" />
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-zinc-400">
                                Account Status
                            </CardDescription>
                            <CardTitle className="text-3xl text-white">
                                <Badge
                                    variant="outline"
                                    className={`${
                                        userDetails?.status === "ACTIVE"
                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                            : "bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}
                                >
                                    {userDetails?.status || "UNKNOWN"}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Grantha Decks */}
                <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-zinc-100">
                            Grantha Decks
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            All decks created by this user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {userDetails?.decks && userDetails.decks.length > 0 ? (
                                userDetails.decks.map((deck) => (
                                    <div
                                        key={deck.grantha_deck_id}
                                        className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-zinc-100">
                                                    {deck.grantha_deck_name || "Unnamed Deck"}
                                                </h3>
                                                <p className="text-sm text-zinc-400">
                                                    Created on {formatDate(deck.createdAt)}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-zinc-800 text-zinc-300">
                                                {deck.granthas.length} Granthas
                                            </Badge>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {deck.granthas && deck.granthas.map((grantha) => (
                                                <div
                                                    key={grantha.grantha_id}
                                                    className="flex items-center justify-between p-2 bg-zinc-800/20 rounded"
                                                >
                                                    <span className="text-sm text-zinc-300">
                                                        {grantha.grantha_name || "Unnamed Grantha"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-zinc-500">
                                    No decks found for this user.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 