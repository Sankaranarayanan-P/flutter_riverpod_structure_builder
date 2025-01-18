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

/**
 * Creates a new repository structure with domain and infrastructure layers
 * @param uri The file system path where the repository will be created
 */
async function newRepository(uri: { fsPath: any }) {
  // Get repository name from user input
  const repositoryNameInput = await window.showInputBox({
    prompt: "Enter Repository Name",
  });
  if (!repositoryNameInput) {
    return;
  }

  const repositoryName = repositoryNameInput.toLowerCase();
  const repositorySnakeCase = toSnakeCase(repositoryName);
  const repositoryPascalCase = toPascalCase(repositoryName);
  const repositoryCamelCase =
    repositoryPascalCase.charAt(0).toLowerCase() +
    repositoryPascalCase.slice(1);

  // Path to the features directory
  const featuresDirectoryPath = uri.fsPath;

  // Validate features directory exists
  if (
    !statSync(featuresDirectoryPath, { throwIfNoEntry: false })?.isDirectory()
  ) {
    window.showErrorMessage("'features' directory not found in the workspace.");
    return;
  }

  // Get user selection for feature folder
  const selectedFeatureFolder = await window.showQuickPick(
    await getSubfolders(featuresDirectoryPath),
    { placeHolder: "Select the feature folder" }
  );

  if (!selectedFeatureFolder) {
    return;
  }

  const featurePath = join(featuresDirectoryPath, selectedFeatureFolder);

  // Create Domain Layer
  const domainLayerPath = join(featurePath, "domain");
  const repositoryImplementationPath = join(
    domainLayerPath,
    repositorySnakeCase
  );
  mkdirSync(`${repositoryImplementationPath}`, { recursive: true });

  // Get project root folder for import paths
  const projectRootPath = workspace.workspaceFolders?.[0].uri.fsPath;
  if (!projectRootPath) {
    window.showErrorMessage("Workspace folder not found.");
    return;
  }
  const projectName = basename(projectRootPath);

  const repositoryImportPath = `import 'package:${projectName}/features/${selectedFeatureFolder}/infrastructure/${repositorySnakeCase}/i_${repositorySnakeCase}_repository.dart';`;

  // Create repository implementation file
  writeFileSync(
    `${repositoryImplementationPath}/${repositorySnakeCase}_repository.dart`,
    `import 'package:riverpod_annotation/riverpod_annotation.dart';
${repositoryImportPath}

@Riverpod(keepAlive: true)
I${repositoryPascalCase}Repository ${repositoryCamelCase}Repo(${repositoryPascalCase}RepoRef ref) =>
    ${repositoryPascalCase}Repository();

class ${repositoryPascalCase}Repository implements I${repositoryPascalCase}Repository {
  ${repositoryPascalCase}Repository();
}
`
  );

  // Process domain layer files
  processRepositoryFiles(domainLayerPath, "domain", selectedFeatureFolder);

  // Create Infrastructure Layer
  const infrastructureLayerPath = join(featurePath, "infrastructure");
  const repositoryInterfacePath = join(
    infrastructureLayerPath,
    repositorySnakeCase
  );
  mkdirSync(`${repositoryInterfacePath}`, { recursive: true });
  writeFileSync(
    `${repositoryInterfacePath}/i_${repositorySnakeCase}_repository.dart`,
    `abstract class I${repositoryPascalCase}Repository {}`
  );

  processRepositoryFiles(
    infrastructureLayerPath,
    "infrastructure",
    selectedFeatureFolder
  );

  window.showInformationMessage(
    `Repository ${repositoryName} created successfully!`
  );

  // Generate Riverpod code using build_runner
  exec(
    "dart run build_runner build --delete-conflicting-outputs",
    (error, stdout, stderr) => {
      if (error) {
        window.showErrorMessage(`Error executing build_runner: ${error}`);
        return;
      }
      if (stdout) {
        console.log(`build_runner output: ${stdout}`);
      }
      if (stderr) {
        console.log(`build_runner errors: ${stderr}`);
      }
    }
  );
}

/**
 * Gets all subdirectories within the specified folder path
 * @param folderPath Path to the parent folder
 * @returns Promise containing array of subdirectory names
 */
function getSubfolders(folderPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const subfolders = files.filter((file) => {
          const fullPath = join(folderPath, file);
          return statSync(fullPath).isDirectory();
        });
        resolve(subfolders);
      }
    });
  });
}

/**
 * Processes repository files and updates layer exports
 * @param layerPath Path to the layer directory (domain or infrastructure)
 * @param layerName Name of the layer for file naming
 * @param featureFolder Name of the feature folder
 */
function processRepositoryFiles(
  layerPath: string,
  layerName: string,
  featureFolder: string
) {
  const subfolders = readdirSync(layerPath).filter((file) => {
    const fullPath = join(layerPath, file);
    return statSync(fullPath).isDirectory();
  });

  subfolders.forEach((subfolder) => {
    const subfolderPath = join(layerPath, subfolder);

    readdir(subfolderPath, (_: any, files: any[]) => {
      const repositoryFiles = files.filter((file) =>
        file.endsWith("_repository.dart")
      );

      repositoryFiles.forEach((repositoryFile) => {
        const layerFilePath = join(
          layerPath,
          `${featureFolder}_${layerName}.dart`
        );

        const existingContent = readFileSync(layerFilePath, "utf8");
        const exportStatement = `export '${subfolder}/${repositoryFile}';\n`;

        if (!existingContent.includes(exportStatement)) {
          appendFileSync(layerFilePath, exportStatement);
        }
      });
    });
  });
}

export default newRepository;
