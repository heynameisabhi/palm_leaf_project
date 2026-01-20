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
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, ArrowLeft, Calendar, User, Image, BookOpen, Settings, Database } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TimeRange = "week" | "month" | "year" | "all";

interface ReportOptions {
    // Deck Information
    deckBasicInfo: boolean;
    deckPhysicalProperties: boolean;
    deckCreationDetails: boolean;

    // User Information
    userBasicInfo: boolean;
    userContactInfo: boolean;
    userPermissions: boolean;

    // Grantha Content
    granthaBasicInfo: boolean;
    granthaDescriptions: boolean;

    // Author & Language
    authorBasicInfo: boolean;
    authorBio: boolean;
    languageInfo: boolean;

    // Image Information
    imageCount: boolean;
    imageDetails: boolean;
    scanningProperties: boolean;

    // Additional Options
    statisticalSummary: boolean;
    exportMetadata: boolean;
}

const defaultOptions: ReportOptions = {
    deckBasicInfo: true,
    deckPhysicalProperties: false,
    deckCreationDetails: true,
    userBasicInfo: true,
    userContactInfo: false,
    userPermissions: false,
    granthaBasicInfo: true,
    granthaDescriptions: false,
    authorBasicInfo: true,
    authorBio: false,
    languageInfo: true,
    imageCount: true,
    imageDetails: false,
    scanningProperties: false,
    statisticalSummary: true,
    exportMetadata: false,
};

