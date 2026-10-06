"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User as UserIcon } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/common/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const buttonClass = "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50";

function ProfileEditor() {
  const { user, refreshUser } = useAuth();
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

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">Manage your personal details, photo and password.</p>
      <form onSubmit={saveProfile} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Profile photo preview" className="h-full w-full object-cover" />
            ) : <UserIcon className="h-9 w-9" />}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="profile-photo">Profile photo</label>
            <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={saving || photoLoading} className="mt-2 block w-full max-w-xs text-xs" />
            <p className="mt-2 text-xs text-slate-500">JPEG, PNG or WebP · up to 5 MB</p>
            {avatar && <button type="button" disabled={saving || photoLoading} onClick={() => { setAvatar(null); setPhotoChanged(true); }} className="mt-2 text-xs font-medium text-red-600">Remove photo</button>}
          </div>
        </div>
        <label className="mt-5 block text-sm font-medium" htmlFor="profile-name">Name</label>
        <input id="profile-name" autoComplete="name" required maxLength={120} value={name} disabled={saving} onChange={e => setName(e.target.value)} className={inputClass} />
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Email</dt><dd className="mt-1 break-all">{user?.email}</dd></div>
          <div><dt className="text-slate-500">Role</dt><dd className="mt-1">{user?.role.replace(/_/g, " ")}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">Contact your administrator to change your email or access permissions.</p>
        {profileError && <p role="alert" className="mt-4 text-sm text-red-600">{profileError}</p>}
        {profileMessage && <p role="status" className="mt-4 text-sm text-green-700">{profileMessage}</p>}
        <button type="submit" disabled={saving || photoLoading} className={`mt-5 ${buttonClass}`}>{saving ? "Saving…" : photoLoading ? "Processing photo…" : "Save profile"}</button>
      </form>
      <form onSubmit={savePassword} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-2 text-xs text-slate-500">At least 8 characters, including a letter and a number.</p>
        <label htmlFor="current-password" className="mt-5 block text-sm font-medium">Current password</label>
        <input id="current-password" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
        <label htmlFor="new-password" className="mt-4 block text-sm font-medium">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
        <label htmlFor="confirm-password" className="mt-4 block text-sm font-medium">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
        {passwordError && <p role="alert" className="mt-4 text-sm text-red-600">{passwordError}</p>}
        {passwordMessage && <p role="status" className="mt-4 text-sm text-green-700">{passwordMessage}</p>}
        <button type="submit" disabled={changingPassword} className={`mt-5 ${buttonClass}`}>{changingPassword ? "Changing…" : "Change password"}</button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return <ProtectedRoute><AppLayout><ProfileEditor /></AppLayout></ProtectedRoute>;
}
