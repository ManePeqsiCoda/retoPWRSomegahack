# Handover Técnico: CRM PQRSD → Equipo Backend

Este documento detalla el estado actual del frontend y los requisitos de integración para el backend basado en DuckDB alojado en la infraestructura de Tailscale.

## Estado del Frontend
- ✅ **Scaffold completo**: Next.js 14 (App Router), TypeScript (Strict), Tailwind CSS.
- ✅ **Diseño Institucional**: Aplicada la paleta de colores y tipografía de la Alcaldía de Medellín.
- ✅ **Contrato de Datos**: Interfaces TypeScript alineadas con el esquema de `openapi.json`.
- ✅ **Conexión Real**: Configurada la URL base a través de la red privada `ts.net`.
- ✅ **RBAC Implementado**: Lógica de visibilidad por Secretaría (Salud, Movilidad, etc.) activa.
- ✅ **Semaforización**: Lógica de 15 días hábiles (Ley 1755) operativa en el cliente.
- ✅ **Módulo de IA**: Integrado con OpenRouter para asistencia en respuestas.

## Integración con el Backend Real

### 1. Configuración de Red
El frontend está configurado para consumir los endpoints desde:  
`https://mac-mini-de-juan.tailc85db0.ts.net`

> [!IMPORTANT]
> Para que la conexión sea exitosa, el desarrollador frontend debe estar conectado a la red de **Tailscale**.

### 2. Contrato de Datos y Mapeo
La base de datos DuckDB utiliza `snake_case`. El frontend realiza el mapeo a `camelCase` dentro de `src/services/ticketService.ts`.

#### Endpoints requeridos (FastAPI):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| GET | `/api/tickets` | Lista filtrada. Parámetros: `idSecretaria`, `estado`, `tipoSolicitud`. |
| GET | `/api/tickets/:id` | Detalle completo del PQRSD. |
| PUT | `/api/tickets/:id/responder` | Persiste la respuesta final generada por el funcionario. |
| GET | `/api/secretarias` | Catálogo para selectores de asignación. |
| GET | `/openapi.json` | Documentación técnica del esquema. |

### 3. Seguridad y RBAC
Aunque el frontend filtra la información por la secretaría del usuario (`usuario.idSecretaria`), el backend **DEBE** validar el token en cada petición para asegurar que el funcionario no acceda a tickets de otras dependencias mediante la manipulación de la URL.

## Estructura de Archivos Clave
- `src/services/ticketService.ts`: Punto central de las llamadas fetch.
- `src/types/index.ts`: Definición de los modelos Ticket, Ciudadano y Secretaria.
- `src/lib/urgency.ts`: Cálculo de días restantes y colores del semáforo.
- `src/store/authStore.ts`: Estado global del usuario y su rol.

## Notas para la Demo (OmegaHack 2026)
- **Escenario 1 (RBAC)**: Iniciar sesión con "María Camila Restrepo" (Secretaría de Salud). Verificar que solo se ven PQRSDs de salud.
- **Escenario 2 (Semaforización)**: Identificar tickets con el tag rojo (≤ 2 días).
- **Escenario 3 (IA)**: Utilizar el botón "Asistente de IA" para regenerar una respuesta empática usando el modelo de OpenRouter.
