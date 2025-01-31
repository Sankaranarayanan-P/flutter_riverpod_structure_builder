import { exec } from "child_process";
import { mkdirSync, writeFileSync, readdir, appendFileSync } from "fs";
import { join } from "path";
import { window } from "vscode";
import { toSnakeCase, toPascalCase } from "../utils";


async function newController(uri: { fsPath: any; }) {
    const prompt = await window.showInputBox({
        prompt: "Enter Controller Name",
    });
    if (!prompt) { return; }
    const controllerName = prompt.toLowerCase();
    let targetPath = uri.fsPath;
    const controllerNameSnakeCase = toSnakeCase(controllerName);
    const controllerNamePascalCase = toPascalCase(controllerName);
    const controllerPath = join(targetPath, controllerNameSnakeCase);
    // Create directories based on the module structure
    mkdirSync(`${controllerPath}`, { recursive: true });
    // Create empty files based on the module structure
    writeFileSync(`${controllerPath}/${controllerNameSnakeCase}_notifier.dart`, `import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part '${controllerNameSnakeCase}_notifier.freezed.dart';
part '${controllerNameSnakeCase}_notifier.g.dart';
part '${controllerNameSnakeCase}_state.dart';

@Riverpod(keepAlive: false)
class ${controllerNamePascalCase}Notifier extends _$${controllerNamePascalCase}Notifier {
    @override
  ${controllerNamePascalCase}State build() {
    return ${controllerNamePascalCase}State.initial();
  }
}
`);
    writeFileSync(`${controllerPath}/${controllerNameSnakeCase}_state.dart`, `part of '${controllerNameSnakeCase}_notifier.dart';

enum ${controllerNamePascalCase}Status {
    initial,
    loading,
    success,
    error,
}


extension ${controllerNamePascalCase}StatusExtension on ${controllerNamePascalCase}Status {
  R when<R>({
    required R Function() initial,
    required R Function() loading,
    required R Function() success,
    required R Function() error,
  }) {
    switch (this) {
      case ${controllerNamePascalCase}Status.initial:
        return initial();
      case ${controllerNamePascalCase}Status.loading:
        return loading();
      case ${controllerNamePascalCase}Status.success:
        return success();
      case ${controllerNamePascalCase}Status.error:
        return error();
    }
  }
}



@freezed
class ${controllerNamePascalCase}State with _$${controllerNamePascalCase}State {
    const factory ${controllerNamePascalCase}State({
    @Default(${controllerNamePascalCase}Status.initial) ${controllerNamePascalCase}Status status,
    }) = _${controllerNamePascalCase}State;

    factory ${controllerNamePascalCase}State.initial() => const ${controllerNamePascalCase}State();
}
`);
    console.log(targetPath);
    // Read the contents of the directory
    readdir(targetPath, (_, files) => {
        // Filter files to only include those ending with "_controller"
        const controllerFiles = files.filter((file) => file.endsWith("_controller.dart"));
        // Append text to each controller file
        controllerFiles.forEach((controllerFile) => {
            const filePath = join(targetPath, controllerFile);
            // Append text to the file
            appendFileSync(filePath, `export '${controllerNameSnakeCase}/${controllerNameSnakeCase}_notifier.dart';\n`);
        });
    });
    window.showInformationMessage(`Controller ${controllerName} created successfully!`);
    exec("dart run build_runner build --delete-conflicting-outputs", (error, stdout, stderr) => {
        if (error) {
            window.showErrorMessage(`Error executing build_runner: ${error}`);
            return;
        }
        if (stdout) { console.log(`stdout: ${stdout}`); }
        if (stderr) { console.log(`stderr: ${stderr}`); }
    });
}
export default newController;
