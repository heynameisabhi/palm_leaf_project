"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Edit, Trash2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserAccount {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  phone_no: string;
  address: string;
  status: string;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const { mutate: fetchAllUsers } = useMutation({
    mutationFn: async () => {
      const response = await axios.get("/api/users/get");
      return response.data;
    },
    onError: (err) => {
      console.log(err);
      toast.error("Error fetching users: " + err.message);
    },
    onSuccess: (data) => {
      setUsers(data);
      toast.success("All users fetched successfully.");
    },
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const toggleUserStatus = useMutation({
    mutationFn: async (user: UserAccount) => {
      const updatedStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
      await axios.put('/api/users/toggle-user-status/', {
        status: updatedStatus,
        userId: user.user_id
      });

      return { ...user, status: updatedStatus };
    },
    onSuccess: (updatedUser) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );
      toast.success("User status updated successfully.");
    },
    onError: (error: any) => {
      toast.error("Error updating user status.", error.message);
    },
  });

  return (
    <div className="flex flex-col gap-4 pt-20 text-zinc-400 px-4">
      <h1 className="text-2xl font-bold">Manage Users</h1>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage existing users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search users..."
                className="bg-zinc-800 border-zinc-700 pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
            >
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-zinc-800">
              <TableRow className="border-zinc-700 hover:bg-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Phone No</TableHead>
                <TableHead className="text-zinc-400">Address</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.user_id}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <TableCell>{user.user_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.phone_no}</TableCell>
                  <TableCell>{user.address}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className={cn(
                        "cursor-pointer",
                        user.status === "ACTIVE" ? "bg-red-900/30 text-red-400" : "bg-emerald-900/30 text-emerald-400"
                      )}
                      onClick={() => {
                        setSelectedUser(user);
                        setIsPopupOpen(true);
                      }}
                    >
                      {
                        user.status === "ACTIVE" ? "Block" : "Activate"
                      }
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isPopupOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-50">
          <div className="bg-zinc-900 p-10 rounded-lg text-white w-100">
            <h2 className="text-xl font-bold mb-4">Confirm Status Change</h2>
            <p>
              Are you sure you want to change status of{" "}
              <b>{selectedUser.user_name}</b>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                className="bg-red-900/30 text-red-400 hover:bg-red-700 cursor-pointer"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-900/30 text-emerald-400 hover:bg-emerald-700 cursor-pointer"
                onClick={() => {
                  toggleUserStatus.mutate(selectedUser);
                  setIsPopupOpen(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
