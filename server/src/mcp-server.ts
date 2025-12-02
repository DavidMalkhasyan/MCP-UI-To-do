import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createUIResource } from "@mcp-ui/server";
import { z } from "zod";

interface Todo {
    id: string;
    text: string;
    done: boolean;
}

let todos: Todo[] = [
    { id: "1", text: "Learn TypeScript", done: false },
    { id: "2", text: "Build MCP app", done: false },
];

function getTodoListUI() {
    const htmlString = `
    <style>
      body { font-family: Arial, sans-serif; background: #f9f9f9; margin:0; padding:0; }
      .container { max-width: 500px; margin: auto; padding: 20px; }
      .todo-form, .todo-item {display: flex;gap: 10px;margin-bottom: 10px;align-items: center;}
      .todo-input { flex: 1; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; }
      .todo-btn { flex-shrink: 0;padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: white; }
      .todo-btn:hover { border-color: #888; }
      .todo-text {flex: 1;line-height: 32px;cursor: pointer;word-break: break-word;overflow-wrap: break-word;}
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
            <span class="todo-text ${todo.done ? "done" : ""}"
              onclick="toggleTodo('${todo.id}')">${todo.text}</span>
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
      // Function to post tool calls back to the MCP host
      function postTool(tool, params) {
        window.parent.postMessage({ type: "tool", payload: { toolName: tool, params } }, "*")
      }

      function addTodo() {
        const input = document.getElementById("newTodo");
        const text = input.value.trim();
        if (!text) return;
        postTool("todo_create", { text });
        input.value = "";
      }

      function toggleTodo(id) {
        postTool("todo_toggle", { id });
      }

      function deleteTodo(id) {
        postTool("todo_delete", { id });
      }

      function editTodo(id) {
        const item = document.getElementById("todo-" + id);
        const textSpan = item.querySelector(".todo-text");
        const oldText = textSpan.innerText;

        const input = document.createElement("input");
        input.value = oldText;
        input.className = "todo-input";

        const saveBtn = document.createElement("button");
        saveBtn.className = "todo-btn";
        saveBtn.innerText = "Save";
        saveBtn.onclick = save;

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "todo-btn";
        cancelBtn.innerText = "Cancel";
        cancelBtn.onclick = cancel;

        item.innerHTML = "";
        item.appendChild(input);
        item.appendChild(saveBtn);
        item.appendChild(cancelBtn);
        input.focus();

        function save() {
          const newText = input.value.trim();
          if (newText === "") {
            // If the user clears the text, treat it as a delete
            deleteTodo(id);
          } else {
            postTool("todo_edit", { id, text: newText });
          }
        }

        function cancel() {
          // Re-fetch the list to revert the UI state
          postTool("todo_list", {});
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        });
      }

      document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("newTodo")
          .addEventListener("keydown", (e) => {
            if (e.key === "Enter") addTodo();
          });
      });
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

const server = new McpServer({
    name: "weather",
    version: "1.0.0",
});

server.resource("todo_list", "mcp://todo_list", async () => ({
    content: [
        {
            type: "text",
            text: JSON.stringify(todos, null, 2),
        },
    ],
}));

server.tool(
    "todo_create",
    "Create a todo",
    { text: z.string() },
    async ({ text }) => {
        const id = Math.random().toString(36).substring(2, 9);
        todos.push({ id, text, done: false });
        return { resources: [getTodoListUI()] };
    }
);

server.tool(
    "todo_toggle",
    "Toggle a todo's completion status",
    { id: z.string() },
    async ({ id }) => {
        const t = todos.find((x) => x.id === id);
        if (t) t.done = !t.done;
        return { resources: [getTodoListUI()] };
    }
);

server.tool(
    "todo_delete",
    "Delete a todo",
    { id: z.string() },
    async ({ id }) => {
        todos = todos.filter((x) => x.id !== id);
        return { resources: [getTodoListUI()] };
    }
);

server.tool(
    "todo_edit",
    "Edit text of a todo",
    {
        id: z.string(),
        text: z.string(),
    },
    async ({ id, text }) => {
        const t = todos.find((x) => x.id === id);
        if (t) t.text = text;
        return { resources: [getTodoListUI()] };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("Todo MCP Server running on stdio");
}

main();
