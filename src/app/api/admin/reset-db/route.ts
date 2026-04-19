import { NextRequest, NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/motherduck';

/**
 * POST /api/admin/reset-db
 * ⚠️ PELIGRO: Limpia toda la base de datos para presentaciones limpias.
 */
export async function POST(_req: NextRequest) {
  try {
    // 1. Verificación básica de seguridad (opcional, pero recomendada)
    // En una app real usaríamos roles de admin, aquí confiamos en el acceso físico del presentador
    
    await ensureSchema();

    console.log('[Admin] ⚠️ Iniciando reset de base de datos...');

    // 2. Limpiar tablas
    // TRUNCATE es más rápido que DELETE y resetea contadores si los hubiera
    await query('DELETE FROM tickets');
    
    // Si tienes otras tablas que limpiar, añádelas aquí
    try {
      await query('DELETE FROM registros_email');
    } catch {
      // Ignorar si la tabla no existe aún
    }

    console.log('[Admin] ✅ Base de datos reseteada con éxito');

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin] ❌ Error en reset de DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
