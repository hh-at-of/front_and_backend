/*
 *
 * NOUN_VERB
 * verbNoun
 * except for events
 *
 * events: *ED ending - something happened
 */

import { v4 } from 'uuid';
import _ from 'lodash';
//import { config } from '../config.js';

export const initApp = () => ({
    type: 'APP_INIT'
});

export const doSomething = (some_arg) => ({
    type: 'DO_SOMETHING',
    some_arg
});
