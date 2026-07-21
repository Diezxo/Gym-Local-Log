const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('❌ Error: Debes proporcionar la ruta a la carpeta sincronizada.');
  console.log('Uso: node scripts/clean-history.js "C:\\Ruta\\A\\Tu\\Carpeta"');
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  console.error(`❌ Error: La ruta no existe: ${targetDir}`);
  process.exit(1);
}

const tagMap = {
  'Pecho': 'Chest',
  'Espalda': 'Back',
  'Piernas': 'Legs',
  'Brazos': 'Arms',
  'Core': 'Core',
  'Cardio': 'Cardio',
  'Calentamiento': 'Warmup'
};

function translateTags(tags) {
  if (!Array.isArray(tags)) return tags;
  return tags.map(tag => tagMap[tag] || tag);
}

// Convierte "press banca", "PRESS BANCA", "  Press Banca  " a "Press Banca"
function standardizeName(name) {
  if (!name || typeof name !== 'string') return name;
  return name
    .trim()
    .toLowerCase()
    .replace(/\b[a-záéíóúüñ]/g, char => char.toUpperCase());
}

let modifiedCount = 0;

// 1. Process Routines
const routinesPath = path.join(targetDir, 'routines.json');
if (fs.existsSync(routinesPath)) {
  console.log('🔄 Procesando rutinas...');
  const data = JSON.parse(fs.readFileSync(routinesPath, 'utf8'));
  let changed = false;

  if (Array.isArray(data)) {
    data.forEach(routine => {
      if (Array.isArray(routine.exercises)) {
        routine.exercises.forEach(ex => {
          const newName = standardizeName(ex.name);
          if (newName !== ex.name) {
            ex.name = newName;
            changed = true;
          }
          if (ex.tags) {
            const oldTags = JSON.stringify(ex.tags);
            ex.tags = translateTags(ex.tags);
            if (JSON.stringify(ex.tags) !== oldTags) changed = true;
          }
        });
      }
    });
  }

  if (changed) {
    fs.writeFileSync(routinesPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ routines.json actualizado.');
    modifiedCount++;
  } else {
    console.log('⚡ routines.json ya estaba limpio.');
  }
} else {
  console.log('⚠️ No se encontró routines.json en la ruta.');
}

// 2. Process Logs
const logsDir = path.join(targetDir, 'logs');
if (fs.existsSync(logsDir)) {
  console.log('🔄 Procesando historiales...');
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed = false;

    if (data && Array.isArray(data.logs)) {
      data.logs.forEach(session => {
        if (Array.isArray(session.exercises)) {
          session.exercises.forEach(ex => {
            const newName = standardizeName(ex.name);
            if (newName !== ex.name) {
              ex.name = newName;
              changed = true;
            }
            if (ex.tags) {
              const oldTags = JSON.stringify(ex.tags);
              ex.tags = translateTags(ex.tags);
              if (JSON.stringify(ex.tags) !== oldTags) changed = true;
            }
          });
        }
      });
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ ${file} actualizado.`);
      modifiedCount++;
    }
  });
} else {
  console.log('⚠️ No se encontró la carpeta "logs" en la ruta.');
}

console.log(`\n🎉 Proceso completado. Archivos modificados: ${modifiedCount}`);
