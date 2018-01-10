import _ from 'lodash';

import { ajax } from 'rxjs/observable/dom/ajax';
import { Observable } from 'rxjs';
import { combineEpics } from 'redux-observable';
import { Client } from 'elasticsearch';
import { v4 } from 'uuid';


import * as a from '../actions';

// import {} from '../util';


const initAppEpic = (action$, store) => (
    action$
        .ofType('APP_INIT')
        .concatMap(action => Observable.of(a.doSomething(42)))
);


const getSomethingEpic = (action$, store) => (
    action$
    .ofType('GET_SOMETHING')
    .concatMap(action =>
        ajax.post('http://0.0.0.0:9999/get_something', action, {'Content-Type': 'application/json'})
            .map(response => a.propositionsReceived(response.response))
    )
);


const rootEpic = combineEpics(
    initAppEpic,
    getSomethingEpic,
);

export default rootEpic;
