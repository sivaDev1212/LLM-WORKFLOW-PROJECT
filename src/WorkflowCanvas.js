import React, { useCallback, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import './assets/css/workflow.css'

const InputNode = ({ data }) => (
  <div style={{ padding: 10, border: '1px solid #333', backgroundColor: '#f3f3f3' }}>
    <h4>Input Node</h4>
    <input
      type="text"
      placeholder="Enter your question"
      value={data.input || ''}
      onChange={(e) => data.onChange({ ...data, input: e.target.value })}
      onMouseDown={(e) => e.stopPropagation()} // Prevents React Flow from blocking input focus
    />
  </div>
);

const LLMNode = ({ data }) => (
  <div style={{ padding: 10, border: '1px solid #333', backgroundColor: '#f9dcdc' }}>
    <h4>LLM Node</h4>
    <input
      type="text"
      placeholder="Enter API Key"
      value={data.apiKey || ''}
      onChange={(e) => data.onChange({ ...data, apiKey: e.target.value })}
      onMouseDown={(e) => e.stopPropagation()}
    />
    <input
      type="text"
      placeholder="Enter Model"
      value={data.model || ''}
      onChange={(e) => data.onChange({ ...data, model: e.target.value })}
      onMouseDown={(e) => e.stopPropagation()}
    />
  </div>
);

const OutputNode = ({ data }) => (
  <div style={{ padding: 10, border: '1px solid #333', backgroundColor: '#d9f9dc' }}>
    <h4>Output Node</h4>
    <p>{data.output || 'Output will appear here...'}</p>
  </div>
);

const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useCallback(
    {
      inputNode: InputNode,
      llmNode: LLMNode,
      outputNode: OutputNode,
    },
    []
  );

  const addNode = (type) => {
    const newNode = {
      id: `${type}-${nodes.length + 1}`,
      type,
      position: { x: Math.random() * 250, y: Math.random() * 250 },
      data: {
        input: '',
        apiKey: '',
        model: '',
        output: '',
        onChange: (newData) => handleNodeDataChange(newNode.id, newData),
      },
      draggable: true,
      selectable: true,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleNodeDataChange = (id, newData) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: newData } : node))
    );
  };

  const runWorkflow = async () => {
    const inputNode = nodes.find((node) => node.type === 'inputNode');
    const llmNode = nodes.find((node) => node.type === 'llmNode');
    const outputNode = nodes.find((node) => node.type === 'outputNode');

    if (!inputNode?.data.input || !llmNode?.data.apiKey || !llmNode?.data.model) {
      toast.error('Please fill all required fields in the nodes');
      return;
    }

    try {
      debugger
      console.log("inputNode.data.input",inputNode.data.input);
      console.log("model",llmNode.data.model);
      
      
      const response = await axios.post('https://api.openai.com/v1/completions',  
      {
        model: llmNode.data.model,          
        prompt: inputNode.data.input,       
        max_tokens: 200,                     
        temperature: 0.5                     
      },
      {
        headers: {
          'Authorization': `Bearer ${llmNode.data.apiKey}`,  
          'Content-Type': 'application/json'
        }
      });
      const outputText = response.data.choices[0].text;

      
      setNodes((nds) =>
        nds.map((node) =>
          node.id === outputNode.id
            ? { ...node, data: { ...node.data, output: outputText } }
            : node
        )
      );
    } catch (error) {
      toast.error('Failed to get a response from the API');
      console.log("error",error);
      
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className='components'>
        <h2>components</h2>
        <button className='buttons' onClick={() => addNode('inputNode')}>Add Input Node</button>
        <button className='buttons' onClick={() => addNode('llmNode')}>Add LLM Node</button>
        <button className='buttons' onClick={() => addNode('outputNode')}>Add Output Node</button>
      </div>
      <div className='run-div'>
      <button className='run-btn' onClick={runWorkflow}>Run Workflow</button>
      </div>
      <div style={{ height: 500, border: '1px solid #ccc', marginTop: 20 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
