"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { useState } from "react";

// Define extended session user type
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Access user with proper type safety
  const user = session?.user as ExtendedUser | undefined;

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold transition-transform duration-200 hover:scale-105"
            >
              <span className="text-primary">Menged</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/map"
                className="text-sm font-medium relative px-2 py-1 transition-colors duration-200 hover:text-primary group"
              >
                Route Planner
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {user?.role === "ADMIN" || user?.role === "TRANSPORT_OFFICIAL" ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium relative px-2 py-1 transition-colors duration-200 hover:text-primary group"
                >
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ) : null}
            </nav>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="transition-transform duration-200 hover:scale-110"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Authentication */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full transition-transform duration-200 hover:scale-110"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image || ""}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback>
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="w-full transition-colors duration-200 hover:text-primary"
                    >
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" ||
                  user.role === "TRANSPORT_OFFICIAL" ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="w-full transition-colors duration-200 hover:text-primary"
                      >
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer transition-colors duration-200 hover:text-primary hover:bg-primary/10"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                variant="outline"
                className="transition-transform duration-200 hover:scale-105 hover:bg-primary/10"
              >
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu - Slide Down */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-4">
              <Link
                href="/map"
                className="text-sm font-medium px-2 py-2 transition-colors duration-200 hover:text-primary hover:bg-primary/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Route Planner
              </Link>
              {user?.role === "ADMIN" || user?.role === "TRANSPORT_OFFICIAL" ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium px-2 py-2 transition-colors duration-200 hover:text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : null}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium px-2 py-2 transition-colors duration-200 hover:text-primary hover:bg-primary/10 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    className="justify-start text-sm font-medium px-2 py-2 h-auto transition-colors duration-200 hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium px-2 py-2 transition-colors duration-200 hover:text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
