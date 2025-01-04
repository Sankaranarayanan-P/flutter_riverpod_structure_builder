import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("Extension should be present", () => {
    assert.ok(
      vscode.extensions.getExtension(
        "CodingGene.flutter-riverpod-structure-builder"
      )
    );
  });

  test("should activate the extension", async () => {
    const extension = vscode.extensions.getExtension(
      "CodingGene.flutter-riverpod-structure-builder"
    );
    if (extension) {
      await extension.activate();
      assert.strictEqual(extension.isActive, true);
    } else {
      assert.fail("Extension not found");
    }
  });

  test("should register all commands", async () => {
    const commands = await vscode.commands.getCommands(true);
    const expectedCommands = [
      "flutter-riverpod-structure-builder.newController",
      "flutter-riverpod-structure-builder.newModule",
      "flutter-riverpod-structure-builder.newModel",
      "flutter-riverpod-structure-builder.newRepository",
      "flutter-riverpod-structure-builder.newScreen",
    ];

    expectedCommands.forEach((command) => {
      assert.ok(
        commands.includes(command),
        `Command ${command} is not registered`
      );
    });
  });
});
