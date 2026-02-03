"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import ErrorMessage from "@/components/ErrorMessage";
import { supabase, Jugador } from "@/lib/supabase";
import FifaCardModal from "@/components/FifaCardModal";
import { useJugadores } from "@/hooks/useJugadores";
import AdminGuard from "@/components/AdminGuard";

export default function Jugadores() {
  const { jugadores, cargando, error: fetchError, mutate } = useJugadores();
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null);

  const agregarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setGuardando(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from("jugadores")
        .insert({ nombre: nombre.trim(), apodo: apodo.trim() || null })
        .select()
        .single();

      if (dbError) throw dbError;
      setNombre("");
      setApodo("");
      mutate();
      toast.success("Jugador agregado");
    } catch (err) {
      console.error("Error agregando jugador:", err);
      toast.error("No se pudo agregar el jugador");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarJugador = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este jugador?")) return;

    setError(null);
    try {
      const { error: dbError } = await supabase.from("jugadores").delete().eq("id", id);
      if (dbError) throw dbError;
      mutate();
      toast.success("Jugador eliminado");
    } catch (err) {
      console.error("Error eliminando jugador:", err);
      toast.error("No se pudo eliminar el jugador");
    }
  };

  const iniciarEdicion = (jugador: Jugador) => {
    setEditando(jugador.id);
    setNombre(jugador.nombre);
    setApodo(jugador.apodo || "");
  };

  const guardarEdicion = async () => {
    if (!editando || !nombre.trim()) return;

    setGuardando(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from("jugadores")
        .update({ nombre: nombre.trim(), apodo: apodo.trim() || null })
        .eq("id", editando);

      if (dbError) throw dbError;
      setEditando(null);
      setNombre("");
      setApodo("");
      mutate();
      toast.success("Jugador actualizado");
    } catch (err) {
      console.error("Error actualizando jugador:", err);
      toast.error("No se pudo guardar la edicion");
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNombre("");
    setApodo("");
  };

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl loading-ball">⚽</div>
          <div className="loading-shadow" />
          <p className="text-white text-lg mt-4 loading-text">Cargando jugadores...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Jugadores
        </h1>

        {/* Error */}
        {(error || fetchError) && (
          <div className="mb-4">
            <ErrorMessage
              mensaje={error || "No se pudieron cargar los jugadores."}
              onReintentar={() => { setError(null); mutate(); }}
            />
          </div>
        )}

        {/* Formulario (solo admin) */}
        <AdminGuard fallback={
          <div className="card p-4 mb-6 text-center text-gray-400 text-sm">
            🔒 Toca para acceder como admin y gestionar jugadores
          </div>
        }>
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editando ? "✏️ Editar jugador" : "➕ Agregar jugador"}
            </h2>
            <form onSubmit={editando ? (e) => { e.preventDefault(); guardarEdicion(); } : agregarJugador}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apodo (opcional)
                </label>
                <input
                  type="text"
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                  placeholder="Ej: Juancho"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={guardando || !nombre.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar"}
                </button>
                {editando && (
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </AdminGuard>

        {/* Lista de jugadores */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Lista de jugadores ({jugadores.length})
          </h2>

          {jugadores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay jugadores registrados. ¡Agregá el primero!
            </p>
          ) : (
            <div className="space-y-2">
              {jugadores.map((jugador, index) => (
                <div
                  key={jugador.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg stagger-item"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <div
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setJugadorSeleccionado(jugador)}
                  >
                    <p className="font-medium text-gray-800">
                      {jugador.apodo || jugador.nombre}
                    </p>
                    {jugador.apodo && (
                      <p className="text-xs text-gray-500">{jugador.nombre}</p>
                    )}
                  </div>
                  <AdminGuard>
                    <div className="flex gap-2">
                      <button
                        onClick={() => iniciarEdicion(jugador)}
                        className="text-blue-500 hover:text-blue-700 text-sm px-2"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarJugador(jugador.id)}
                        className="text-red-400 hover:text-red-600 text-sm px-2"
                      >
                        🗑️
                      </button>
                    </div>
                  </AdminGuard>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FifaCardModal
        jugador={jugadorSeleccionado}
        isOpen={jugadorSeleccionado !== null}
        onClose={() => setJugadorSeleccionado(null)}
      />

      <Navigation />
    </main>
  );
}
