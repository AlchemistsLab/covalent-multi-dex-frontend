import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import { routes } from './routes';
import store from './store';
import './assets/scss/black-dashboard-react.scss';
import './assets/css/nucleo-icons.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';

ReactDOM.render(
  <Fragment>
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <App>
            {routes.map(({ path, Component, exact }) => (
              <Route key={path ? path : ''} path={path} exact={exact}>
                {({ location, match }) => {
                  if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
                    let redirectPath = location.pathname;
                    while (redirectPath.endsWith('/')) {
                      redirectPath = redirectPath.substring(0, redirectPath.length - 1);
                    }
                    return (<Redirect to={redirectPath} />);
                  }
                  if (!path && match) {
                    if (match.isExact || location.key) {
                      match = null;
                    }
                    else {
                      if (routes.filter(route => route.path).findIndex(route => {
                        const routeSplited = route.path.split('/');
                        const pathSplited = location.pathname.split('/');
                        if (routeSplited.length !== pathSplited.length)
                          return false;
                        return routeSplited.findIndex((x, i) => !(x === pathSplited[i] || x.startsWith(':'))) > -1 ? false : true;
                      }) > -1) {
                        match = null;
                      }
                    }
                  }
                  if (match && match.url !== match.path && routes.findIndex(route => route.path === match.url) > -1) {
                    match = null;
                  }
                  return match && (<Component match={match} />);
                }}
              </Route>
            ))}
          </App>
        </Switch>
      </BrowserRouter>
    </Provider>
  </Fragment>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
