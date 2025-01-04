import { exec } from "child_process";
import {
  mkdirSync,
  writeFileSync,
  readdir,
  appendFileSync,
  readdirSync,
  readFileSync,
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

  // Function to get all subfolders inside a given folder
  function getSubfolders(folderPath: any) {
    const files = readdirSync(folderPath);
    const subfolders = files.filter((file: any) => {
      const fullPath = join(folderPath, file);
      return statSync(fullPath).isDirectory();
    });
    return subfolders;
  }

  // Function to read and process the files in the subfolders
  function processRepositoryFiles(layerPath: string, layerName: string) {
    // Get all subfolders inside the domainLayerPath
    const subfolders = getSubfolders(layerPath);

    subfolders.forEach((subfolder: any) => {
      const subfolderPath = join(layerPath, subfolder);
      // Read files inside the subfolder
      readdir(subfolderPath, (_: any, files: any[]) => {
        const repoFiles = files.filter((file: string) =>
          file.endsWith("_repository.dart")
        );

        repoFiles.forEach((repoFile: any) => {
          const filePath = join(
            layerPath,
            `${selectedModule}_${layerName}.dart`
          );

          // Read the file content to check if the export statement already exists
          const fileContent = readFileSync(filePath, "utf8");

          // Check if the export statement already exists
          const exportStatement = `export '${subfolder}/${repoFile}';\n`;
          if (!fileContent.includes(exportStatement)) {
            // Append export statement to each repository file if not already present
            appendFileSync(filePath, exportStatement);
          }
        });
      });
    });
  }

  // Call the function to process the files
  processRepositoryFiles(domainLayerPath, "domain");

  // Infrastructure Layer Creation
  const infrastructureLayerPath = join(targetPath, "infrastructure");
  const repoInterfacesPath = join(infrastructureLayerPath, repoNameSnakeCase);
  mkdirSync(`${repoInterfacesPath}`, { recursive: true });
  writeFileSync(
    `${repoInterfacesPath}/i_${repoNameSnakeCase}_repository.dart`,
    `abstract class I${repoNamePascalCase}Repository {}\n`
  );

  processRepositoryFiles(infrastructureLayerPath, "infrastructure");

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
