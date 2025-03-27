import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

export function updateAppModule(moduleName) {
  const appModulePath = path.join(process.cwd(), "src", "app.module.ts");

  if (!fs.existsSync(appModulePath)) {
    console.log(
      chalk.yellow(
        "⚠ No se encontró app.module.ts, omitiendo actualización de imports"
      )
    );
    return;
  }

  try {
    const moduleClassName = `${moduleName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}Module`;

    let content = fs.readFileSync(appModulePath, "utf8");

    const importStatement = `import { ${moduleClassName} } from './modules/${moduleName}/config/${moduleName}.module';\n`;

    if (!content.includes(importStatement.trim())) {
      const importRegex = /import\s+.+?\s+from\s+['"].+?['"];?\n/g;
      const lastImportMatch = [...content.matchAll(importRegex)].pop();

      if (lastImportMatch) {
        const insertPosition =
          lastImportMatch.index + lastImportMatch[0].length;
        content =
          content.slice(0, insertPosition) +
          importStatement +
          content.slice(insertPosition);
      } else {
        const firstCodeLine = content.search(/[^\s\n]/);
        content =
          content.slice(0, firstCodeLine) +
          importStatement +
          content.slice(firstCodeLine);
      }
    }

    const moduleRegex = /@Module\(\s*{([^}]*)}/;
    const match = content.match(moduleRegex);

    if (!match) {
      console.log(
        chalk.yellow(
          "⚠ No se pudo encontrar la sección @Module en app.module.ts"
        )
      );
      return;
    }

    const moduleBody = match[1];

    if (
      new RegExp(`imports:\\s*\\[([^\\]]*${moduleClassName}[^\\]]*)`, "m").test(
        moduleBody
      )
    ) {
      console.log(
        chalk.blue(`ℹ ${moduleClassName} ya está en los imports de AppModule`)
      );
      return;
    }

    if (moduleBody.includes("imports: []")) {
      content = content.replace("imports: []", `imports: [${moduleClassName}]`);
    } else if (moduleBody.includes("imports: [")) {
      content = content.replace(
        /(imports:\s*\[)([^\]]*)/,
        `$1${moduleClassName}, $2`
      );
    } else {
      content = content.replace(
        "@Module({",
        `@Module({\n  imports: [${moduleClassName}],`
      );
    }

    fs.writeFileSync(appModulePath, content, "utf8");
    console.log(
      chalk.green(`✔ ${moduleClassName} agregado correctamente a AppModule`)
    );
  } catch (error) {
    console.error(
      chalk.red(`✖ Error al actualizar AppModule: ${error.message}`)
    );
  }
}
