"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";

import { RegisterUserAccount } from "@/lib/validators/useraccount";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export default function Page() {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [user, setUser] = useState<RegisterUserAccount>({
    username: "",
    email: "",
    password: "",
    role: "",
    phoneNo: "",
    address: "",
  });

  const { mutate: addUser, isPending } = useMutation({
    mutationFn: async () => {
      const payload: RegisterUserAccount = user;
      const response = await axios.post("/api/users/add", payload);

      return response.data;
    },

    onError: (error: any) => {
      toast.error("There was an error adding the user.", error.message);
    },

    onSuccess: () => {
      toast.success("User added successfully.");
    },
  });

  return (
    <div className="flex flex-col gap-6 px-6 md:px-10 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-zinc-300">Add New User</h1>

      <Card className="bg-zinc-900 border border-zinc-800 text-white shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">User Information</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter the details for the new user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                placeholder="Enter username"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="user@example.com"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  value={user.password}
                  onChange={(e) =>
                    setUser({ ...user, password: e.target.value })
                  }
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={user.phoneNo}
                onChange={(e) => setUser({ ...user, phoneNo: e.target.value })}
                placeholder="Enter phone no."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter full address"
              className="bg-zinc-800 border-zinc-700"
              value={user.address}
              onChange={(e) => setUser({ ...user, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={user.role}
              onValueChange={(value) => setUser({ ...user, role: value })}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={() => addUser()}
            disabled={
              isPending ||
              !user.username ||
              !user.email ||
              !user.password ||
              !user.phoneNo ||
              !user.address ||
              !user.role
            }
            className="px-6 py-2 bg-gradient-to-r cursor-pointer from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700 rounded-lg shadow-md"
          >
            {
              isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding User...
                </>
              ) : (
                "Add User"
              )
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
