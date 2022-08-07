import { readFile, writeFile } from "node:fs/promises"
import { stdout } from "node:process"
import { cursorTo, moveCursor } from "node:readline"

export interface Todo {
  text: string
  done: boolean
}

export async function readTodoFile(filePath: string): Promise<Todo[]> {
  const fileContents: string = await readFile(filePath, "utf8")
  // RegExp's act weird with being reused so just return a new RegEx every time
  const todoRegEx = (): RegExp => /^ *\[(x)?\] (.+)$/g
  const lines: string[] = fileContents.split("\n").filter(line => line.trim() !== "")
  if (!lines.every(line => todoRegEx().test(line))) {
    console.log(lines.map(line => /^ *\[(x)?\] (.+)$/g.test(line)))
    throw new Error(`${filePath} is not a valid todo file`)
  }
  return lines.map<Todo>(str => {
    const [x, text] = todoRegEx().exec(str)?.slice(1) as [string | undefined, string]
    const done = typeof x === "string" && x.toLowerCase() === "x"
    return { done, text }
  })
}
export async function updateTodoFile(
  filePath: string,
  todoList: readonly Todo[],
): Promise<void> {
  await writeFile(
    filePath,
    todoList.map(todo => `${todo.done ? "[x]" : "[]"} ${todo.text}`).join("\n")
      + "\n",
    "utf8",
  )
}

/** Type of the second parameter to the callback provided to `stdout.on("keypress", callback)`. */
export interface Key {
  sequence: string
  name: string | undefined
  ctrl: boolean
  meta: boolean
  shift: boolean
}

/* Expose methods related to moving the cursor */
export const cursor = {
  to: (x: number, y: number) => new Promise<void>(res => cursorTo(stdout, x, y, res)),
  toRel: (dx: number, dy: number) =>
    new Promise<void>(res => moveCursor(stdout, dx, dy, res)),
  up: (n: number) => cursor.toRel(0, -n),
  down: (n: number) => cursor.toRel(0, n),
  left: (n: number) => cursor.toRel(-n, 0),
  right: (n: number) => cursor.toRel(n, 0),
}
