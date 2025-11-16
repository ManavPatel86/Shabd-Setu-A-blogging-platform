import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { RouteIndex, RouteProfileView, RouteSignIn } from "@/helpers/RouteName";
import { Users, ShieldBan, UserCheck, Search } from "lucide-react";

const ManageUsers = () => {
    const navigate = useNavigate();
    const authState = useSelector((state) => state.user);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionInProgress, setActionInProgress] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const isAdmin = useMemo(() => authState?.isLoggedIn && authState?.user?.role === "admin", [authState]);

    useEffect(() => {
        if (!authState?.isLoggedIn) {
            showToast("error", "Please sign in to continue.");
            navigate(RouteSignIn);
            return;
        }

        if (!isAdmin) {
            showToast("error", "You are not authorized to access this page.");
            navigate(RouteIndex);
        }
    }, [authState, isAdmin, navigate]);

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/user/get-all-user`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || "Unable to fetch users.");
                }
                setUsers(Array.isArray(data?.user) ? data.user : []);
            } catch (err) {
                setError(err.message || "Unable to fetch users.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin]);

    const totalUsers = useMemo(() => users.length, [users]);
    const totalBlacklisted = useMemo(
        () => users.filter((item) => Boolean(item?.isBlacklisted)).length,
        [users]
    );
    const totalActive = useMemo(() => Math.max(totalUsers - totalBlacklisted, 0), [totalUsers, totalBlacklisted]);

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return users;
        return users.filter((item) => {
            const name = item?.name?.toLowerCase() || "";
            const email = item?.email?.toLowerCase() || "";
            return name.includes(term) || email.includes(term);
        });
    }, [searchTerm, users]);

    const handleBlacklistToggle = async (userId, nextState) => {
        try {
            setActionInProgress(userId);
            const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/user/blacklist/${userId}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isBlacklisted: nextState }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Unable to update blacklist status.");
            }

            setUsers((prev) =>
                prev.map((item) =>
                    item._id === userId ? { ...item, isBlacklisted: data?.user?.isBlacklisted } : item
                )
            );

            showToast("success", data?.message || "Status updated successfully.");
        } catch (err) {
            showToast("error", err.message || "Unable to update blacklist status.");
        } finally {
            setActionInProgress(null);
        }
    };

    const handleRowNavigation = (event, userId) => {
        if (event.target.closest("button")) {
            return;
        }
        if (!userId) {
            return;
        }
        navigate(RouteProfileView(userId));
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-semibold text-gray-900">Manage Users</h1>
                <p className="text-sm text-gray-600">
                    Review every account, keep your community safe, and manage blacklist status with a single click.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Card className="border-blue-100 bg-blue-50/60">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base text-blue-900">Total Users</CardTitle>
                            <CardDescription>All registered accounts</CardDescription>
                        </div>
                        <span className="rounded-full bg-blue-100 p-2 text-blue-600">
                            <Users className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-blue-900">{totalUsers}</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-100 bg-emerald-50/60">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base text-emerald-900">Active Users</CardTitle>
                            <CardDescription>Users able to sign in</CardDescription>
                        </div>
                        <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                            <UserCheck className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-emerald-900">{totalActive}</p>
                    </CardContent>
                </Card>

                <Card className="border-rose-100 bg-rose-50/60">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base text-rose-900">Blacklisted</CardTitle>
                            <CardDescription>Users currently blocked</CardDescription>
                        </div>
                        <span className="rounded-full bg-rose-100 p-2 text-rose-600">
                            <ShieldBan className="h-5 w-5" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-rose-900">{totalBlacklisted}</p>
                    </CardContent>
                </Card>
            </div>

            {loading && (
                <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    Loading users...
                </div>
            )}

            {!loading && error && (
                <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <Card className="border-gray-200">
                    <CardHeader className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">Directory</CardTitle>
                            <CardDescription>
                                Browse all users, search by name or email, and take action when needed.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <Search className="h-4 w-4" />
                            </span>
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 px-6">#</TableHead>
                                        <TableHead className="px-6">User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="px-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                                                No users match your search.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {filteredUsers.map((item, index) => {
                                const isBlacklisted = Boolean(item?.isBlacklisted);
                                const isAdminUser = item?.role === "admin";
                                const disableActions = isAdminUser || actionInProgress === item?._id;

                                return (
                                    <TableRow
                                                key={item?._id || index}
                                                onClick={(event) => handleRowNavigation(event, item?._id)}
                                                className="cursor-pointer transition-colors hover:bg-gray-50"
                                            >
                                                <TableCell className="px-6 text-sm text-gray-500">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-gray-200">
                                                            <AvatarImage src={item?.avatar} />
                                                            <AvatarFallback>
                                                                {item?.name?.charAt(0)?.toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item?.name || "Unknown"}</p>
                                                            <p className="text-xs text-gray-500">{item?._id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">{item?.email}</TableCell>
                                                <TableCell className="capitalize text-sm text-gray-600">
                                                    {item?.role || "user"}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                            isBlacklisted
                                                                ? "bg-rose-100 text-rose-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                        }`}
                                                    >
                                                        {isBlacklisted ? "Blacklisted" : "Active"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <Button
                                                        variant={isBlacklisted ? "outline" : "destructive"}
                                                        size="sm"
                                                        disabled={disableActions}
                                                        onClick={() => handleBlacklistToggle(item?._id, !isBlacklisted)}
                                                    >
                                                        {actionInProgress === item?._id
                                                            ? "Updating..."
                                                            : isBlacklisted
                                                                ? "Remove from blacklist"
                                                                : "Blacklist"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ManageUsers;
