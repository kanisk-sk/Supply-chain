import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import LoadingGate from "@/components/common/LoadingGate";

export const metadata = {
  title: "Supply Chain Tracking & Analytics",
  description: "Functional Supply Chain Management Frontend",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <AuthProvider>
          <LoadingGate>{children}</LoadingGate>
        </AuthProvider>
      </body>
    </html>
  );
}

