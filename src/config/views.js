import React from 'react';

//models
import {Route} from 'mobx-router';

//components
import Home from 'components/Home';
import Login from 'components/Login';

//layouts
import DefaultLayout from 'layouts/Default';

const views = {
  home: new Route({
    path: '/',
    component: <DefaultLayout><Home/></DefaultLayout>
  }),
  login: new Route({
    path: '/login',
    component: <DefaultLayout><Login/></DefaultLayout>
  })
};

export default views;
