'use strict';
require("request");
const Alexa = require('alexa-sdk');
const rp = require('request-promise');

const APP_ID = process.env.APP_ID;

const SKILL_NAME = `MoneyStream`;
const GET_LATEST_MESSAGE = `Here's the latest from MoneyStream: `;
const HELP_MESSAGE = `You can say get latest, or, you can say exit... What can I help you with?`;
const HELP_REPROMPT = `What can I help you with?`;
const STOP_MESSAGE = `Goodbye!`;

const options = {
  uri: process.env.API_URL,
  json: true
};

const articleOnly = (c) => c.baselink && c.card_type === 'article';
const headlines = (c) => c.baselink.headline;

function run() {
  return rp(options)
    .then(function (response) {
      if (response.cards && response.cards.length) {
        return response.cards
          .filter(articleOnly)
          .map(headlines)
          .slice(0, 5) // return top 5 article headlines
      }
    })
    .catch(function (err) {
      console.warn('error fetching', err);
      return err;
    });
}

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================
exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'LaunchRequest': function () {
    this.emit('GetHeadlinesIntent');
  },
  'GetHeadlinesIntent': function () {
    run().then(res => {
      const five = res.join('. <break time="0.7s"/> ');
      const speechOutput = GET_LATEST_MESSAGE + five;
      return this.emit(':tellWithCard', speechOutput, SKILL_NAME, five)
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