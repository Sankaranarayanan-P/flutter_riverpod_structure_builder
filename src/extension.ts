import * as vscode from "vscode";
import newController from "./commads/new_controller";
import newModule from "./commads/new_module";
import newModel from "./commads/new_model";
import newRepository from "./commads/new_repository";
import newScreen from "./commads/new_screen";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "flutter_riverpod_structure_builder" is now active!'
  );

  let features = [
    vscode.commands.registerCommand(
      "flutter-riverpod-structure-builder.newController",
      newController
    ),
    vscode.commands.registerCommand(
      "flutter-riverpod-structure-builder.newModule",
      newModule
    ),
    vscode.commands.registerCommand(
      "flutter-riverpod-structure-builder.newModel",
      newModel
    ),
    vscode.commands.registerCommand(
      "flutter-riverpod-structure-builder.newRepository",
      newRepository
    ),
    vscode.commands.registerCommand(
      "flutter-riverpod-structure-builder.newScreen",
      newScreen
    ),
  ];

  features.forEach((feature) => {
    context.subscriptions.push(feature);
  });
}

export function deactivate() {}
