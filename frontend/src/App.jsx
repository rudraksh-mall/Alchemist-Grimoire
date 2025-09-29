import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className='text-3xl font-bold text-amber-300 bg-amber-950 p-4 text-center justify-center'>Hello World</h1>
    </>
  )
}

export default App
