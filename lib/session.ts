/**
 * Utilidad para generar/obtener un session_id anónimo.
 * Se usa para predicciones sin necesidad de login.
 * El ID se guarda en localStorage y persiste entre sesiones del mismo navegador.
 */

const SESSION_KEY = "futbol5_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
