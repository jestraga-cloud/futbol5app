"use client";

interface Props {
  pasoActual: 1 | 2 | 3;
}

const pasos = [
  { label: "Jugadores", icon: "👥" },
  { label: "Modo", icon: "⚙️" },
  { label: "Equipos", icon: "⚽" },
];

export default function WizardProgress({ pasoActual }: Props) {
  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center">
        {pasos.map((paso, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < pasoActual;
          const isActive = stepNum === pasoActual;

          return (
            <div key={paso.label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? "✓" : paso.icon}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isCompleted
                      ? "text-green-600"
                      : isActive
                      ? "text-purple-600"
                      : "text-gray-400"
                  }`}
                >
                  {paso.label}
                </span>
              </div>

              {/* Connector line */}
              {index < pasos.length - 1 && (
                <div
                  className={`h-0.5 flex-1 -mt-4 mx-2 transition-all ${
                    stepNum < pasoActual ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
