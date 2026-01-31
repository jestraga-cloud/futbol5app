// Script para procesar el CSV de Google Forms y generar SQL de inserción
const csv = `Marca temporal,Dirección de correo electrónico,Batracio - Fuerza,Batracio - Arquero,Batracio - Tiro,Batracio - Regate,Batracio - Pase,Batracio - Defensa,Batracio - Estado Fisico,Batracio - Reaccion,Chinela - Fuerza,Chinela - Arquero,Chinela - Tiro,Chinela - Regate,Chinela - Pase,Chinela - Defensa,Chinela - Estado Fisico,Chinela - Reaccion,Colo - Fuerza,Colo - Arquero,Colo - Tiro,Colo - Regate,Colo - Pase,Colo - Defensa,Colo - Estado Fisico,Colo - Reaccion,Tybo - Fuerza,Tybo - Arquero,Tybo - Tiro,Tybo - Regate,Tybo - Pase,Tybo - Defensa,Tybo - Estado Fisico,Tybo - Reaccion,Gudi - Fuerza,Gudi - Arquero,Gudi - Tiro,Gudi - Regate,Gudi - Pase,Gudi - Defensa,Gudi - Estado Fisico,Gudi - Reaccion,Manu - Fuerza,Manu - Arquero,Manu - Tiro,Manu - Regate,Manu - Pase,Manu - Defensa,Manu - Estado Fisico,Manu - Reaccion,Mario - Fuerza,Mario - Arquero,Mario - Tiro,Mario - Regate,Mario - Pase,Mario - Defensa,Mario - Estado Fisico,Mario - Reaccion,Mati - Fuerza,Mati - Arquero,Mati - Tiro,Mati - Regate,Mati - Pase,Mati - Defensa,Mati - Estado Fisico,Mati - Reaccion,Negro - Fuerza,Negro - Arquero,Negro - Tiro,Negro - Regate,Negro - Pase,Negro - Defensa,Negro - Estado Fisico,Negro - Reaccion,Nico - Fuerza,Nico - Arquero,Nico - Tiro,Nico - Regate,Nico - Pase,Nico - Defensa,Nico - Estado Fisico,Nico - Reaccion,Romo - Fuerza,Romo - Arquero,Romo - Tiro,Romo - Regate,Romo - Pase,Romo - Defensa,Romo - Estado Fisico,Romo - Reaccion,Sapito - Fuerza,Sapito - Arquero,Sapito - Tiro,Sapito - Regate,Sapito - Pase,Sapito - Defensa,Sapito - Estado Fisico,Sapito - Reaccion,Titi - Fuerza,Titi - Arquero,Titi - Tiro,Titi - Regate,Titi - Pase,Titi - Defensa,Titi - Estado Fisico,Titi - Reaccion,Uri - Fuerza,Uri - Arquero,Uri - Tiro,Uri - Regate,Uri - Pase,Uri - Defensa,Uri - Estado Fisico,Uri - Reaccion,Eli - Fuerza,Eli - Arquero,Eli - Tiro,Eli - Regate,Eli - Pase,Eli - Defensa,Eli - Estado Fisico,Eli - Reaccion,Dtoke - Fuerza,Dtoke - Arquero,Dtoke - Tiro,Dtoke - Regate,Dtoke - Pase,Dtoke - Defensa,Dtoke - Estado Fisico,Dtoke - Reaccion,Oso - Fuerza,Oso - Arquero,Oso - Tiro,Oso - Regate,Oso - Pase,Oso - Defensa,Oso - Estado Fisico,Oso - Reaccion,Pepo - Fuerza,Pepo - Arquero,Pepo - Tiro,Pepo - Regate,Pepo - Pase,Pepo - Defensa,Pepo - Estado Fisico,Pepo - Reaccion
31/01/2026 19:03:56,jestraga@gmail.com,6,4,6,6,4,7,6,5,5,6,7,7,5,5,6,7,6,5,5,6,7,5,5,6,6,4,7,5,5,4,7,6,4,3,6,6,7,6,5,6,7,5,7,6,5,5,5,5,10,9,9,10,9,7,9,10,6,5,7,7,8,6,8,6,8,5,7,6,6,6,4,5,6,5,5,5,4,5,6,5,6,5,8,8,7,5,8,7,5,5,5,5,5,5,5,5,6,5,7,8,7,6,9,8,6,3,8,6,5,2,4,3,6,8,7,8,7,4,4,5,7,6,8,8,7,6,7,7,8,8,7,4,7,6,2,4,6,5,4,6,7,5,5,4
31/01/2026 19:05:59,guidokogan@gmail.com,8,5,3,5,4,8,9,4,5,8,8,7,7,5,6,8,5,3,7,3,7,4,4,6,7,5,7,4,4,4,7,5,2,2,7,5,8,7,6,6,8,5,9,5,7,4,5,5,9,10,10,8,7,6,9,10,9,5,7,7,5,5,7,7,9,4,7,5,6,3,3,6,8,3,7,7,6,7,8,7,7,4,9,8,6,3,8,7,5,5,5,5,5,5,5,5,7,9,8,9,7,7,9,7,8,4,8,4,4,2,3,3,5,8,8,9,7,6,5,7,5,5,8,9,8,3,7,7,8,10,8,4,7,8,3,5,6,6,6,4,5,6,3,4
31/01/2026 19:15:24,brianberkman@gmail.com,6,7,3,5,3,6,6,4,5,7,5,4,5,3,6,5,6,4,7,6,6,4,4,3,4,6,5,4,4,2,6,5,3,2,7,6,6,5,6,4,5,1,6,5,3,2,5,2,8,7,8,8,8,5,7,6,6,4,6,5,5,4,10,6,6,3,6,5,6,2,2,2,4,7,5,5,3,4,5,4,5,2,8,6,5,2,6,6,1,1,5,5,4,2,6,3,5,7,6,5,4,5,9,6,6,3,6,3,4,2,5,3,2,6,5,5,5,5,4,5,5,2,6,5,5,2,6,5,8,9,6,1,5,7,2,3,5,2,6,6,5,2,5,3
31/01/2026 19:22:26,tomasmsabah@gmail.com,7,7,4,5,5,7,7,5,4,7,5,5,5,4,4,5,5,5,6,4,6,6,4,5,6,6,4,4,4,5,5,6,4,5,7,6,7,5,5,6,6,5,7,6,5,6,6,5,7,8,10,9,9,8,8,9,7,6,8,8,8,7,8,8,8,5,7,6,6,6,3,5,6,5,6,7,7,8,8,7,8,7,9,8,8,8,8,8,5,5,5,5,5,5,5,5,5,8,7,9,8,7,9,8,6,5,7,6,6,3,4,5,4,6,7,6,6,6,5,8,7,5,8,8,7,6,7,7,9,10,8,4,6,8,2,7,6,5,6,4,4,5,4,5
31/01/2026 19:19:51,marianorapari@gmail.com,7,5,3,4,3,6,6,4,5,7,5,5,4,5,4,4,5,3,5,5,5,5,5,5,6,5,4,4,5,4,5,4,4,3,6,4,6,7,5,5,6,4,7,5,5,6,5,4,5,6,7,8,7,5,5,6,7,5,4,5,5,6,8,6,7,3,5,5,4,5,2,4,6,4,4,4,5,6,7,5,5,3,8,7,7,5,5,7,4,3,4,5,5,4,5,4,6,7,4,5,5,7,8,6,5,3,7,3,3,2,3,3,4,6,6,6,5,5,5,5,4,2,6,7,7,4,5,6,8,9,6,3,5,7,4,3,5,4,5,5,5,6,6,5
31/01/2026 19:43:03,nicolasturchiaro@gmail.com,6,3,4,4,5,8,8,5,5,7,5,6,5,4,6,5,6,4,6,5,4,6,6,5,8,3,7,4,6,3,5,5,4,2,8,4,8,7,9,5,6,3,8,5,5,4,5,5,8,9,10,10,9,8,9,9,5,4,7,6,5,4,9,7,8,6,6,5,5,5,4,5,6,4,6,6,5,5,7,5,4,4,8,8,7,4,6,7,5,5,5,5,5,5,5,5,5,9,8,8,7,5,10,6,6,4,6,4,5,5,5,5,4,8,7,7,6,3,4,6,4,3,6,6,5,4,5,6,8,9,7,3,7,8,5,4,5,3,6,4,7,6,5,5`;

