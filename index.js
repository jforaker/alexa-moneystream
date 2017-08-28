'use strict';
require('request');
const Alexa = require('alexa-sdk');
const rp = require('request-promise');

const APP_ID = process.env.APP_ID;

const SKILL_NAME = `MoneyStream`;
const GET_LATEST_MESSAGE = `Here's the latest from MoneyStream: `;
const HELP_MESSAGE = `You can say get latest or get my news, or you can say exit.`;
const HELP_REPROMPT = `What can I help you with?`;
const STOP_MESSAGE = `Goodbye!`;

const options = {
  uri: process.env.API_URL,
  json: true
};

const articleOnly = (c) => c.baselink && c.card_type === 'article';
const headlines = (c) => c.baselink.headline;
const commaSeparated = (prev, curr) => prev + ', <break time="0.7s"/> ' + curr;

function run() {
  return rp(options)
    .then(response => {
      return response.cards
        .filter(articleOnly)
        .map(headlines)
        .slice(0, 5) // return top 5 article headlines
        .reduce(commaSeparated)
    })
    .catch(err => {
      console.warn('error fetching', err);
      return err;
    });
}

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================
const handlers = {
  'LaunchRequest': function () {
    this.emit('GetHeadlinesIntent');
  },
  'GetHeadlinesIntent': function () {
    run().then(response => {
      const speechOutput = GET_LATEST_MESSAGE + response;
      return this.emit(':tellWithCard', speechOutput, SKILL_NAME)
    }).catch(e => {
      if (e) this.emit(':tell', `oops! ${e}`);
    })
  },
  'AMAZON.HelpIntent': function () {
    this.emit(':ask', HELP_MESSAGE, HELP_REPROMPT);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', STOP_MESSAGE);
  }
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};