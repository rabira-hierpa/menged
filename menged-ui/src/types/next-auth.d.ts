import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session types
   */
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  /**
   * Extends the built-in user types
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT types
   */
  interface JWT {
    id?: string;
    role?: string;
  }
}
