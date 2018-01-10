import { combineReducers } from 'redux'
//import {config} from '../config';
import { v4 } from 'uuid';
import _ from 'lodash';


const myreducer = (state, action) => {
    // this block defines the intitial state
    if (state === undefined) {
        return {
            a_list: []
        }
    }

    switch(action.type) {
        case 'CLEAR':
            return {...state, a_list: []}
        default:
            return state;
    }
};


const reducers = combineReducers({
    myreducer
});


const rootReducer = reducers;

export default rootReducer
