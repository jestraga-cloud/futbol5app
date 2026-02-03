import { PartidoConJugadores } from "./supabase";

function getNombresEquipo(partido: PartidoConJugadores, equipo: "A" | "B"): string {
  return partido.participaciones
    .filter((p) => p.equipo === equipo)
    .map((p) => p.jugador?.apodo || p.jugador?.nombre || "")
    .filter(Boolean)
    .join(", ");
}

function formatFecha(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatMatchResult(partido: PartidoConJugadores): string {
  const equipoA = getNombresEquipo(partido, "A");
  const equipoB = getNombresEquipo(partido, "B");
  const ganador =
    partido.goles_equipo_a > partido.goles_equipo_b
      ? "Gano Equipo A"
      : partido.goles_equipo_b > partido.goles_equipo_a
      ? "Gano Equipo B"
      : "Empate";

  return [
    `*Futbol 5* - ${formatFecha(partido.fecha)}`,
    ``,
    `*Equipo A:* ${equipoA}`,
    `*${partido.goles_equipo_a}* - *${partido.goles_equipo_b}*`,
    `*Equipo B:* ${equipoB}`,
    ``,
    ganador,
  ].join("\n");
}

export function formatUpcomingMatch(partido: PartidoConJugadores): string {
  const equipoA = getNombresEquipo(partido, "A");
  const equipoB = getNombresEquipo(partido, "B");

  return [
    `*Futbol 5* - ${formatFecha(partido.fecha)}`,
    ``,
    `*Equipo A:* ${equipoA}`,
    `vs`,
    `*Equipo B:* ${equipoB}`,
    ``,
    `Quien gana?`,
  ].join("\n");
}

export function formatMVPInvite(partido: PartidoConJugadores, baseUrl: string): string {
  const equipoA = getNombresEquipo(partido, "A");
  const equipoB = getNombresEquipo(partido, "B");
  const votarUrl = `${baseUrl}/partidos?votar=${partido.id}`;

  return [
    `*Futbol 5* - ${formatFecha(partido.fecha)}`,
    ``,
    `${equipoA}`,
    `*${partido.goles_equipo_a}* - *${partido.goles_equipo_b}*`,
    `${equipoB}`,
    ``,
    `Vota al MVP del partido:`,
    votarUrl,
  ].join("\n");
}

export function getWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
