# Todo.txt editor

View and edit your `todo.txt` file from the terminal.

The main reason for this is having an todo app that can be shared through source control via a human-readable text file.

## Usage:

Any of these:

```
npx todo-editor
yarn todo-editor
pnpm dlx todo-editor
```

```
Usage: todo-editor [options] [todo-file]

A simple viewer and editor for your todo.txt files

Arguments:
  todo-file      todo file to use (default: ./todo.txt)

Options:
  -V, --version  output the version number
  -h, --help     display help for command
```

### Format:

```
[] this todo is not done
[x] this todo is
[X] this todo is also done
```
