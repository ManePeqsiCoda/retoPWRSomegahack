# Documento de Traspaso (Handover) — CRM PQRSD Medellín
> **Fecha**: 19 de Abril, 2026 (05:40 AM)
> **Autor**: Antigravity (IA Coding Assistant) para el equipo GovTech Medellín

## 📑 Índice
1. [Estado Actual del Proyecto](#1-estado-actual-del-proyecto)
2. [Lo que Funciona Hoy](#2-lo-que-funciona-hoy)
3. [Lo que está Roto o Incompleto](#3-lo-que-está-roto-o-incompleto)
4. [La Próxima Tarea Concreta](#4-la-próxima-tarea-concreta)
5. [Tareas Pendientes en Orden de Prioridad](#5-tareas-pendientes-en-orden-de-prioridad)
6. [Arquitectura y Decisiones Importantes](#6-arquitectura-y-decisiones-importantes)
7. [Base de Datos (MotherDuck)](#7-base-de-datos-motherduck)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [Cómo Correr el Proyecto Localmente](#9-cómo-correr-el-proyecto-localmente)
10. [Accesos y Credenciales](#10-accesos-y-credenciales)
11. [Notas Personales del Desarrollador Saliente](#11-notas-personales-del-desarrollador-saliente)

---

## 1. Estado Actual del Proyecto
El proyecto se encuentra en una fase de **estabilización para demo**. Se han resuelto todos los bloqueos de compilación (TypeScript/ESLint) y la aplicación es 100% desplegable en Vercel.

- **Últimas 2 horas**: Se rediseñó el dashboard de reportes añadiendo una gráfica de área para actividad diaria y una gráfica compuesta para tendencias semanales con indicadores de mora (vencidos).
- **IA**: Se migró el modelo a `openai/gpt-oss-120b:free` debido a que el anterior agotó su cuota.
- **Base de Datos**: El esquema en MotherDuck está sincronizado con los campos de ciudadanos (documento, teléfono).
- **Estado del Build**: El último deploy en Vercel pasó exitosamente (`781e314`).

---

## 2. Lo que Funciona Hoy (Confirmado)
| Módulo | Funcionalidad | Ubicación en Código | Notas |
| :--- | :--- | :--- | :--- |
| **Ingesta de Tickets** | Creación vía Email | `src/app/api/emails/incoming` | Limpia automáticamente el formato `Nombre <email@...>` |
| **Radicación Manual** | Creación manual de tickets | `src/app/(crm)/radicacion-manual` | Genera radicados oficiales y envía correo de confirmación. |
| **Bandeja de Entrada** | Filtros y Búsqueda | `src/app/api/tickets/route.ts` | Filtrado por Secretaría, Estado y Tipo de Solicitud. |
| **Análisis de IA** | Resumen y Triaje | `src/services/iaTemplateService.ts` | Extrae nombre/ID del cuerpo del correo y sugiere respuestas. |
| **Reportes** | Dashboard Analítico | `src/app/(crm)/reports` | Métricas de cumplimiento y gráficas de tendencia (Recharts). |
| **Seguimiento Público**| Portal para Ciudadanos | `src/app/seguimiento/[id]` | Acceso sin login mediante el ID del ticket. |
| **Ingesta Automática**| Webhook GAS/Make | `api/emails/incoming` | Escucha POST de servicios externos para crear tickets. Ver snippet en PROYECTO.md. |
| **Admin Tools** | Reset de Base de Datos | `src/app/api/admin/reset-db` | Botón en Settings para limpiar la BD antes de la demo. |

---

## 3. Lo que está Roto o Incompleto
- **Exportación de PDF/CSV**: Los botones en la página de reportes (`/reports`) están implementados visualmente pero no disparan la descarga real de archivos.
- **Historial de Auditoría**: Falta una tabla que registre quién cambió el estado de un ticket y cuándo (solo existe `fecha_actualizacion` en la tabla core).
- **Webhook de WhatsApp**: La lógica está preparada pero no hay un endpoint de entrada real conectado a la API de Meta.

---

## 4. La Próxima Tarea Concreta
**Implementar la exportación a CSV de los tickets filtrados.**
1. Abre `src/app/(crm)/reports/page.tsx`.
2. Crea una función `handleExportCSV` que tome los tickets actuales del hook `useTickets`.
3. Convierte el JSON a un string CSV.
4. Usa un Blob para disparar la descarga en el navegador.
5. Vincula esta función al botón de "Exportar" que actualmente es solo visual.

---

## 5. Tareas Pendientes en Orden de Prioridad
| Tarea | Archivos Relevantes | Complejidad |
| :--- | :--- | :--- |
| Exportación de Datos (CSV/Excel) | `src/app/(crm)/reports/page.tsx` | Baja |
| Notificaciones Push (Nativas Browser) | `src/hooks/useTickets.ts` | Media |
| Filtro por Rango de Fechas en Reportes | `src/hooks/useAnalytics.ts` | Media |
| Integración Real con WhatsApp | `src/app/api/webhook/whatsapp` | Alta |

---

## 6. Arquitectura y Decisiones Importantes
- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Zustand (Auth), Nodemailer (SMTP).
- **MotherDuck (Cloud DuckDB)**: Se eligió por su latencia ultrabaja en consultas analíticas, permitiendo que el dashboard de reportes sea instantáneo sin necesidad de un backend pesado.
- **Postgres Wire Protocol**: Usamos el driver `pg` para conectar con MotherDuck desde Vercel Serverless, evitando problemas de binarios nativos de DuckDB en funciones lambda.

---

## 7. Base de Datos
- **Instancia**: `crm-pqrsd` en MotherDuck.
- **Tablas**:
  - `tickets`: Almacena el ciclo de vida, contenido raw, resúmenes de IA y metadatos legales.
  - `secretarias`: Define las dependencias del distrito y sus colores institucionales.
- **Estado**: Datos de prueba (seeds) cargados. El sistema ejecuta `ensureSchema()` en cada petición para garantizar que las tablas existan.

---

## 8. Variables de Envorno
Necesarias para correr el proyecto (Configuradas en Vercel Dashboard):
- `MOTHERDUCK_TOKEN`: Token de acceso (RW) para la base de datos.
- `OPENROUTER_API_KEY`: Para el motor de IA.
- `SMTP_USER` / `SMTP_PASS`: Credenciales de Gmail para envío de notificaciones.
- `SMTP_MODE`: `live` para enviar correos reales, `mock` para logs locales.
- `NEXT_PUBLIC_OPENROUTER_MODEL`: Actualmente `openai/gpt-oss-120b:free`.

---

## 9. Cómo Correr el Proyecto Localmente
```bash
# 1. Clonar el repo
git clone https://github.com/ManePeqsiCoda/retoPWRSomegahack.git

# 2. Instalar dependencias
npm install

# 3. Configurar variables
cp .env.example .env.local
# Llenar con los valores que están en el dashboard de Vercel

# 4. Iniciar servidor de desarrollo
npm run dev
```

---

## 10. Accesos y Credenciales
- **Producción**: [Vercel Deployment URL]
- **Admin App**:
  - Usuario: `rraliadosteam@gmail.com`
  - Clave: `CRMadmin123`
- **Mock User**:
  - Usuario: `test@rr.com`
  - Clave: `test1234`

---

## 11. Notas Personales del Desarrollador Saliente

> ### Notas de Juan (dev saliente) — léanlas antes de tocar cualquier cosa
> 
> **Sobre el modelo de IA (OpenRouter):**
> La función de responder tickets usa un modelo de IA a través de OpenRouter que actualmente corre gratis, pero consume tokens con cada uso. No la usen seguido. Guarden las interacciones para cuando vayan a hacer la presentación ante los jueces — no queremos quedarnos sin cuota justo ese día.
> 
> **Sobre MotherDuck:**
> Las credenciales de la cuenta de MotherDuck son las mismas del correo rraliadosteam@gmail.com — las consiguen ahí. Recomiendo fuertemente que sigan con MotherDuck y no intenten migrar la base de datos a otra solución. Ya está integrado, ya funciona, y cambiarlo solo generaría deuda técnica innecesaria a estas alturas.
> 
> **Sobre Vercel y el repositorio:**
> El proyecto está desplegado en Vercel conectado al GitHub de Juan. Las credenciales del correo asociado a ese GitHub se las dejo a Rosas directamente — ella es quien tiene acceso para hacer redeploys y gestionar las variables de entorno en el dashboard de Vercel. Cualquier push a main dispara un deploy automático.
> 
> **En general:**
> No cambien lo que está funcionando. El tiempo es corto y la presentación es pronto. Prioridad absoluta: que lo que ya existe se vea impecable y sin errores visibles. Las features nuevas pueden esperar.
> — Juan 🌙

---
*Fin del documento de traspaso.*
