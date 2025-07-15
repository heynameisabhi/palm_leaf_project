"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle,
  Key,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { toast } from "sonner";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  placeholder,
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-gray-200">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-black/50 border-gray-800 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20 pr-10 h-12"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-400 transition-colors"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

const SettingsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword.trim()) {
      toast.error("Please enter your current password");
      return false;
    }
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return false;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      toast.error(
        "Password must include uppercase, lowercase, number, special character and be at least 8 characters long"
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (oldPassword === newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!");
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-purple-900">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-br from-gray-600 to-white bg-clip-text text-transparent py-1">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-2">
            Secure your account with a strong password. Follow our security
            guidelines for optimal protection.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Form */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <Key className="h-5 w-5 text-purple-400" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <PasswordInput
                    id="oldPassword"
                    label="Current Password"
                    value={formData.oldPassword}
                    onChange={(value) =>
                      handleInputChange("oldPassword", value)
                    }
                    showPassword={showPasswords.oldPassword}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("oldPassword")
                    }
                    placeholder="Enter your current password"
                  />

                  <PasswordInput
                    id="newPassword"
                    label="New Password"
                    value={formData.newPassword}
                    onChange={(value) =>
                      handleInputChange("newPassword", value)
                    }
                    showPassword={showPasswords.newPassword}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("newPassword")
                    }
                    placeholder="Enter your new password"
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={(value) =>
                      handleInputChange("confirmPassword", value)
                    }
                    showPassword={showPasswords.confirmPassword}
                    onToggleVisibility={() =>
                      togglePasswordVisibility("confirmPassword")
                    }
                    placeholder="Confirm your new password"
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-900 hover:from-blue-700 hover:to-purple-900 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? "Updating Password..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          {/* Right Side - Security Guidelines */}

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-900/20 to-green-900/20 border-purple-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Security Guidelines
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Follow these best practices to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Strong Password</p>
                      <p className="text-gray-400 text-sm">
                        Use at least 8 characters with a mix of letters,
                        numbers, and symbols
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">
                        Avoid Personal Info
                      </p>
                      <p className="text-gray-400 text-sm">
                        Don't use personal information like your name,
                        birthdate, or address
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Unique Password</p>
                      <p className="text-gray-400 text-sm">
                        Don't reuse passwords from other accounts or services
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Regular Updates</p>
                      <p className="text-gray-400 text-sm">
                        Change your password regularly, especially if you
                        suspect it's compromised
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-purple-900/20 border-green-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Password Strength Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-gray-300">Weak: password123</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="text-gray-300">
                      Medium: MyPassword123!
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-gray-300">Strong: Tr0ub4dor&3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
