import type { DefaultSession } from "next-auth";
import type { Role, Region } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    region: Region | null;
    creatorId: string | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      region: Region | null;
      creatorId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    region: Region | null;
    creatorId: string | null;
  }
}
