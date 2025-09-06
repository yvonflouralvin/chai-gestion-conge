
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Employee, EmployeeWithCurrentContract } from '@/types';
import { processEmployee } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: EmployeeWithCurrentContract | null; // Renommé pour plus de clarté
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<EmployeeWithCurrentContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const processedUser = processEmployee(userDoc.data(), user.uid);
          setCurrentUser({
            ...processedUser,
            name: user.displayName || processedUser.name,
            avatar: user.photoURL || processedUser.avatar,
            email: user.email!
          });
        } else {
            // Handle case where user exists in Auth but not in Firestore
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
