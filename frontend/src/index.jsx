import 'semantic-ui-css/semantic.min.css';

import _ from 'lodash';
import axios from 'axios';
import React from 'react';
import parse from 'url-parse';
import logger from 'redux-logger';
import { Provider, connect } from 'react-redux';
import { ReactDOM, render, unmountComponentAtNode } from 'react-dom';
import { createEpicMiddleware } from 'redux-observable';
import { createStore, compose, applyMiddleware } from 'redux'
import { Accordion, Grid, Container, Sticky, Button } from 'semantic-ui-react';
//import { config, debug_state } from './config.js';

import * as a from './actions';
import rootReducer from './reducers';
import rootEpic from './observables'

const url = parse(document.location.href, true);


class App extends React.Component {
    constructor() {
        super();
    }

    componentDidMount() {
        store.dispatch(a.initApp());
    }

    render() {
        return (
            <div className='layout'>
                <Container>
                    EMPTY CONTAINER
                </Container>
            </div>
        )
    }
}

// explain ...
const AppContainer = connect(
    (state, ownProps) => ({ ...state })
)(App)


const middleware = [];
if (process.env.NODE_ENV != 'production') {
    middleware.push(logger)
};

const store = createStore(rootReducer,
                         {},
                         compose(applyMiddleware(createEpicMiddleware(rootEpic)),
                         applyMiddleware(...middleware),
                         )
                        );

// This should handle uncaught exceptions
// TODO: log the exception!
window.onerror = (errorMsg, url, lineNumber) => {
    try {
        const mainComponent = document.getElementById('main');
        unmountComponentAtNode(mainComponent);
    } catch (err) {}
    const el = document.getElementById('fallback-error-msg');
    el.className = 'show';
}

render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('main')
);