export default function GenerateReport() {
    useAuth(["admin"]);
    const router = useRouter();
    const { data: session, status } = useSession();
    const [timeRange, setTimeRange] = useState<TimeRange>("all");
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportOptions, setReportOptions] = useState<ReportOptions>(defaultOptions);

    const handleOptionChange = (option: keyof ReportOptions, checked: boolean) => {
        setReportOptions(prev => {
            const newOptions = {
                ...prev,
                [option]: checked
            };

            // Enforce dependencies for author fields
            if (option === 'authorBio' && checked) {
                newOptions.authorBasicInfo = true;
            }
            if (option === 'authorBasicInfo' && !checked) {
                newOptions.authorBio = false;
            }

            return newOptions;
        });
    };

    const selectAllInCategory = (category: string) => {
        const categoryOptions: Record<string, (keyof ReportOptions)[]> = {
            deck: ['deckBasicInfo', 'deckPhysicalProperties', 'deckCreationDetails'],
            user: ['userBasicInfo', 'userContactInfo', 'userPermissions'],
            grantha: ['granthaBasicInfo', 'granthaDescriptions'],
            author: ['authorBasicInfo', 'authorBio', 'languageInfo'],
            image: ['imageCount', 'imageDetails', 'scanningProperties'],
            additional: ['statisticalSummary', 'exportMetadata']
        };

        if (categoryOptions[category]) {
            const newOptions = { ...reportOptions };
            categoryOptions[category].forEach(option => {
                newOptions[option] = true;
            });
            setReportOptions(newOptions);
        }
    };

    const handleGenerateReport = async () => {
        // Check if at least one option is selected
        const hasSelectedOptions = Object.values(reportOptions).some(option => option);
        if (!hasSelectedOptions) {
            toast.error("Please select at least one report option!");
            return;
        }

        try {
            setIsGenerating(true);
            const response = await axios.post(`/api/admin/dashboard/generate-report`, {
                timeRange,
                reportOptions
            }, {
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

    const CheckboxItem = ({
        id,
        label,
        description,
        checked,
        onChange
    }: {
        id: keyof ReportOptions;
        label: string;
        description: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
    }) => (
        <div className="flex items-start space-x-3">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={onChange}
                className="mt-0.5"
            />
            <div className="flex-1">
                <label htmlFor={id} className="text-sm font-medium text-zinc-200 cursor-pointer">
                    {label}
                </label>
                <p className="text-xs text-zinc-400 mt-1">{description}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-zinc-100 p-6">
            <div className="max-w-6xl mx-auto">
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
                            <h1 className="text-2xl font-semibold text-gray-200">Generate Custom Report</h1>
                            <p className="text-zinc-400 mt-1">Create detailed reports with your selected data fields</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Report Options */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Time Range Selection */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm text-white">
                            <CardHeader>
                                <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Time Range
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>

                        {/* Deck Information */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Deck Information
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('deck')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="deckBasicInfo"
                                    label="Basic Deck Information"
                                    description="Deck name, ID, and creation timestamp"
                                    checked={reportOptions.deckBasicInfo}
                                    onChange={(checked) => handleOptionChange('deckBasicInfo', checked)}
                                />
                                <CheckboxItem
                                    id="deckPhysicalProperties"
                                    label="Physical Properties"
                                    description="Length, width, total leaves, stitch type, physical condition"
                                    checked={reportOptions.deckPhysicalProperties}
                                    onChange={(checked) => handleOptionChange('deckPhysicalProperties', checked)}
                                />
                                <CheckboxItem
                                    id="deckCreationDetails"
                                    label="Creation Details"
                                    description="Owner name, source address, creation date"
                                    checked={reportOptions.deckCreationDetails}
                                    onChange={(checked) => handleOptionChange('deckCreationDetails', checked)}
                                />
                            </CardContent>
                        </Card>

                        {/* User Information */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        User Information
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('user')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="userBasicInfo"
                                    label="Basic User Info"
                                    description="Username and email address"
                                    checked={reportOptions.userBasicInfo}
                                    onChange={(checked) => handleOptionChange('userBasicInfo', checked)}
                                />
                                <CheckboxItem
                                    id="userContactInfo"
                                    label="Contact Information"
                                    description="Phone number and address"
                                    checked={reportOptions.userContactInfo}
                                    onChange={(checked) => handleOptionChange('userContactInfo', checked)}
                                />
                                <CheckboxItem
                                    id="userPermissions"
                                    label="Access Controls"
                                    description="User role and permission levels"
                                    checked={reportOptions.userPermissions}
                                    onChange={(checked) => handleOptionChange('userPermissions', checked)}
                                />
                            </CardContent>
                        </Card>

                        {/* Grantha Content */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Grantha Content
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('grantha')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="granthaBasicInfo"
                                    label="Basic Grantha Info"
                                    description="Grantha names and IDs"
                                    checked={reportOptions.granthaBasicInfo}
                                    onChange={(checked) => handleOptionChange('granthaBasicInfo', checked)}
                                />
                                <CheckboxItem
                                    id="granthaDescriptions"
                                    label="Descriptions & Remarks"
                                    description="Detailed descriptions and additional remarks"
                                    checked={reportOptions.granthaDescriptions}
                                    onChange={(checked) => handleOptionChange('granthaDescriptions', checked)}
                                />
                            </CardContent>
                        </Card>

                        {/* Author & Language */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Author & Language Details
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('author')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="authorBasicInfo"
                                    label="Author Basic Information"
                                    description="Author names, birth/death years, scribe details"
                                    checked={reportOptions.authorBasicInfo}
                                    onChange={(checked) => handleOptionChange('authorBasicInfo', checked)}
                                />
                                <CheckboxItem
                                    id="authorBio"
                                    label="Author Bio"
                                    description="Biography of the author"
                                    checked={reportOptions.authorBio}
                                    onChange={(checked) => handleOptionChange('authorBio', checked)}
                                />
                                <CheckboxItem
                                    id="languageInfo"
                                    label="Language Information"
                                    description="Language names and details"
                                    checked={reportOptions.languageInfo}
                                    onChange={(checked) => handleOptionChange('languageInfo', checked)}
                                />
                            </CardContent>
                        </Card>

                        {/* Image Information */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <Image className="w-5 h-5" />
                                        Image Information
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('image')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="imageCount"
                                    label="Image Counts"
                                    description="Total number of images per grantha"
                                    checked={reportOptions.imageCount}
                                    onChange={(checked) => handleOptionChange('imageCount', checked)}
                                />
                                <CheckboxItem
                                    id="imageDetails"
                                    label="Image Details"
                                    description="Image names, URLs, and metadata"
                                    checked={reportOptions.imageDetails}
                                    onChange={(checked) => handleOptionChange('imageDetails', checked)}
                                />
                                <CheckboxItem
                                    id="scanningProperties"
                                    label="Scanning Properties"
                                    description="Scanner details, resolution, dates, format information"
                                    checked={reportOptions.scanningProperties}
                                    onChange={(checked) => handleOptionChange('scanningProperties', checked)}
                                />
                            </CardContent>
                        </Card>

                        {/* Additional Options */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Additional Options
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => selectAllInCategory('additional')}
                                        className="cursor-pointer text-xs bg-gray-300/10 text-blue-400 hover:bg-gray-300/20 hover:text-white"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CheckboxItem
                                    id="statisticalSummary"
                                    label="Statistical Summary"
                                    description="Overview statistics and data counts"
                                    checked={reportOptions.statisticalSummary}
                                    onChange={(checked) => handleOptionChange('statisticalSummary', checked)}
                                />
                                <CheckboxItem
                                    id="exportMetadata"
                                    label="Export Metadata"
                                    description="Report generation details and timestamps"
                                    checked={reportOptions.exportMetadata}
                                    onChange={(checked) => handleOptionChange('exportMetadata', checked)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Panel */}
                    <div className="space-y-6">
                        {/* Generate Button */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl text-zinc-100">Generate Report</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Click to create and download your custom report
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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

                        {/* Selection Summary */}
                        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl text-zinc-100">Selection Summary</CardTitle>
                                <CardDescription className="text-zinc-400">
                                    {Object.values(reportOptions).filter(Boolean).length} options selected
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm">
                                    <div className="flex justify-between py-1">
                                        <span className="text-zinc-300">Time Range:</span>
                                        <span className="text-zinc-100 capitalize">{timeRange}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-zinc-300">Selected Fields:</span>
                                        <span className="text-zinc-100">
                                            {Object.values(reportOptions).filter(Boolean).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-800">
                                    <p className="text-xs text-zinc-400">
                                        Your report will include all selected data fields for the chosen time period.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}