#!/usr/bin/env node

import chalk from "chalk"
import clear from "clear"
import EventIterator, { stream } from "event-iterator"
import { exit, stdin, stdout } from "node:process"
import { emitKeypressEvents } from "node:readline"
import parseArgs, { Args } from "./arguments"
import { cursor, readTodoFile, Todo, updateTodoFile } from "./utils"

// const DONE = "☑"
// const TODO = "☐"
const DONE = "[X]"
const TODO = "[ ]"
const args: Promise<Args> = parseArgs()

const writeLine = console.log
const write = (message: string) => stdout.write(message)

emitKeypressEvents(stdin)
stdin.setRawMode(true)

async function main({ TODO_PATH, TODO_PATH_RELATIVE }: Args): Promise<void> {
  const todoList: Todo[] = await readTodoFile(TODO_PATH)
  let selected: number = todoList.length - 1
  let mode: "EDIT" | "NAV" = "NAV"
  const updateCursor = (): Promise<void> => cursor.to(1, selected + 1)
  async function render() {
    clear()
    writeLine(`Displaying ${TODO_PATH_RELATIVE}`)
    for (const todo of todoList) {
      writeLine(`${chalk.green(todo.done ? DONE : TODO)} ${chalk.cyan(todo.text)}`)
    }
    if (mode === "EDIT") return
    writeLine()
    writeLine(
      chalk.gray(
        [
          "j - up",
          "k - down",
          "x - toggle",
          "n - new",
          "e - edit",
          "d - delete",
          "s - save",
          "c - save and close",
        ].join("    "),
      ),
    )
    await updateCursor()
  }
  render()

  async function save(): Promise<void> {
    cursor.to(0, todoList.length + 5)
    write("Saving...")
    await updateTodoFile(TODO_PATH, todoList)
    write("Done")
    render()
    await updateCursor()
  }
  await updateCursor()
  const iterator: EventIterator<Buffer> = stream.call(stdin)
  async function* getTodoInputs() {
    for await (const data of iterator) {
      if (mode !== "EDIT") continue
      const text = data.toString("utf8").trim()
      stdin.setRawMode(true)
      await new Promise<void>(resolve =>
        setTimeout(async () => {
          mode = "NAV"
          await updateCursor()
          resolve()
        }, 50)
      )
      yield text
    }
  }
  const todoInputs = getTodoInputs()
  async function* getKeyPresses() {
    for await (const data of iterator) {
      if (mode !== "NAV") continue
      const key = data.toString("utf8")
      yield key
    }
  }
  for await (const key of getKeyPresses()) {
    if (key === "j") {
      // up
      if (selected === 0) continue
      await cursor.up(1)
      selected--
    }
    if (key === "k") {
      // down
      if (selected === todoList.length - 1) continue
      await cursor.down(1)
      selected++
    }
    if (key === "x") {
      // toggle
      const todo = todoList[selected]
      todo.done = !todo.done
      render()
    }
    if (key === "e") {
      const todo = todoList[selected]
      todo.text = ""
      render()
      await cursor.to((todo.done ? DONE : TODO).length + 1, selected + 1)
      mode = "EDIT"
      stdin.setRawMode(false)
      todo.text = (await todoInputs.next()).value || ""
      render()
    }
    if (key === "n") {
      // new todo
      todoList.unshift({ done: false, text: "" })
      const todo = todoList[selected = 0]
      render()
      await cursor.to(TODO.length + 1, selected + 1)
      mode = "EDIT"
      stdin.setRawMode(false)
      todo.text = (await todoInputs.next()).value || ""
      render()
    }
    if (key === "d") {
      todoList.splice(selected, 1)
      selected = Math.max(todoList.length - 1, selected)
      render()
    }
    if (key === "s") await save()
    if (key === "c") {
      await save()
      cursor.to(0, todoList.length + 1)
      exit(0)
    }
  }
}
args.then<void>(main)
