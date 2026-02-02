"use client";

interface Props {
  mensaje: string;
  onReintentar?: () => void;
}

export default function ErrorMessage({ mensaje, onReintentar }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mx-4">
      <p className="text-red-600 text-sm mb-2">{mensaje}</p>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="text-sm text-red-700 underline hover:text-red-900"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
