import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { RouteIndex, RouteProfileView, RouteSignIn } from "@/helpers/RouteName";
import { Users, Search, Sparkles } from "lucide-react";

const ManageUsers = () => {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = useMemo(
    () => authState?.isLoggedIn && authState?.user?.role === "admin",
    [authState]
  );

  // Redirect/non-admin checks (MAIN logic)
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

  // Fetch users (MAIN logic)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${getEnv("VITE_API_BASE_URL")}/user/get-all-user`,
          {
            method: "GET",
            credentials: "include",
          }
        );
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
  const totalActive = useMemo(
    () => Math.max(totalUsers - totalBlacklisted, 0),
    [totalUsers, totalBlacklisted]
  );

  const statCards = useMemo(
    () => [
      {
        title: "Total users",
        value: totalUsers,
        helper: "all registered accounts",
        accent: "from-white/70 via-white/30 to-white/5",
        tone: "text-slate-900",
        helperTone: "text-slate-600",
      },
      {
        title: "Active users",
        value: totalActive,
        helper: "able to sign in",
        accent: "from-emerald-50 via-white to-white",
        tone: "text-emerald-900",
        helperTone: "text-emerald-700",
      },
      {
        title: "Blacklisted",
        value: totalBlacklisted,
        helper: "currently blocked",
        accent: "from-rose-50 via-white to-white",
        tone: "text-rose-900",
        helperTone: "text-rose-700",
      },
    ],
    [totalActive, totalBlacklisted, totalUsers]
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) => {
      const name = item?.name?.toLowerCase() || "";
      const email = item?.email?.toLowerCase() || "";
      return name.includes(term) || email.includes(term);
    });
  }, [searchTerm, users]);

  // Blacklist toggle (MAIN logic)
  const handleBlacklistToggle = async (userId, nextState) => {
    try {
      setActionInProgress(userId);
      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/user/blacklist/${userId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBlacklisted: nextState }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update blacklist status.");
      }

      setUsers((prev) =>
        prev.map((item) =>
          item._id === userId
            ? { ...item, isBlacklisted: data?.user?.isBlacklisted }
            : item
        )
      );

      showToast("success", data?.message || "Status updated successfully.");
    } catch (err) {
      showToast("error", err.message || "Unable to update blacklist status.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Row navigation (MAIN logic)
  const handleRowNavigation = (event, userId) => {
    if (event.target.closest("button")) return;
    if (!userId) return;
    navigate(RouteProfileView(userId));
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-6 sm:px-10 py-10 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-16 w-60 h-60 bg-purple-300/40 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Community pulse
            </p>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">
              Manage Users
            </h1>
            <p className="text-sm sm:text-base text-white/85">
              Keep every profile aligned with our standards, review risky
              accounts, and celebrate the community that makes ShabdSetu thrive.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                <Users className="h-4 w-4" />
                {totalUsers} total members
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                {totalActive} active today
              </span>
            </div>
          </div>

          <div className="rounded-4xl border border-white/25 bg-white/10 px-6 py-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.8)]">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">
              Blacklisted
            </p>
            <p className="text-4xl font-black text-white">{totalBlacklisted}</p>
            <p className="text-xs text-white/65">accounts under review</p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${card.accent} px-6 py-5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.8)]`}
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
              {card.title}
            </p>
            <p className={`mt-2 text-4xl font-black ${card.tone}`}>
              {card.value}
            </p>
            <p className={`text-sm ${card.helperTone}`}>{card.helper}</p>
          </div>
        ))}
      </section>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
          Loading users...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-200 bg-red-50/80 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Directory table */}
      {!loading && !error && (
        <Card className="rounded-4xl border border-slate-100 bg-white/95 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Directory
              </CardTitle>
              <CardDescription className="text-slate-500">
                Browse all users, search by name or email, and take action when
                needed.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-full border-slate-200 bg-slate-50 pl-12"
              />
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 px-6 text-xs uppercase tracking-[0.25em] text-slate-400">
                      #
                    </TableHead>
                    <TableHead className="px-6 text-xs uppercase tracking-[0.25em] text-slate-400">
                      User
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Email
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Role
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="px-6 text-right text-xs uppercase tracking-[0.25em] text-slate-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
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
                        className="cursor-pointer transition-colors hover:bg-slate-50/70"
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
                              <p className="font-medium text-gray-900">
                                {item?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">{item?._id}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-gray-600">
                          {item?.email}
                        </TableCell>

                        <TableCell className="capitalize text-sm text-gray-600">
                          {item?.role || "user"}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
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
                            size="sm"
                            disabled={disableActions}
                            onClick={() => handleBlacklistToggle(item?._id, !isBlacklisted)}
                            className={`rounded-full px-5 ${
                              isBlacklisted
                                ? "border border-slate-200 text-slate-600 hover:border-slate-300"
                                : "bg-[#6C5CE7] text-white hover:bg-[#5b4dd4]"
                            }`}
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