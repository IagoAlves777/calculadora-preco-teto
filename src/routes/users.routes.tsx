import React from 'react';

import { Route, Routes } from 'react-router-dom';

import Dashboard from '@pages/Dashboard';
import Calculator from '@pages/Calculator';

const UsersRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/calculator" element={<Calculator />} />
    <Route path="/calculator/:ticker" element={<Calculator />} />
  </Routes>
);

export default UsersRoutes;
