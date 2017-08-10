import React from 'react';

//models
import {Route} from 'mobx-router';

//components
import Home from 'components/Home';

const views = {
  home: new Route({
    path: '/',
    component: <Home/>
  })
};

export default views;
