import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SelectionPage, TimetableEditor } from '@/features/academics/timetable_management';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Timetable Management Routes */}
        <Route path="/timetable" element={<SelectionPage />} />
        <Route path="/timetable/editor" element={<TimetableEditor />} />

        {/* Default redirect to timetable */}
        <Route path="/" element={<Navigate to="/timetable" replace />} />

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/timetable" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
