import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types';
import { USUARIOS_MOCK } from '@/services/mockData';

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones
  login: (idUsuario: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial (se pre-carga sec-salud para la demo)
      usuario: USUARIOS_MOCK[0], // María Camila Restrepo (sec-salud)
      isAuthenticated: true,
      isLoading: false,

      login: async (idUsuario: string) => {
        set({ isLoading: true });
        
        // Simular latencia de autenticación
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = USUARIOS_MOCK.find(u => u.idUsuario === idUsuario);
        
        if (user) {
          set({ 
            usuario: user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
          throw new Error('Usuario no encontrado');
        }
      },

      logout: () => {
        set({ 
          usuario: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },
    }),
    {
      name: 'crm-pqrsd-auth', // localStorage key
    }
  )
);

/**
 * Selector hook para obtener el ID de la secretaría activa de forma reactiva.
 */
export const useIdSecretariaActivo = () => 
  useAuthStore((state) => state.usuario?.idSecretaria ?? '');
