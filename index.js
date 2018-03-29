'use strict';

const wrap = require('word-wrap')
const axios = require('axios')
const jsonpath = require('jsonpath')
const xpath = require('xpath')
const xmldom = require('xmldom')
const dom = xmldom.DOMParser

const get = url => axios(url).then(res => res.data)

const json = (data, path) => jsonpath
  .apply(data, path, value => `${value}`)
  .map(item => item ? item.value : null)

const xml = (data, path) => xpath
  .select(path, new dom().parseFromString(data))
  .map(item => item.firstChild ? item.firstChild.data : null)

const source = (data, query, type) => type === 'json' ? json(data, query) : xml(data, query)
const clean = (items)  => items.filter(item => item)
const keep = (items, value) => {
  if (!value) {
    return items
  }
  let regex = RegExp(value, 'g')
  return items.filter(item => regex.test(item))
}
const prefix = (items, value) => items.map(item => `${value}${item}`)
const find = (items, value, change) => {
  if (!value) {
    return items
  }
  let regex = RegExp(value, 'g')
  return items.map(item => item.replace(RegExp(value, 'g'), change))
}
const resize = (items, _wrap, _width) => _wrap ? items.map(item => wrap(item, { width: _width, indent: '' })) : items
const join = (items, value) => items.join(value.replace(/\\n/g, '\n'))
const plain = (data, type) => type === 'json' ? JSON.stringify(data) : data

module.exports = (options) => {
  let request = get(options.url)
  if(options.query) {
    return request
      .then(data => source(data, options.query, options.type))
      .then(items => clean(items))
      .then(items => keep(items, options.keep))
      .then(items => prefix(items, options.prefix))
      .then(items => find(items, options.find, options.change))
      .then(items => resize(items, options.wrap, options.width))
      .then(items => join(items, options.separator))
  } else {
    return request
      .then(data => plain(data, options.type))
  }
}