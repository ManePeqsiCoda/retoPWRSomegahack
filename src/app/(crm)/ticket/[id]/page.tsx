'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTicketDetail } from '@/hooks/useTicketDetail';
import { TicketDetail, ResponseEditor } from '@/components/ticket';
import { ArrowLeft } from 'lucide-react';
import { SkeletonDetailPage, EmptyState } from '@/components/shared';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idTicket = params.id as string;
  
  const {
    ticket,
    isLoading,
    error,
    respuestaActual,
    isSubmitting,
    submitSuccess,
    hasUnsavedChanges,
    resumenCargando,
    resumenError,
    isConfirmModalOpen,
    isSendingEmail,
    emailSendResult,
    emailError,
    openConfirmModal,
    closeConfirmModal,
    confirmarYEnviar,
    setRespuestaActual,
    submitRespuesta,
    resetRespuesta,
  } = useTicketDetail(idTicket);

  // 1. ESTADO DE CARGA
  if (isLoading) {
    return <SkeletonDetailPage />;
  }

  // 2. ESTADO DE ERROR (incluyendo ACCESO_DENEGADO y NOT_FOUND)
  if (error && !ticket) {
    const isUnauthorized = error.includes('permisos');
    return (
      <div className="bg-white rounded-2xl border border-gov-gray-100 shadow-sm overflow-hidden">
        <EmptyState 
          variant={isUnauthorized ? 'unauthorized' : 'error'}
          customMessage={error}
          onAction={() => router.push('/dashboard')}
          actionLabel="Volver a Bandeja de Entrada"
        />
      </div>
    );
  }

  if (!ticket) return null;

  // 3. ESTADO NORMAL
  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Botón de regreso */}
      <button 
        onClick={() => router.push('/dashboard')} 
        className="flex items-center gap-2 text-sm font-bold text-gov-gray-500 hover:text-gov-blue-700 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        Volver a Bandeja de Entrada
      </button>
      
      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8 items-start">
        {/* Columna Izquierda: Información del Ticket */}
        <section className="bg-white rounded-2xl border border-gov-gray-100 shadow-sm p-8">
          <TicketDetail
            ticket={ticket}
            resumenCargando={resumenCargando}
            resumenError={resumenError}
          />
        </section>

        {/* Columna Derecha: Editor de Respuesta */}
        <section className="sticky top-6">
          <ResponseEditor
            ticket={ticket}
            respuestaActual={respuestaActual}
            respuestaSugerida={ticket.respuestaSugerida}
            isSubmitting={isSubmitting}
            submitSuccess={submitSuccess}
            hasUnsavedChanges={hasUnsavedChanges}
            error={error} // Pasamos el error si existe para mostrarlo en el banner del editor
            isConfirmModalOpen={isConfirmModalOpen}
            isSendingEmail={isSendingEmail}
            emailSendResult={emailSendResult}
            emailError={emailError}
            onRespuestaChange={setRespuestaActual}
            onReset={resetRespuesta}
            onOpenConfirmModal={openConfirmModal}
            onCloseConfirmModal={closeConfirmModal}
            onConfirmarEnvio={confirmarYEnviar}
          />
        </section>
      </div>
    </div>
  );
}
