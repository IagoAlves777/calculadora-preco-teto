import React from 'react';

import { BrowserRouter } from 'react-router-dom';

import UsersRoutes from './users.routes';

const Router: React.FC = () => (
  <BrowserRouter>
    <UsersRoutes />
  </BrowserRouter>
);

export default Router;
