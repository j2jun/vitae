import {
  ClerkProvider,
  Show,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header>
            <h1>vitae</h1>
            <div className="auth-controls">
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
