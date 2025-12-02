import { useEffect, useState } from 'react'
import axios from 'axios'
import { UIResourceRenderer, UIActionResult, isUIResource } from '@mcp-ui/client'

interface MCPResource {
  type: string
  resource: any
}

const SERVER = 'http://localhost:4000'

function App() {
  const [mcpResource, setMcpResource] = useState<MCPResource | null>(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${SERVER}/mcp/todo_list`)
      setMcpResource(res.data.resource)
    } catch (err) {
      console.error('Error fetching todos:', err)
    }
  }

  const handleUIAction = async (result: UIActionResult) => {
    if (result.type === 'tool') {
      const { toolName, params } = result.payload
      try {
        await axios.post(`${SERVER}/mcp/${toolName}`, params)
        fetchTodos()
      } catch (err) {
        console.error('Error executing tool action:', err)
      }
    }
    return { status: 'handled' }
  }

  if (!mcpResource) return <p>Loading...</p>

  if (!isUIResource(mcpResource)) return <p>Unsupported resource</p>

  return (
    <div style={{ padding: 20 }}>
      <h1>MCP Todo List</h1>
      <UIResourceRenderer
        resource={mcpResource.resource}
        onUIAction={handleUIAction}
        htmlProps={{
          autoResizeIframe: true
        }}
      />
    </div>
  )
}

export default App
