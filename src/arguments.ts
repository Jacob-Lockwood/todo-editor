import { InvalidArgumentError, program } from "commander"
import { resolve } from "node:path"
import { cwd } from "node:process"
import { readTodoFile } from "./utils"

async function relativeToAbsolutePath(filePath: string): Promise<string> {
  const absolutePath = resolve(cwd(), filePath)
  try {
    await readTodoFile(absolutePath)
    return absolutePath
  } catch (err) {
    throw new InvalidArgumentError(
      err instanceof Error && err.message.startsWith("ENOENT")
        ? `File ${absolutePath} does not exist`
        : `File ${absolutePath} is not a valid todo file`,
    )
  }
}
export interface Args {
  TODO_PATH: string
  TODO_PATH_RELATIVE: string
}
export default async function parseArgs(): Promise<Args> {
  program
    .name("todo-editor")
    .description("A simple viewer and editor for your todo.txt files")
    .version("0.1.0")
  program.argument(
    "[todo-file]",
    "todo file to use",
    relativeToAbsolutePath,
    Promise.resolve<string>("./todo.txt"),
  ).parse()
  const TODO_PATH: string = await program.processedArgs[0]
  const TODO_PATH_RELATIVE: string = program.args[0] || "todo.txt"
  return { TODO_PATH, TODO_PATH_RELATIVE }
}
