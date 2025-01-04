export function toSnakeCase(str: string): string {
    return str
        .split(" ")
        .map((word) => word.toLowerCase())
        .join("_");
}

export function toPascalCase(str: string): string {
    return str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function toSnakeCaseFrom(str: string): string {
    return str
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2")
        .toLowerCase();
}
