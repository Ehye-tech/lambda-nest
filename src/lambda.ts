// lambda.ts
import { Handler, Context } from 'aws-lambda';
//AWS Lambda lets you run code without provisioning or managing servers.
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
// This library enables you to utilize AWS Lambda and Amazon API Gateway to respond to web and API requests using your existing Node.js
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const express = require('express');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

let cachedServer: Server;

async function bootstrapServer()
  // : Promise<Server> 
{
 if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp))
    nestApp.use(eventContext());
    await nestApp.init();
    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
 }
 return cachedServer;
}

export const handler: Handler = async (event: any, context: Context) => {
 cachedServer = await bootstrapServer();
 return proxy(cachedServer, event, context, 'PROMISE').promise;
}