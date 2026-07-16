const fs = require('fs');
const path = require('path');

const files = [
  'src/app/components/dashboard/dashboard.component.ts',
  'src/app/components/dashboard/progression-chart.component.ts',
  'src/app/components/data/data-management.component.ts',
  'src/app/components/settings/settings.component.ts',
  'src/app/components/templates/template-editor.component.ts',
  'src/app/components/templates/template-list.component.ts',
  'src/app/components/workout/workout.component.ts',
  'src/app/components/workout/exercise-strength.component.ts',
  'src/app/components/workout/exercise-cardio.component.ts',
  'src/app/components/workout/rest-timer.component.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Change huge borders to more standard rounded-2xl (16px) or rounded-xl (12px)
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[24px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[20px\]/g, 'rounded-xl');
  
  // Padding
  content = content.replace(/p-6/g, 'p-4');
  content = content.replace(/p-5/g, 'p-4');
  
  // Gaps
  content = content.replace(/gap-8/g, 'gap-6');
  content = content.replace(/gap-5/g, 'gap-4');
  
  // Inputs
  content = content.replace(/min-h-\[64px\]/g, 'min-h-[48px]');
  content = content.replace(/min-h-\[72px\]/g, 'min-h-[56px]');

  // Fonts
  content = content.replace(/text-5xl/g, 'text-4xl');
  
  // Remove UPPERCASE tracking from labels to match Hevy
  content = content.replace(/uppercase tracking-widest/g, '');
  content = content.replace(/uppercase tracking-wider/g, '');
  
  // Shadows (Safe replace)
  content = content.replace(/shadow-xl/g, '');
  content = content.replace(/shadow-lg/g, '');
  content = content.replace(/shadow-md/g, '');
  content = content.replace(/shadow-inner/g, '');
  content = content.replace(/shadow-\[[^\]]+\]/g, '');
  content = content.replace(/drop-shadow-\[[^\]]+\]/g, '');

  // Fix corrupted label in exercise-cardio
  if (file.includes('exercise-cardio.component.ts')) {
    content = content.replace(
      /Distancia \(\{\{ unidadDistancia\(\) \},\s*changeDetection: ChangeDetectionStrategy\.OnPush\s*\}\)/g,
      'Distancia ({{ unidadDistancia() }})'
    );
    // Re-add OnPush if missing
    if (!content.includes('changeDetection: ChangeDetectionStrategy.OnPush')) {
      content = content.replace(/styles: \[`(.*?)`\],\s*}\)/s, 'styles: [`$1`],\n  changeDetection: ChangeDetectionStrategy.OnPush\n})');
    }
  }

  // Dashboard specific fixes
  if (file.includes('dashboard.component.ts')) {
    // Hace hoy -> Hoy
    content = content.replace(/Hace \{\{ getDaysAgo\(lastLog\(\)!\.fecha\) \}\}/g, '{{ getDaysAgo(lastLog()!.fecha) }}');
    
    // getDaysAgo logic
    content = content.replace(
      /if \(diff <= 0\) return 'hoy';\s*if \(diff === 1\) return 'ayer';\s*return `\$\{diff\} días`;/g,
      "if (diff <= 0) return 'Hoy';\n    if (diff === 1) return 'Ayer';\n    return `Hace ${diff} días`;"
    );

    // Shrink text-[36px]
    content = content.replace(/text-\[36px\]/g, 'text-3xl');
    content = content.replace(/text-\[10px\]\s+text-\[var\(--color-text-muted\)\] text-center leading-tight font-bold/g, 'text-[10px] text-[var(--color-text-muted)] text-center leading-tight font-medium');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('UI refactor applied safely.');
