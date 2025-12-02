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

export function todoListResource() {
    return createUIResource({
        uri: "ui://todo/list",
        content: {
            type: "json",
            ui: {
                type: "container",
                style: { display: "flex", flexDirection: "column", gap: 10 },
                items: [
                    {
                        type: "container",
                        style: { display: "flex", gap: 10 },
                        items: [
                            {
                                type: "input",
                                id: "newTodo",
                                placeholder: "New task",
                                style: {
                                    flex: 1,
                                    padding: "6px 8px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                },
                            },
                            {
                                type: "button",
                                text: "Add",
                                style: {
                                    padding: "6px 10px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                },
                                onClick: {
                                    type: "tool",
                                    toolName: "todo_create",
                                    paramsFrom: ["newTodo"],
                                },
                            },
                        ],
                    },
                    ...todos.map((todo) => ({
                        type: "container",
                        style: {
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        },
                        items: [
                            {
                                type: "text",
                                text: todo.text,
                                style: todo.done
                                    ? {
                                          textDecoration: "line-through",
                                          color: "#888",
                                          flex: 1,
                                      }
                                    : { flex: 1 },
                                onClick: {
                                    type: "tool",
                                    toolName: "todo_toggle",
                                    params: { id: todo.id },
                                },
                            },
                            {
                                type: "button",
                                text: "Edit",
                                style: {
                                    padding: "6px 10px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                },
                                onClick: {
                                    type: "tool",
                                    toolName: "todo_edit_prompt",
                                    params: { id: todo.id },
                                },
                            },
                            {
                                type: "button",
                                text: "Delete",
                                style: {
                                    padding: "6px 10px",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                },
                                onClick: {
                                    type: "tool",
                                    toolName: "todo_delete",
                                    params: { id: todo.id },
                                },
                            },
                        ],
                    })),
                ],
            },
        },
        encoding: "json",
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
