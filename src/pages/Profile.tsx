import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Globe,
  ShoppingBag,
  Heart,
  Clock,
  Trash2,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Package,
  BookOpen,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import { supabase } from "@/lib/supabase";
import type { Order, Favorite } from "@/types/database";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-cyan-500/20 text-cyan-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isLoading, signOut, updateProfile } = useAuth();
  const { language } = useAppStore();
  const isFr = language === "fr";

  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "favorites">("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    if (!user) return;

    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));

    supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setFavorites(data ?? []));
  }, [user]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      // Delete profile (cascades favorites, cart, registrations via RLS)
      await supabase.from("profiles").delete().eq("id", user.id);
      await signOut();
      navigate("/", { replace: true });
    } catch {
      setDeleting(false);
    }
  }

  async function handleSaveName() {
    if (!editName.trim()) return;
    await updateProfile({ full_name: editName.trim() });
    setEditing(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: isFr ? "Profil" : "Profile", icon: User },
    { id: "orders" as const, label: isFr ? "Commandes" : "Orders", icon: ShoppingBag },
    { id: "favorites" as const, label: isFr ? "Favoris" : "Favorites", icon: Heart },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-red flex items-center justify-center shrink-0">
          <span className="text-white text-2xl font-bold font-display">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
          </span>
        </div>
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-white text-lg font-display font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1.5 rounded-lg bg-gradient-red text-white text-sm font-bold"
              >
                {isFr ? "Sauver" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-neutral-400 text-sm"
              >
                {isFr ? "Annuler" : "Cancel"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditName(profile?.full_name ?? "");
                setEditing(true);
              }}
              className="group"
            >
              <h1 className="font-display font-extrabold text-2xl text-white group-hover:text-red-400 transition-colors">
                {profile?.full_name || (isFr ? "Utilisateur" : "User")}
              </h1>
            </button>
          )}
          <p className="text-neutral-500 text-sm truncate">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-red text-white shadow-sm"
                : "text-neutral-500 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard
                icon={Mail}
                label={isFr ? "Email" : "Email"}
                value={user?.email ?? "—"}
              />
              <InfoCard
                icon={GraduationCap}
                label={isFr ? "Filiere" : "Major"}
                value={profile?.major ?? (isFr ? "Non defini" : "Not set")}
              />
              <InfoCard
                icon={Calendar}
                label={isFr ? "Semestre" : "Semester"}
                value={profile?.semester ?? (isFr ? "Non defini" : "Not set")}
              />
              <InfoCard
                icon={Globe}
                label={isFr ? "Langue" : "Track"}
                value={profile?.track === "french" ? (isFr ? "Francais" : "French") : profile?.track === "english" ? (isFr ? "Anglais" : "English") : "—"}
              />
              <InfoCard
                icon={Clock}
                label={isFr ? "Membre depuis" : "Member since"}
                value={profile?.created_at ? formatDate(profile.created_at) : "—"}
              />
              <InfoCard
                icon={ShoppingBag}
                label={isFr ? "Commandes" : "Orders"}
                value={String(orders.length)}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-display font-semibold text-sm">
                  {isFr ? "Se deconnecter" : "Sign Out"}
                </span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/20 text-red-400 hover:bg-red-500/[0.12] transition-all"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-display font-semibold text-sm">
                  {isFr ? "Supprimer mon compte" : "Delete my account"}
                </span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {orders.length === 0 ? (
              <EmptyState
                icon={Package}
                text={isFr ? "Aucune commande" : "No orders yet"}
              />
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-display font-bold text-sm">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        statusColors[order.status] ?? "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="text-white font-semibold">
                      {order.total.toFixed(2)} TND
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "favorites" && (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                text={isFr ? "Aucun favori" : "No favorites yet"}
              />
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    {fav.item_type === "book" ? (
                      <BookOpen className="w-5 h-5 text-green-400" />
                    ) : fav.item_type === "previous_exam" || fav.item_type === "entrance_exam" ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <Calendar className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-display font-semibold capitalize">
                      {fav.item_type.replace("_", " ")}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {formatDate(fav.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-center font-display font-extrabold text-lg text-white">
                  {isFr ? "Supprimer le compte ?" : "Delete account?"}
                </h3>
                <p className="text-center text-neutral-400 text-sm">
                  {isFr
                    ? "Cette action est irreversible. Tapez DELETE pour confirmer."
                    : "This action cannot be undone. Type DELETE to confirm."}
                </p>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-center text-sm font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirm("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] text-neutral-400 text-sm font-display font-semibold hover:bg-white/[0.1] transition-all"
                  >
                    {isFr ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-display font-bold disabled:opacity-40 hover:bg-red-700 transition-all"
                  >
                    {deleting
                      ? isFr ? "Suppression..." : "Deleting..."
                      : isFr ? "Supprimer" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-neutral-400" />
      </div>
      <div className="min-w-0">
        <p className="text-neutral-500 text-xs font-display font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-white text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-neutral-600" />
      </div>
      <p className="text-neutral-500 text-sm font-display font-semibold">{text}</p>
    </div>
  );
}
