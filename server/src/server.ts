import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createUIResource } from "@mcp-ui/server";

const app = express();
app.use(cors());
app.use(bodyParser.json());

interface Todo {
    id: string;
    text: string;
    done: boolean;
}
let todos: Todo[] = [
    { id: "1", text: "Learn TypeScript", done: false },
    { id: "2", text: "Build MCP app", done: false },
];

function todoListResource(): any {
    const htmlString = `
    <style>
      body { font-family: Arial, sans-serif; background: #f9f9f9; margin:0; padding:0; }
      .container { max-width: 500px; margin: auto; padding: 20px; }
      .todo-form, .todo-item {display: flex;gap: 10px;margin-bottom: 10px;align-items: center;}
      .todo-input { flex: 1; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; }
      .todo-btn { flex-shrink: 0;padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; }
      .todo-btn:hover { border-color: #888; }
      ..todo-text {flex: 1;line-height: 32px;cursor: pointer;word-break: break-word;overflow-wrap: break-word;}
      .todo-text.done { text-decoration: line-through; color: #888; }
    </style>

    <div class="container">
      <div class="todo-form">
        <input id="newTodo" class="todo-input" placeholder="New task"/>
        <button class="todo-btn" onclick="addTodo()">Add</button>
      </div>
      <div id="todoList">
        ${todos
            .map(
                (todo) => `
          <div class="todo-item" id="todo-${todo.id}">
            <span class="todo-text ${
                todo.done ? "done" : ""
            }" onclick="toggleTodo('${todo.id}')">${todo.text}</span>
            <button class="todo-btn" onclick="editTodo('${
                todo.id
            }')">Edit</button>
            <button class="todo-btn" onclick="deleteTodo('${
                todo.id
            }')">Delete</button>
          </div>
        `
            )
            .join("")}
      </div>
    </div>

      <script>
          function postTool(tool, params) {
            window.parent.postMessage({ type: 'tool', payload: { toolName: tool, params } }, '*')
          }

          function addTodo() {
            const input = document.getElementById('newTodo')
            const text = input.value.trim()
            if(!text) return
            postTool('todo_create', { text })
            input.value = ''
          }

          function toggleTodo(id) {
            postTool('todo_toggle', { id })
          }

          function deleteTodo(id) {
            postTool('todo_delete', { id })
          }

          function editTodo(id) {
            const item = document.getElementById('todo-' + id)
            const textSpan = item.querySelector('.todo-text')
            const oldText = textSpan.innerText

            const input = document.createElement('input')
            input.value = oldText
            input.className = 'todo-input'

            const saveBtn = document.createElement('button')
            saveBtn.className = 'todo-btn'
            saveBtn.innerText = 'Save'
            saveBtn.onclick = save

            const cancelBtn = document.createElement('button')
            cancelBtn.className = 'todo-btn'
            cancelBtn.innerText = 'Cancel'
            cancelBtn.onclick = cancel

            item.innerHTML = ''
            item.appendChild(input)
            item.appendChild(saveBtn)
            item.appendChild(cancelBtn)
            input.focus()

            function save() {
              const newText = input.value.trim()
              if(newText === '') {
                deleteTodo(id)
              } else {
                postTool('todo_edit', { id, text: newText })
              }
            }

            function cancel() {
              textSpan.innerText = oldText
              item.innerHTML = ''
              item.appendChild(textSpan)
              const editBtn = document.createElement('button')
              editBtn.className = 'todo-btn'
              editBtn.innerText = 'Edit'
              editBtn.onclick = () => editTodo(id)
              const delBtn = document.createElement('button')
              delBtn.className = 'todo-btn'
              delBtn.innerText = 'Delete'
              delBtn.onclick = () => deleteTodo(id)
              item.appendChild(editBtn)
              item.appendChild(delBtn)
              if(oldText !== '') item.querySelector('.todo-text').classList.toggle('done', false)
            }

            input.addEventListener('keydown', (e) => {
              if(e.key === 'Enter') save()
              if(e.key === 'Escape') cancel()
            })
          }

          document.addEventListener('DOMContentLoaded', () => {
            const newTodoInput = document.getElementById('newTodo')
            newTodoInput.addEventListener('keydown', (e) => {
              if(e.key === 'Enter') addTodo()
            })
          })
        </script>
          `;

    return createUIResource({
        uri: "ui://todo/list",
        content: { type: "rawHtml", htmlString },
        encoding: "text",
        uiMetadata: {
            "preferred-frame-size": ["500px", "600px"],
            "initial-render-data": {},
        },
    });
}

app.post("/mcp/todo_create", (req, res) => {
    const { text } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    todos.push({ id, text, done: false });
    res.json({ status: "ok", resource: todoListResource() });
});

app.post("/mcp/todo_toggle", (req, res) => {
    const { id } = req.body;
    const todo = todos.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
    res.json({ status: "ok", resource: todoListResource() });
});

app.post("/mcp/todo_delete", (req, res) => {
    const { id } = req.body;
    todos = todos.filter((t) => t.id !== id);
    res.json({ status: "ok", resource: todoListResource() });
});

app.post("/mcp/todo_edit", (req, res) => {
    const { id, text } = req.body;
    const todo = todos.find((t) => t.id === id);
    if (todo && text.trim() !== "") todo.text = text;
    res.json({ status: "ok", resource: todoListResource() });
});

app.get("/mcp/todo_list", (_, res) => {
    res.json({ status: "ok", resource: todoListResource() });
});

const PORT = 4000;
app.listen(PORT, () =>
    console.log(`MCP Todo server running on http://localhost:${PORT}`)
);
