import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { SocketProvider } from "./providers/Socket";
import { PeerProvider } from "./providers/Peer";
import Room from "./pages/Room";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
