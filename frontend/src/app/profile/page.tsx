"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, Mail, ShieldCheck, CalendarDays, Clock, Upload, Save, LockKeyhole, KeyRound, Eye, EyeOff, Undo2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";

const inputClass = "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50";

function PasswordField({ id, label, value, onChange, disabled = false }: {
  id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">{label}</label>
      <div className="relative mt-2">
        <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
        <input id={id} type={visible ? "text" : "password"} autoComplete={id === "current-password" ? "current-password" : "new-password"} required minLength={id === "current-password" ? 1 : 8} maxLength={128} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} placeholder={`Enter ${label.toLowerCase()}`} className={`${inputClass} pr-10`} />
        <button type="button" disabled={disabled} onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute right-2 top-2 rounded-md p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900">
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function accountDate(value?: string) {
  if (!value) return "Unavailable";
  const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(parsed.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function ProfileEditor() {
  const { user, refreshUser } = useAuth();
  const photoInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar_data || null);
      setPhotoChanged(false);
    }
  }, [user]);

  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProfileError("");
    setProfileMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setProfileError("Choose a JPEG, PNG or WebP photo smaller than 5 MB.");
      return;
    }
    setPhotoLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo processing is unavailable.");
      const side = Math.min(bitmap.width, bitmap.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 256, 256);
      context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
      bitmap.close();
      setAvatar(canvas.toDataURL("image/jpeg", 0.85));
      setPhotoChanged(true);
    } catch {
      setProfileError("Could not read this photo. Please choose another image.");
    } finally { setPhotoLoading(false); }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(""); setProfileMessage("");
    if (!name.trim()) { setProfileError("Enter your name."); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({ name: name.trim(), ...(photoChanged ? { avatar_data: avatar } : {}) });
      await refreshUser();
      setProfileMessage("Profile saved.");
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Could not save your profile."); }
    finally { setSaving(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(""); setPasswordMessage("");
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword) || newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      setPasswordError("Use at least 8 characters, with a letter and a number, up to 72 bytes."); return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMessage("Password changed. Use your new password next time you sign in.");
    } catch (error) { setPasswordError(error instanceof Error ? error.message : "Could not change your password."); }
    finally { setChangingPassword(false); }
  };

  const discardChanges = () => {
    setName(user?.name || "");
    setAvatar(user?.avatar_data || null);
    setPhotoChanged(false);
    setProfileError("");
    setProfileMessage("");
  };
  const profileDirty = name !== user?.name || photoChanged;
  const overview = [
    { label: "User role", value: user?.role.replace(/_/g, " "), icon: UserIcon },
    { label: "Member since", value: accountDate(user?.created_at), icon: CalendarDays },
    { label: "Last updated", value: accountDate(user?.updated_at), icon: Clock },
    ...(user?.warehouse_id ? [{ label: "Assigned warehouse", value: `#${user.warehouse_id}`, icon: ShieldCheck }] : []),
  ];

  return (
    <div className="w-full">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard</Link>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">Manage your personal details, photo and password.</p>
      <nav aria-label="Profile sections" className="mt-6 flex gap-6 border-b border-slate-200">
        <a href="#personal-information" className="inline-flex items-center gap-2 border-b-2 border-indigo-600 pb-3 text-sm font-medium text-indigo-700"><UserIcon className="h-4 w-4" aria-hidden="true" /> Personal information</a>
      </nav>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <form id="personal-information" onSubmit={saveProfile} className="min-w-0 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Personal information</h2>
          <p className="mt-1 text-sm text-slate-500">Update your basic details and profile photo.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500 ring-4 ring-slate-50">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Profile photo preview" className="h-full w-full object-cover" />
              ) : <UserIcon className="h-10 w-10" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Profile photo</p>
              <input ref={photoInput} id="profile-photo" aria-label="Profile photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={saving || photoLoading} className="hidden" />
              <button type="button" onClick={() => photoInput.current?.click()} disabled={saving || photoLoading} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium hover:bg-white disabled:opacity-50"><Upload className="h-4 w-4" aria-hidden="true" /> {photoLoading ? "Processing…" : "Upload photo"}</button>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">JPEG, PNG or WebP · up to 5 MB</p>
              {avatar && <button type="button" disabled={saving || photoLoading} onClick={() => { setAvatar(null); setPhotoChanged(true); setProfileMessage(""); }} className="mt-2 text-xs font-medium text-red-600">Remove photo</button>}
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium" htmlFor="profile-name">Full name</label>
              <div className="relative mt-2"><UserIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" /><input id="profile-name" autoComplete="name" required maxLength={120} value={name} disabled={saving} onChange={event => { setName(event.target.value); setProfileMessage(""); }} className={inputClass} /></div>
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium">Email address</label>
              <div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" /><input id="profile-email" type="email" readOnly value={user?.email || ""} className={`${inputClass} bg-slate-50 text-slate-500`} /></div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Contact your administrator to change your email.</p>
            </div>
            <div>
              <label htmlFor="profile-role" className="block text-sm font-medium">Role</label>
              <div className="relative mt-2"><ShieldCheck className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" /><input id="profile-role" readOnly value={user?.role.replace(/_/g, " ") || ""} className={`${inputClass} bg-slate-50 text-slate-500`} /></div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Access permissions are managed by your administrator.</p>
            </div>
          </div>
          {profileError && <p role="alert" className="mt-4 text-sm text-red-600">{profileError}</p>}
          {profileMessage && <p role="status" className="mt-4 text-sm text-green-700">{profileMessage}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={discardChanges} disabled={!profileDirty || saving || photoLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Undo2 className="h-4 w-4" aria-hidden="true" /> Discard changes</button>
            <button type="submit" disabled={saving || photoLoading || !profileDirty} className={buttonClass}><Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save profile"}</button>
          </div>
        </form>

        <div className="min-w-0 space-y-5">
          <section aria-labelledby="account-overview-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 id="account-overview-heading" className="text-lg font-semibold tracking-tight">Account overview</h2>
            <p className="mt-1 text-sm text-slate-500">Quick information about your account.</p>
            <dl className="mt-4 divide-y divide-slate-100">
              {overview.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between gap-3 py-3 text-xs"><dt className="flex shrink-0 items-center gap-2 text-slate-500"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}
              <div className="flex items-center justify-between gap-3 py-3 text-xs"><dt className="flex items-center gap-2 text-slate-500"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Account status</dt><dd className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium ${user?.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${user?.is_active ? "bg-green-600" : "bg-slate-400"}`} />{user?.is_active ? "Active" : "Inactive"}</dd></div>
            </dl>
          </section>
          <form id="profile-security" onSubmit={savePassword} className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">Change password</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">At least 8 characters, including a letter and a number.</p>
            <div className="mt-5 space-y-4">
              <PasswordField id="current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} disabled={changingPassword} />
              <PasswordField id="new-password" label="New password" value={newPassword} onChange={setNewPassword} disabled={changingPassword} />
              <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} disabled={changingPassword} />
            </div>
            {passwordError && <p role="alert" className="mt-4 text-sm text-red-600">{passwordError}</p>}
            {passwordMessage && <p role="status" className="mt-4 text-sm text-green-700">{passwordMessage}</p>}
            <button type="submit" disabled={changingPassword} className={`mt-5 w-full ${buttonClass}`}><KeyRound className="h-4 w-4" aria-hidden="true" />{changingPassword ? "Changing…" : "Change password"}</button>
          </form>
        </div>
      </div>
    </div>
  );

}

export default function ProfilePage() {
  return <ProtectedRoute><AppLayout><ProfileEditor /></AppLayout></ProtectedRoute>;
}