const lines = csv.split('\n');
const headers = lines[0].split(',');

// Extract player names and skills from headers
const players = {};
const skills = ['Fuerza', 'Arquero', 'Tiro', 'Regate', 'Pase', 'Defensa', 'Estado Fisico', 'Reaccion'];
const skillDbNames = ['fuerza', 'arquero', 'tiro', 'regate', 'pase', 'defensa', 'estado_fisico', 'reaccion'];

for (let i = 2; i < headers.length; i++) {
  const parts = headers[i].split(' - ');
  const playerName = parts[0].trim();
  if (!players[playerName]) {
    players[playerName] = { scores: {} };
    skillDbNames.forEach(s => players[playerName].scores[s] = []);
  }
}

// Parse responses
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  let colIdx = 2;
  for (const playerName of Object.keys(players)) {
    for (let s = 0; s < skillDbNames.length; s++) {
      const val = parseInt(values[colIdx]);
      if (!isNaN(val)) {
        players[playerName].scores[skillDbNames[s]].push(val);
      }
      colIdx++;
    }
  }
}

// Calculate averages and scale to 1-99
// Original scores are 1-10, so multiply by ~9.9 to get 1-99 range
console.log('-- Promedios calculados de 6 respuestas, escalados a 1-99\n');
console.log('-- Insertar habilidades de jugadores\n');

const inserts = [];
for (const [name, data] of Object.entries(players)) {
  const avgs = {};
  for (const skill of skillDbNames) {
    const arr = data.scores[skill];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    // Scale from 1-10 to 1-99
    const scaled = Math.round(((avg - 1) / 9) * 98 + 1);
    avgs[skill] = Math.max(1, Math.min(99, scaled));
  }

  console.log(`-- ${name}: raw avgs = ${skillDbNames.map(s => {
    const arr = data.scores[s];
    return (arr.reduce((a,b) => a+b,0)/arr.length).toFixed(1);
  }).join(', ')}`);

  inserts.push(
    `  ((SELECT id FROM jugadores WHERE LOWER(apodo) = LOWER('${name}')), ${avgs.fuerza}, ${avgs.arquero}, ${avgs.tiro}, ${avgs.regate}, ${avgs.pase}, ${avgs.defensa}, ${avgs.estado_fisico}, ${avgs.reaccion})`
  );
}

console.log('\nINSERT INTO habilidades_jugador (jugador_id, fuerza, arquero, tiro, regate, pase, defensa, estado_fisico, reaccion)');
console.log('VALUES');
console.log(inserts.join(',\n') + ';');
