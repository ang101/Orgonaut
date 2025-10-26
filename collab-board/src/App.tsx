import React, { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { useBoardStore } from './store';

function App() {
  const loadFromStorage = useBoardStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Toolbar />
      <div style={{ paddingTop: '80px', height: '100%' }}>
        <Canvas />
      </div>
    </div>
  );
}

export default App;
