import _ from 'lodash';

import { ajax } from 'rxjs/observable/dom/ajax';
import { Observable } from 'rxjs';
import { Client } from 'elasticsearch';
import { loggingServiceUrl, pushDataChannelUrl } from '../env';
import { v4 } from 'uuid';
//import { config } from '../config';

var client = new Client({
  host: loggingServiceUrl
});

const mapEvents = config['logging']['types'];

const pushDataChannelHeader = {
    'Accept': 'application/vnd.kafka.v1+json, application/vnd.kafka+json, application/json',
    'Content-Type': 'application/vnd.kafka.json.v1+json'
};

const bulkInsertEs = (docs) => {
    console.log('bulkInsert', docs);
    return ({
        index: config['logging']['settings']['index'],
        type: config['logging']['settings']['type'],
        body: [].concat.apply([], docs.map(d => ([{index: {}}, d])))
    })
};

const bulkInsertPushDataChannel = (docs) => {
    console.log('bulkInsert', docs);
    const payload = {
        'records': docs.map(d => ({key: d.dateCreated.toString().concat('_', v4()), value: d}))
    }
    console.log('bulkInsert payload', payload);
    return payload;
};

const parseArticle = ({article_id, ATLScore}) => ({article_id, ATLScore});

const parseArticles = (articles) => (articles.map((article) => parseArticle(article)));

const parseProduct = ({product_id, scores, articles}) => ({product_id, scores, articles: (articles ? parseArticles(articles) : null)});

const parseProducts = (products) => (products.map((product) => parseProduct(product)));

const parser = (value, key) => {
    switch(key) {
        case 'product':
            return parseProduct(value);
        case 'products':
            return parseProducts(value);
        case 'articles':
            return parseArticles(value);
        case 'article':
            return parseArticle(value);
        case 'queryProducts':
            return parseProducts(value);
        default:
            return value;
    }
};

const createEvent = (loggingHeader, action) => {
    var content = {...action};
    delete content.type;
    delete content.dateCreated;
    const mapping = mapEvents[action.type]
    mapping['excludeFields'].forEach(e => delete content[e]);
    content = _.mapValues(content, parser)
    return {...loggingHeader, ...mapping['add'], content, dateCreated: action.dateCreated}
};

export const extLoggerEpic = (action$, store) => (
    action$.filter(action => action.type in mapEvents)
    .map(action => createEvent(store.getState().loggingHeader, action))
    .bufferTime(1000)
    .filter(action => {
        return (action.length > 0 ? true : false);
    })
    .mergeMap(action => {
        client.bulk(bulkInsertEs(action))
        const payload = JSON.stringify(bulkInsertPushDataChannel(action));
        return ajax.post(pushDataChannelUrl, payload, pushDataChannelHeader);
    })
    .map(response => ({type: 'EVENT_LOGGED'}))
);
