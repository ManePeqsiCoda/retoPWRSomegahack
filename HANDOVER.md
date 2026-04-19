# Documento de Traspaso (Handover) — CRM PQRSD Medellín
> **Última Actualización**: 19 de Abril, 2026 (06:55 AM)
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
El sistema ha alcanzado su **estabilidad final para la demo del hackathon**. Se han implementado capas de robustez en la ingesta de datos y herramientas de supervisión jerárquica.

- **Migración Exitosa**: Todos los servicios (DB, SMTP, Auth) operan bajo la cuenta `rraliadosteam@gmail.com`.
- **Inteligencia de Datos**: La IA ahora extrae identidad exclusivamente del cuerpo del correo, ignorando metadatos técnicos.
- **Robustez en Ingesta**: Filtro anti-spam activo y persistencia inmediata en MotherDuck incluso para solicitudes incompletas.
- **Simulador de Roles**: Implementado el selector de secretarías y el **Modo Alcalde** en la configuración.

---

## 2. Lo que Funciona Hoy (Confirmado)
| Módulo | Funcionalidad | Ubicación en Código | Notas |
| :--- | :--- | :--- | :--- |
| **Filtro Anti-Spam** | Bloqueo de bots/redes sociales | `src/app/api/emails/incoming` | Ignora correos de Instagram, FB y palabras clave (noreply). |
| **Triaje Estricto** | Extracción de Identidad | `src/services/iaTemplateService.ts`| Solo extrae nombre si el usuario lo escribe (Privacidad). |
| **Radicación Instantánea**| Generación de radicado | `api/emails/incoming` | El ciudadano recibe su número real de inmediato, aun sin datos. |
| **Persistencia Live** | Sincronización DB | `src/lib/motherduck.ts` | Ingesta directa a `crm-pqrsyd` con mapeo de campos completo. |
| **Modo Alcalde** | Supervisión Global | `src/app/(crm)/settings` | Permite ver el 100% de los tickets de todas las secretarías. |
| **Dashboard** | Bandeja en Tiempo Real | `src/app/(crm)/dashboard` | Consumo directo de MotherDuck con filtros dinámicos. |

---

## 3. Lo que está Roto o Incompleto
- **Exportación de PDF/CSV**: Los botones en la página de reportes (`/reports`) están implementados visualmente pero no disparan la descarga real de archivos.
- **Historial de Auditoría**: Falta una tabla que registre quién cambió el estado de un ticket y cuándo.
- **Webhook de WhatsApp**: La lógica está preparada pero requiere conexión final con la API de Meta.

---

## 4. La Próxima Tarea Concreta
**Implementar la exportación a CSV de los tickets filtrados.**
1. Abre `src/app/(crm)/reports/page.tsx`.
2. Crea una función `handleExportCSV` que tome los tickets actuales del hook `useTickets`.
3. Convierte el JSON a un string CSV.
4. Usa un Blob para disparar la descarga en el navegador.

---

## 5. Tareas Pendientes en Orden de Prioridad
1. **Exportación de Datos (CSV/Excel)**: Crítico para que los jueces vean que la data se puede sacar del sistema.
2. **Notificaciones Push**: Para alertar al funcionario cuando entra un ticket crítico.
3. **Filtro por Rango de Fechas**: En el dashboard de analítica.

---

## 6. Arquitectura y Decisiones Importantes
- **MotherDuck (Cloud DuckDB)**: Se utiliza como almacén analítico y operacional unificado.
- **Identidad Progresiva**: El sistema permite crear tickets "Incompletos" para no perder el contacto inicial del ciudadano, manteniendo la continuidad mediante `MEMORIA_HILOS_MOCK`.
- **Seguridad SMTP**: Uso de App Passwords de Google para el envío masivo de notificaciones oficiales.

---

## 7. Base de Datos
- **Instancia**: `crm-pqrsyd` en MotherDuck.
- **Esquema**: Tabla `tickets` con campos extendidos para documento y teléfono.
- **Consumo**: El frontend consume vía `/api/tickets` que mapea de SQL a JSON camelCase automáticamente.

---

## 8. Variables de Entorno (Vercel)
- `MOTHERDUCK_TOKEN`: (Nuevo token de rraliadosteam)
- `MOTHERDUCK_DB`: `crm-pqrsyd`
- `SMTP_USER`: `rraliadosteam@gmail.com`
- `SMTP_PASS`: `lgnh xhyx xgqf nhga`
- `OPENROUTER_API_KEY`: API Key activa.

---

## 10. Accesos y Credenciales
- **Admin App**:
  - Usuario: `rraliadosteam@gmail.com`
  - Clave: `CRMadmin123`
- **Modo de Operación**: Cambiar en Settings a "ALCALDE" para ver todo.

---

## 11. Notas Finales
El sistema está en su mejor momento técnico. La ingesta de correos es "a prueba de balas" (filtra spam y persiste todo). El "Modo Alcalde" es la joya de la corona para la demo, usadlo para mostrar cómo la Alcaldía tiene visión 360 sobre los problemas de Medellín.

¡Buena suerte en la presentación! 🚀
