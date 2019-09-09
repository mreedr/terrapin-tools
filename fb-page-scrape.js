#!/usr/bin/env node

/**
 * Module dependencies.
 */
let program = require('commander');
let axios = require('axios');
let pasync = require('pasync');

program
  .option('-e, --event', 'is an event')
  .option('-g, --group [group]', 'fb group', '')
  .parse(process.argv);

let group = program.group;
let isEvent = !!program.event;
if (!group) throw Error('Provide a --group lil bitch');

// ResonanceMusicFest

let access_token = process.env.FB_TOKEN;
let baseUrl = `https://graph.facebook.com`;
let groupUrl = `${baseUrl}/${group}/feed?access_token=${access_token}`;

let totalFilters = 0;
(async () => {
  try {
    await eachPage(groupUrl, eachPost);
  } catch (e) {
    console.error(e);
  } finally {
    console.log(totalFilters);
    process.exit();
  }
})();

function filterMessage(message) {
  return message && message.includes('ticket') && totalFilters++;
}

async function eachPost(posts) {

  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    if (!filterMessage(post.message)) continue;

    console.log('');
    console.log('v--------v');
    console.log(post.message);
    await eachCompanyPage(`${baseUrl}/${post.id}/comments?access_token=${access_token}`, printArray);
    console.log('^--------^');
    console.log('');

  }
}

function printArray(posts) {
  console.log(' >-------');
  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    if(filterMessage(post.message)) {
      console.log('       ', post.message);
    }
  }
}

async function eachPage(url, func) {
  let hasNext = true;

  do {
    let res = await axios.get(url);
    let { paging, data: posts } = res.data;

    if (!paging) { hasNext = false; break; }

    let after = paging.cursors.after;
    url = paging.next || `${url}&after=${after}`;

    await func(posts);
  } while (hasNext);
}

async function eachEventPage(url, func) {
  let hasNext = true;

  do {
    let res = await axios.get(url);
    let { paging, data } = res.data;

    if (!paging) { hasNext = false; break; }
    url = paging.next;

    let posts = data;
    await func(posts);

  } while (hasNext);
}

async function eachCompanyPage(url, func) {
  let after = '';
  let hasNext = true;

  do {
    let res = await axios.get(`${url}&after=${after}`);
    let { paging, data } = res.data;

    if (!paging) { hasNext = false; break; }
    after = paging.cursors.after;

    let posts = data;
    await func(posts);

  } while (hasNext);
}
