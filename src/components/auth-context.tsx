
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Employee, EmployeeRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: (Omit<Employee, "id"> & { id: string }) | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<(Omit<Employee, "id"> & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            name: user.displayName || userData.name || 'No Name',
            title: userData.title,
            team: userData.team,
            avatar: user.photoURL || userData.avatar || `https://placehold.co/40x40.png`,
            supervisorId: userData.supervisorId,
            role: userData.role as EmployeeRole,
            contractType: userData.contractType,
            contractStartDate: userData.contractStartDate.toDate(),
            contractEndDate: userData.contractEndDate ? userData.contractEndDate.toDate() : null,
            email: user.email!
          });
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
