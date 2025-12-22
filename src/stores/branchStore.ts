import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  is_main: boolean;
  is_active: boolean;
}

interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  setBranches: (branches: Branch[]) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  selectBranch: (branchId: string) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      currentBranch: null,
      
      setBranches: (branches) => set({ branches }),
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      selectBranch: (branchId) => {
        const branch = get().branches.find(b => b.id === branchId);
        if (branch) {
          set({ currentBranch: branch });
        }
      },
    }),
    {
      name: 'branch-store',
    }
  )
);
