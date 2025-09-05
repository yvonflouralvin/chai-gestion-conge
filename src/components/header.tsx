
"use client";

import type { Employee } from "@/types";
import { UserNav } from "@/components/user-nav";
import { Leaf } from "lucide-react";

type HeaderProps = {
  currentUser: Employee | (Omit<Employee, "id"> & { id: string });
};

export function Header({ currentUser }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card px-[30px]">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 items-center">
          <Leaf className="h-3 w-3 text-primary" />
          <h1 className="text-lg font-bold tracking-tight text-primary">Chai Request</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <UserNav currentUser={currentUser} />
          </nav>
        </div>
      </div>
    </header>
  );
}
