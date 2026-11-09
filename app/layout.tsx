import {
  ClerkProvider,
  Show,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import Ambience from "@/components/Ambience";
import ThemePicker from "@/components/ThemePicker";
import { applyAmbience } from "@/lib/ambience";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Apply the saved theme before first paint, so there is no flash of the default. */}
          <script dangerouslySetInnerHTML={{ __html: `(${applyAmbience.toString()})()` }} />
        </head>
        <body>
          <Ambience />
          <header>
            <h1>vitae</h1>
            <div className="auth-controls">
              <ThemePicker />
              <Show when="signed-out">
                <SignInButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
                <SignOutButton />
              </Show>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
