import { exec } from "child_process";
import { mkdirSync, writeFileSync, readdir, appendFileSync } from "fs";
import { join } from "path";
import { window } from "vscode";
import { toSnakeCase, toPascalCase } from "../utils";

async function newModel(uri: { fsPath: any; }) {
    const prompt = await window.showInputBox({
        prompt: "Enter Model Name",
    });
    if (!prompt) { return; }
    const modelName = prompt.toLowerCase();
    let targetPath = uri.fsPath;
    const modelNameSnakeCase = toSnakeCase(modelName);
    const modelNamePascalCase = toPascalCase(modelName);
    const modelPath = join(targetPath, modelNameSnakeCase);
    // Create directories based on the module structure
    mkdirSync(`${modelPath}`, { recursive: true });
    // Create empty files based on the module structure
    writeFileSync(`${modelPath}/${modelNameSnakeCase}_model.dart`, `import 'package:freezed_annotation/freezed_annotation.dart';

part '${modelNameSnakeCase}_model.freezed.dart';
part '${modelNameSnakeCase}_model.g.dart';

@freezed
class ${modelNamePascalCase} with _$${modelNamePascalCase} {
  const factory ${modelNamePascalCase}({
    @JsonKey(name: 'id', includeIfNull: false) int? id,
  }) = _${modelNamePascalCase};

  factory ${modelNamePascalCase}.fromJson(Map<String, dynamic> json) =>
      _$${modelNamePascalCase}FromJson(json);
}
`);
    // Read the contents of the directory
    readdir(targetPath, (_, files) => {
        // Filter files to only include those ending with "_model"
        const modelFiles = files.filter((file) => file.endsWith("_models.dart"));
        // Append text to each model file
        modelFiles.forEach((modelFile) => {
            const filePath = join(targetPath, modelFile);
            // Append text to the file
            appendFileSync(filePath, `export '${modelNameSnakeCase}/${modelNameSnakeCase}_model.dart';\n`);
        });
    });
    window.showInformationMessage(`Model ${modelName} created successfully!`);
    exec("dart run build_runner build --delete-conflicting-outputs", (error, stdout, stderr) => {
        if (error) {
            window.showErrorMessage(`Error executing build_runner: ${error}`);
            return;
        }
        if (stdout) { console.log(`stdout: ${stdout}`); }
        if (stderr) { console.log(`stderr: ${stderr}`); }
    });
}

export default newModel;
