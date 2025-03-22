#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function isNestJSInstalled() {
  try {
    require.resolve("@nestjs/core", { paths: [process.cwd()] });
    return true;
  } catch (error) {
    return false;
  }
}

function generateHexagonalModule(moduleName) {
  const basePath = path.join(process.cwd(), "src", "modules", moduleName);

  const structure = {
    application: {
      services: {
        commands: [
          `${moduleName}-create.service.ts`,
          `${moduleName}-delete.service.ts`,
          `${moduleName}-update.service.ts`,
        ],
        queries: [`${moduleName}-find.service.ts`],
      },
      "use-cases": {
        commands: [
          `${moduleName}-create.use-case.ts`,
          `${moduleName}-delete.use-case.ts`,
          `${moduleName}-update.use-case.ts`,
        ],
        queries: [`${moduleName}-find.use-case.ts`],
      },
    },
    config: [`${moduleName}.config.ts`, `${moduleName}.module.ts`],
    domain: {
      dtos: [`${moduleName}-create.dto.ts`, `${moduleName}-update.dto.ts`],
      entities: [`${moduleName}.entity.ts`],
      interfaces: [
        `${moduleName}-create.interface.ts`,
        `${moduleName}-update.interface.ts`,
      ],
      requests: [
        `${moduleName}-find-all.request.ts`,
        `${moduleName}-find-one.request.ts`,
        `${moduleName}-create.request.ts`,
        `${moduleName}-update.request.ts`,
        `${moduleName}-delete.request.ts`,
      ],
    },
    infrastructure: {
      adapters: {
        implements: [`${moduleName}-repository.impl.ts`],
        ports: [`${moduleName}-repository.port.ts`],
      },
      controllers: [`${moduleName}.controller.ts`],
      middlewares: [],
    },
  };

  const createStructure = (baseDir, struct) => {
    Object.keys(struct).forEach((key) => {
      const currentPath = path.join(baseDir, key);
      if (Array.isArray(struct[key])) {
        fs.mkdirSync(currentPath, { recursive: true });
        struct[key].forEach((file) => {
          const filePath = path.join(currentPath, file);
          if (!fs.existsSync(filePath)) {
            let content = `// ${file}`;
            if (file.endsWith(".service.ts") || file.endsWith(".use-case.ts")) {
              const className = file
                .replace(/(-\w)/g, (match) => match[1].toUpperCase())
                .replace(".service.ts", "Service")
                .replace(".use-case.ts", "UseCase");
              const classNameCapitalized =
                className.charAt(0).toUpperCase() + className.slice(1);
              content = `export class ${classNameCapitalized} {}`;
            }
            fs.writeFileSync(filePath, content, "utf8");
          }
        });
      } else if (typeof struct[key] === "object") {
        fs.mkdirSync(currentPath, { recursive: true });
        createStructure(currentPath, struct[key]);
      }
    });
  };

  fs.mkdirSync(basePath, { recursive: true });

  createStructure(basePath, structure);

  console.log(
    chalk.green(`✔ Módulo ${chalk.bold(moduleName)} generado exitosamente en:`)
  );
  console.log(chalk.blue(basePath));
}

program
  .argument("<module-name>", "Nombre del módulo a generar")
  .action((moduleName) => {
    const basePath = path.join(process.cwd(), "src", "modules", moduleName);

    if (fs.existsSync(basePath)) {
      console.error(
        chalk.red(`✖ Error: Ya existe un módulo con el nombre "${moduleName}".`)
      );
      console.log(
        chalk.yellow("ℹ Elige otro nombre o elimina el módulo existente.")
      );
      process.exit(1);
    }

    if (!isNestJSInstalled()) {
      console.error(
        chalk.red("✖ Error: NestJS no está instalado en este proyecto.")
      );
      console.log(
        chalk.yellow("ℹ Instala NestJS con: npm install @nestjs/core @nestjs/common")
      );
      process.exit(1);
    }

    generateHexagonalModule(moduleName);
  });

program.parse(process.argv);