"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: {
    orders: number;
    cartItems: number;
  };
}

interface UserStats {
  total: number;
  admins: number;
  visitors: number;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

const roleOptions = ["USER", "ADMIN", "VISITOR"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminUsersManager() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    visitors: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("USER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const syncSelection = (user: UserRecord | null) => {
    if (!user) {
      setSelectedUserId(null);
      setDraftName("");
      setDraftRole("USER");
      return;
    }

    setSelectedUserId(user.id);
    setDraftName(user.name || "");
    setDraftRole(user.role);
  };

  const fetchStats = async () => {
    const response = await fetch("/api/admin/users/stats");

    if (!response.ok) {
      throw new Error("Failed to fetch user stats.");
    }

    const data = await response.json();
    setStats(data);
  };

  const fetchUsers = async (page = pagination.page) => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "12",
      });

      if (search.trim()) {
        query.set("search", search.trim());
      }

      if (roleFilter) {
        query.set("role", roleFilter);
      }

      const response = await fetch(`/api/admin/users?${query.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users.");
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);

      const nextSelectedUser =
        data.users.find((user: UserRecord) => user.id === selectedUserId) ||
        data.users[0] ||
        null;

      syncSelection(nextSelectedUser);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([fetchStats(), fetchUsers(1)]);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchUsers(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, roleFilter]);

  const saveUser = async () => {
    if (!selectedUserId) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: draftName.trim() || null,
          role: draftRole,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user.");
      }

      setSuccess("User updated successfully.");
      await Promise.all([fetchUsers(pagination.page), fetchStats()]);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total users", value: stats.total },
          { label: "Administrators", value: stats.admins },
          { label: "Visitors", value: stats.visitors },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-[#1a1614]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_0.88fr]">
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">User Management</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">
                Review account growth, access levels, and customer activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUsers(pagination.page)}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name or email"
              className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"
            >
              <option value="">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-[1.25rem] border border-[#eadfcb] px-6 py-12 text-sm text-[#6b5d54]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-[1.25rem] border border-[#eadfcb] px-6 py-12 text-center text-sm text-[#6b5d54]">
                No users matched the current filters.
              </div>
            ) : (
              users.map((user) => {
                const isSelected = user.id === selectedUserId;

                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => syncSelection(user)}
                    className={`w-full rounded-[1.35rem] border px-5 py-4 text-left transition ${
                      isSelected
                        ? "border-[#d4a574] bg-[#fff8ee] shadow-[0_12px_30px_rgba(212,165,116,0.15)]"
                        : "border-[#eadfcb] bg-white hover:bg-[#f8f1e6]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#1a1614]">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="mt-1 text-sm text-[#6b5d54]">{user.email}</p>
                      </div>
                      <span className="rounded-full bg-[#1a1614] px-3 py-1 text-xs font-semibold text-white">
                        {user.role}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">
                      <span>{user._count.orders} orders</span>
                      <span>{user._count.cartItems} cart items</span>
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-[#6b5d54]">
            <span>
              Page {pagination.page} of {Math.max(pagination.pages, 1)} | {pagination.total} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => void fetchUsers(pagination.page - 1)}
                className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => void fetchUsers(pagination.page + 1)}
                className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <h2 className="text-xl font-bold text-[#1a1614]">Access Control</h2>
          <p className="mt-1 text-sm text-[#6b5d54]">
            Tune role assignments without leaving the operations workspace.
          </p>

          {!selectedUser ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-[#d9c9b3] bg-[#faf6ef] px-6 py-12 text-center text-sm text-[#6b5d54]">
              Select a user to update their profile details and role.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8c7764]">
                  {selectedUser.role}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[#1a1614]">
                  {selectedUser.name || "Unnamed user"}
                </h3>
                <p className="mt-1 text-sm text-[#6b5d54]">{selectedUser.email}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
                      Joined
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#1a1614]">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
                      Orders placed
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#1a1614]">
                      {selectedUser._count.orders}
                    </p>
                  </div>
                </div>
              </div>

              <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                <span>Display name</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                <span>Role</span>
                <select
                  value={draftRole}
                  onChange={(event) => setDraftRole(event.target.value)}
                  className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveUser()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save user updates
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
