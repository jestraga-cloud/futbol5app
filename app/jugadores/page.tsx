"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase, Jugador } from "@/lib/supabase";
import FifaCardModal from "@/components/FifaCardModal";

export default function Jugadores() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null);

  useEffect(() => {
    cargarJugadores();
  }, []);

  const cargarJugadores = async () => {
    try {
      const { data } = await supabase
        .from("jugadores")
        .select("*")
        .order("nombre");
      if (data) setJugadores(data);
    } catch (error) {
      console.error("Error cargando jugadores:", error);
    } finally {
      setCargando(false);
    }
  };

  const agregarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from("jugadores")
        .insert({ nombre: nombre.trim(), apodo: apodo.trim() || null })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setJugadores([...jugadores, data].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        ));
        setNombre("");
        setApodo("");
      }
    } catch (error) {
      console.error("Error agregando jugador:", error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarJugador = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este jugador?")) return;

    try {
      await supabase.from("jugadores").delete().eq("id", id);
      setJugadores(jugadores.filter((j) => j.id !== id));
    } catch (error) {
      console.error("Error eliminando jugador:", error);
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
    try {
      const { error } = await supabase
        .from("jugadores")
        .update({ nombre: nombre.trim(), apodo: apodo.trim() || null })
        .eq("id", editando);

      if (error) throw error;

      setJugadores(
        jugadores.map((j) =>
          j.id === editando
            ? { ...j, nombre: nombre.trim(), apodo: apodo.trim() || undefined }
            : j
        )
      );
      setEditando(null);
      setNombre("");
      setApodo("");
    } catch (error) {
      console.error("Error actualizando jugador:", error);
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
          <div className="text-6xl soccer-ball mb-4">⚽</div>
          <p className="text-white text-lg">Cargando jugadores...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          👥 Jugadores
        </h1>

        {/* Formulario */}
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
              {jugadores.map((jugador) => (
                <div
                  key={jugador.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
