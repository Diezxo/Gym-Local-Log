const fs = require('fs');
const path = require('path');

const files = [
  'src/app/components/dashboard/dashboard.component.ts',
  'src/app/components/data/data-management.component.ts',
  'src/app/components/settings/settings.component.ts',
  'src/app/components/templates/template-editor.component.ts',
  'src/app/components/templates/template-list.component.ts',
  'src/app/components/workout/workout.component.ts',
  'src/app/components/workout/exercise-strength.component.ts',
  'src/app/components/workout/exercise-cardio.component.ts',
  'src/app/components/workout/rest-timer.component.ts',
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has OnPush
  if (content.includes('ChangeDetectionStrategy.OnPush')) continue;

  // Add ChangeDetectionStrategy to @angular/core import
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]@angular\/core['"];/,
    (match, p1) => {
      if (!p1.includes('ChangeDetectionStrategy')) {
        return `import { ${p1.trim()}, ChangeDetectionStrategy } from '@angular/core';`;
      }
      return match;
    }
  );

  // Add changeDetection to @Component
  content = content.replace(
    /@Component\({([\s\S]*?)}\)/,
    (match, inner) => {
      if (!inner.includes('changeDetection:')) {
        // Find the place after standalone or selector to insert it
        return `@Component({${inner},\n  changeDetection: ChangeDetectionStrategy.OnPush\n})`;
      }
      return match;
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
