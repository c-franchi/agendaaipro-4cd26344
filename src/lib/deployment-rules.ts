export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], webp: ['image/webp'],
  mp4: ['video/mp4'], mov: ['video/quicktime'], webm: ['video/webm'], pdf: ['application/pdf'],
};
export const UPLOAD_ACCEPT = Object.keys(ALLOWED_UPLOADS).map(e => '.' + e).join(',');

export function validateUpload(f: { name: string; size: number; type: string }): string | null {
  const ext = f.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_UPLOADS[ext] || !ALLOWED_UPLOADS[ext].includes(f.type)) return 'formato não permitido (use JPG, PNG, WEBP, MP4, MOV, WEBM ou PDF)';
  if (f.size <= 0) return 'arquivo vazio';
  if (f.size > MAX_UPLOAD_BYTES) return 'maior que 20 MB';
  return null;
}

/** Safe storage key: only the installation folder + random prefix + sanitized base name. */
export function storageKey(installationId: string, name: string, rand: string = crypto.randomUUID()): string {
  const ext = name.split('.').pop()!.toLowerCase();
  const base = name.slice(0, -(ext.length + 1)).normalize('NFD').replace(/[^\w-]/g, '_').replace(/_+/g, '_').slice(0, 60) || 'arquivo';
  return `${installationId}/${rand.slice(0, 8)}-${base}.${ext}`;
}

export type DeliveryInput = {
  contractFlow?: string | null; orderStage?: string | null; workspacePhase?: string | null;
  externalId?: string | null; domain?: string | null; previewUrl?: string | null;
  enabledFeatures: string[]; checklistPending: number;
};
/** Mirrors the server-side guard; the database trigger is authoritative. */
export function deliveryBlockers(d: DeliveryInput): string[] {
  const out: string[] = [];
  if (d.contractFlow === 'direct' ? d.workspacePhase !== 'approved' : !['ready', 'active'].includes(d.orderStage || '')) out.push('aprovação do pedido');
  if (!d.externalId?.trim()) out.push('identificador da instalação');
  if (!d.domain?.trim() && !d.previewUrl?.trim()) out.push('domínio ou link de entrega');
  if (!d.enabledFeatures.length) out.push('conferência dos módulos do plano');
  if (d.checklistPending > 0) out.push(`${d.checklistPending} etapa(s) do checklist`);
  return out;
}
