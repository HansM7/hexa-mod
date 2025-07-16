#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { updateAppModule } from "./functions.js";

const require = createRequire(import.meta.url);

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

function generateClassContent(fileName, filePath) {
  if (fileName.endsWith(".module.ts")) {
    const moduleName = fileName
      .replace(".module.ts", "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class ${moduleName}Module {}`;
  }

  if (fileName.endsWith(".port.ts")) {
    const portName = fileName
      .replace(".port.ts", "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
      .replace("Port", "");
    return `export abstract class ${portName}Port {}`;
  }

  if (fileName.endsWith(".interface.ts")) {
    const interfaceName = fileName
      .replace(".interface.ts", "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
      .replace("Interface", "");
    return `export interface I${interfaceName} {}`;
  }

  if (fileName.endsWith(".controller.ts")) {
    const controllerName = fileName
      .replace(".controller.ts", "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `import { Controller } from '@nestjs/common';

@Controller()
export class ${controllerName}Controller {}`;
  }

  if (
    fileName.endsWith(".dto.ts") ||
    fileName.endsWith(".entity.ts") ||
    fileName.endsWith(".factory.ts") ||
    fileName.endsWith(".request.ts") ||
    fileName.endsWith(".response.ts") ||
    fileName.endsWith(".config.ts")
  ) {
    const type = fileName.split(".").slice(-2)[0];
    const className =
      fileName
        .replace(`.${type}.ts`, "")
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("") +
      type.charAt(0).toUpperCase() +
      type.slice(1);
    return `export class ${className} {}`;
  }

  if (
    fileName.endsWith(".service.ts") ||
    fileName.endsWith(".use-case.ts") ||
    fileName.endsWith(".impl.ts")
  ) {
    let baseName = fileName;
    let suffix = "";

    if (fileName.endsWith(".service.ts")) {
      baseName = fileName.replace(".service.ts", "");
      suffix = "Service";
    } else if (fileName.endsWith(".use-case.ts")) {
      baseName = fileName.replace(".use-case.ts", "");
      suffix = "UseCase";
    } else if (fileName.endsWith(".impl.ts")) {
      baseName = fileName.replace(".impl.ts", "");
      suffix = "Impl";
    }

    const className =
      baseName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("") + suffix;

    return `import { Injectable } from '@nestjs/common';
  
@Injectable()
export class ${className} {}`;
  }

  return `export class ${fileName.replace(".ts", "")} {}`;
}

function generateHexagonalModule(moduleName) {
  const basePath = path.join(process.cwd(), "src", "modules", moduleName);

  const structure = {
    application: {
      dtos: [
        `${moduleName}-create-request.dto.ts`,
        `${moduleName}-create-response.dto.ts`,
        `${moduleName}-update-request.dto.ts`,
        `${moduleName}-update-response.dto.ts`,
      ],
      "use-cases": {
        commands: [
          `${moduleName}-create.use-case.ts`,
          `${moduleName}-delete.use-case.ts`,
          `${moduleName}-update.use-case.ts`,
        ],
        queries: [
          `${moduleName}-find-one.use-case.ts`,
          `${moduleName}-find-all.use-case.ts`,
        ],
      },
    },
    config: [`${moduleName}.config.ts`, `${moduleName}.module.ts`],
    domain: {
      entities: [`${moduleName}.entity.ts`],
      factories: [`${moduleName}.factory.ts`],
      interfaces: [
        `${moduleName}-create.interface.ts`,
        `${moduleName}-update.interface.ts`,
      ],
      services: {
        commands: [
          `${moduleName}-create.service.ts`,
          `${moduleName}-delete.service.ts`,
          `${moduleName}-update.service.ts`,
        ],
        queries: [
          `${moduleName}-find-one.service.ts`,
          `${moduleName}-find-all.service.ts`,
        ],
      },
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
            const content = generateClassContent(file, filePath);
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
        chalk.yellow(
          "ℹ Instala NestJS con: npm install @nestjs/core @nestjs/common"
        )
      );
      process.exit(1);
    }

    generateHexagonalModule(moduleName);
    updateAppModule(moduleName);
  });

program.parse(process.argv);
