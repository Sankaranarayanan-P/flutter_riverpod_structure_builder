"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newScreen = void 0;
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
async function newScreen(uri: { fsPath: any; }) {
  const prompt = await vscode.window.showInputBox({
    prompt: "Enter Screen Name",
  });
  if (!prompt) { return; }
  const screenName = prompt.toLowerCase();
  let targetPath = uri.fsPath;
  const screenNameSnakeCase = (0, utils_1.toSnakeCase)(screenName);
  const screenNamePascalCase = (0, utils_1.toPascalCase)(screenName);
  const screenPath = path.join(targetPath, screenNameSnakeCase);
  // Create directories based on the module structure
  fs.mkdirSync(`${screenPath}`, { recursive: true });
  // Create empty files based on the module structure
  fs.writeFileSync(`${screenPath}/${screenNameSnakeCase}.dart`, `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

export '${screenNameSnakeCase}_mobile.dart';
export '${screenNameSnakeCase}_web.dart';

class ${screenNamePascalCase}Screen extends ConsumerWidget {
  const ${screenNamePascalCase}Screen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Scaffold(
      body: ResponsiveWidget(
        smallScreen: ${screenNamePascalCase}ScreenMobile(),
        largeScreen: ${screenNamePascalCase}ScreenWeb(),
      ),
    );
  }
}
`);
  fs.writeFileSync(`${screenPath}/${screenNameSnakeCase}_web.dart`, `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ${screenNamePascalCase}ScreenWeb extends ConsumerStatefulWidget {
  const ${screenNamePascalCase}ScreenWeb({super.key});

  @override
  ConsumerState<${screenNamePascalCase}ScreenWeb> createState() =>
      _${screenNamePascalCase}ScreenWebState();
}

class _${screenNamePascalCase}ScreenWebState extends ConsumerState<${screenNamePascalCase}ScreenWeb> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold();
  }
}
`);
  fs.writeFileSync(`${screenPath}/${screenNameSnakeCase}_mobile.dart`, `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ${screenNamePascalCase}ScreenMobile extends ConsumerStatefulWidget {
  const ${screenNamePascalCase}ScreenMobile({super.key});

  @override
  ConsumerState<${screenNamePascalCase}ScreenMobile> createState() =>
      _${screenNamePascalCase}ScreenMobileState();
}

class _${screenNamePascalCase}ScreenMobileState extends ConsumerState<${screenNamePascalCase}ScreenMobile> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold();
  }
}
`);
  // Read the contents of the directory
  fs.readdir(targetPath, (_: any, files: any[]) => {
    // Filter files to only include those ending with "_model"
    const modelFiles = files.filter((file: string) => file.endsWith("_presentation.dart"));
    // Append text to each model file
    modelFiles.forEach((modelFile: any) => {
      const filePath = path.join(targetPath, modelFile);
      // Append text to the file
      fs.appendFileSync(filePath, `export '${screenNameSnakeCase}/${screenNameSnakeCase}.dart';\n`);
    });
  });
  vscode.window.showInformationMessage(`Screen ${screenName} created successfully!`);
  (0, child_process_1.exec)("dart run build_runner build --delete-conflicting-outputs", (error: any, stdout: any, stderr: any) => {
    if (error) {
      vscode.window.showErrorMessage(`Error executing build_runner: ${error}`);
      return;
    }
    if (stdout) { console.log(`stdout: ${stdout}`); }
    if (stderr) { console.log(`stderr: ${stderr}`); }
  });
}

export default newScreen;
