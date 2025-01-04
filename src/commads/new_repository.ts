import { exec } from "child_process";
import {
  mkdirSync,
  writeFileSync,
  readdir,
  appendFileSync,
  statSync,
} from "fs";
import { join, basename } from "path";
import { window, workspace } from "vscode";
import { toSnakeCase, toPascalCase } from "../utils";

async function newRepository(uri: { fsPath: any }) {
  // Prompt the user for the repository name
  const prompt = await window.showInputBox({
    prompt: "Enter Repository Name",
  });
  if (!prompt) {
    return;
  }

  const repoName = prompt.toLowerCase();
  const repoNameSnakeCase = toSnakeCase(repoName);
  const repoNamePascalCase = toPascalCase(repoName);
  const repoNameCamelCase =
    repoNamePascalCase.charAt(0).toLowerCase() +
    toPascalCase(repoName).slice(1);

  // Ask the user to select the module folder inside the 'lib' directory
  const selectedModule = await window.showQuickPick(
    await getLibModuleFolders(uri.fsPath),
    { placeHolder: "Select the module folder" }
  );

  if (!selectedModule) {
    return;
  }

  const targetPath = join(uri.fsPath, selectedModule); // Path to the selected module folder

  // Domain Layer Creation
  const domainLayerPath = join(targetPath, "domain");
  const repoImplementationPath = join(domainLayerPath, repoNameSnakeCase);
  mkdirSync(`${repoImplementationPath}`, { recursive: true });
  // Get the root folder dynamically
  const workspaceFolder = workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder) {
    window.showErrorMessage("Workspace folder not found.");
    return;
  }
  const rootFolderName = basename(workspaceFolder); // Extracts 'flutter_demo_app' from the full path

  const importPath = `import 'package:${rootFolderName}/${selectedModule}/infrastructure/${repoNameSnakeCase}/i_${repoNameSnakeCase}_repository.dart';`;

  // Create the repository file with the import statement
  writeFileSync(
    `${repoImplementationPath}/${repoNameSnakeCase}_repository.dart`,
    `import 'package:riverpod_annotation/riverpod_annotation.dart';
${importPath}

@Riverpod(keepAlive: true)
I${repoNamePascalCase}Repository ${repoNameCamelCase}Repo(${repoNamePascalCase}RepoRef ref) =>
    ${repoNamePascalCase}Repository();

class ${repoNamePascalCase}Repository implements I${repoNamePascalCase}Repository {
  ${repoNamePascalCase}Repository();
}
`
  );

  // Read the contents of the domain folder and append to relevant files
  readdir(domainLayerPath, (_, files) => {
    const repoFiles = files.filter((file) =>
      file.endsWith("_implementations.dart")
    );
    repoFiles.forEach((repoFile) => {
      const filePath = join(domainLayerPath, repoFile);
      appendFileSync(
        filePath,
        `export '${repoNameSnakeCase}/${repoNameSnakeCase}_repository.dart';\n`
      );
    });
  });

  // Infrastructure Layer Creation
  const infrastructurePath = join(targetPath, "infrastructure");
  const repoInterfacesPath = join(infrastructurePath, repoNameSnakeCase);
  mkdirSync(`${repoInterfacesPath}`, { recursive: true });
  writeFileSync(
    `${repoInterfacesPath}/i_${repoNameSnakeCase}_repository.dart`,
    `abstract class I${repoNamePascalCase}Repository {}\n`
  );

  // Read the contents of the infrastructure folder and append to relevant files
  readdir(infrastructurePath, (_, files) => {
    const repoFiles = files.filter((file) => file.endsWith("_interfaces.dart"));
    repoFiles.forEach((repoFile) => {
      const filePath = join(infrastructurePath, repoFile);
      appendFileSync(
        filePath,
        `export '${repoNameSnakeCase}/i_${repoNameSnakeCase}_repository.dart';\n`
      );
    });
  });

  window.showInformationMessage(`Repository ${repoName} created successfully!`);

  // Execute the build_runner command
  exec(
    "dart run build_runner build --delete-conflicting-outputs",
    (error, stdout, stderr) => {
      if (error) {
        window.showErrorMessage(`Error executing build_runner: ${error}`);
        return;
      }
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
    }
  );
}

// Helper function to retrieve module folders inside 'lib'
async function getLibModuleFolders(libPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(libPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        // Filter out directories (modules)
        const moduleFolders = files.filter((file) => {
          const fullPath = join(libPath, file);
          return !file.startsWith(".") && statSync(fullPath).isDirectory();
        });
        resolve(moduleFolders);
      }
    });
  });
}

export default newRepository;
