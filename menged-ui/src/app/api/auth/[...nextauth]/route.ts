import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Configure NextAuth options
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For demonstration purposes, we'll just accept test accounts
        if (
          credentials.email === "admin@menged.com" &&
          credentials.password === "password"
        ) {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@menged.com",
            role: "ADMIN",
          };
        }

        if (
          credentials.email === "official@menged.com" &&
          credentials.password === "password"
        ) {
          return {
            id: "2",
            name: "Transport Official",
            email: "official@menged.com",
            role: "TRANSPORT_OFFICIAL",
          };
        }

        if (
          credentials.email === "user@menged.com" &&
          credentials.password === "password"
        ) {
          return {
            id: "3",
            name: "Regular User",
            email: "user@menged.com",
            role: "USER",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add role to the token when user signs in
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to the session user
      if (session.user && token) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
