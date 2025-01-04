import { exec } from "child_process";
import { mkdirSync, writeFileSync, readdir, appendFileSync } from "fs";
import { join } from "path";
import { window } from "vscode";
import { toSnakeCase } from "../utils";

async function newModule(uri: { fsPath: any; }) {
    const prompt = await window.showInputBox({
        prompt: "Enter Module Name",
    });
    if (!prompt) { return; }
    const moduleName = prompt.toLowerCase();
    let targetPath = uri.fsPath;
    const moduleNameSnakeCase = toSnakeCase(moduleName);
    const modulePath = join(targetPath, moduleNameSnakeCase);
    // Create directories based on the module structure
    mkdirSync(`${modulePath}`, { recursive: true });
    mkdirSync(`${modulePath}/controller`, { recursive: true });
    mkdirSync(`${modulePath}/domain/models`, { recursive: true });
    mkdirSync(`${modulePath}/domain/repositories/implementations`, {
        recursive: true,
    });
    mkdirSync(`${modulePath}/domain/repositories/interfaces`, {
        recursive: true,
    });
    mkdirSync(`${modulePath}/presentation`, { recursive: true });
    // Create empty files based on the module structure
    writeFileSync(`${modulePath}/controller/${moduleNameSnakeCase}_controller.dart`, "");
    writeFileSync(`${modulePath}/domain/models/${moduleNameSnakeCase}_models.dart`, "");
    writeFileSync(`${modulePath}/domain/repositories/implementations/${moduleNameSnakeCase}_implementations.dart`, "");
    writeFileSync(`${modulePath}/domain/repositories/interfaces/${moduleNameSnakeCase}_interfaces.dart`, "");
    writeFileSync(`${modulePath}/domain/repositories/${moduleNameSnakeCase}_repositories.dart`, `export 'implementations/${moduleNameSnakeCase}_implementations.dart';
export 'interfaces/${moduleNameSnakeCase}_interfaces.dart';
`);
    writeFileSync(`${modulePath}/domain/${moduleNameSnakeCase}_domain.dart`, `export 'models/${moduleNameSnakeCase}_models.dart';
export 'repositories/${moduleNameSnakeCase}_repositories.dart';
`);
    writeFileSync(`${modulePath}/presentation/${moduleNameSnakeCase}_presentation.dart`, "");
    writeFileSync(`${modulePath}/${moduleNameSnakeCase}.dart`, `export 'controller/${moduleNameSnakeCase}_controller.dart';
export 'domain/${moduleNameSnakeCase}_domain.dart';
export 'presentation/${moduleNameSnakeCase}_presentation.dart';
`);
    window.showInformationMessage(`Module ${moduleName} created successfully!`);
}


export default newModule;