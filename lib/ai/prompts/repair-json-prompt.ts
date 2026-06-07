export function buildRepairJSONPrompt(raw: string, schemaName: string) {
  return `Recibirás una respuesta que debería ser JSON válido para ${schemaName}. Corrígela para que cumpla exactamente el schema solicitado. No cambies el significado. No añadas datos nuevos. No inventes información. Devuelve solo JSON válido.\nRespuesta a reparar:\n${raw.slice(0, 12000)}`;
}
