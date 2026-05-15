import { Route, Routes } from "react-router-dom";
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import RoomPage from "./pages/RoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/j/:roomId" element={<RoomPage />} />
    </Routes>
  );
}
