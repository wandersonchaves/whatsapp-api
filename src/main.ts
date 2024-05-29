/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author wandersonchaves                                                             │
 * │ @filename main.ts                                                            │
 * │ Developed by: Wanderson Chaves                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
 * │ Contact: contato@whatsapp.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Wanderson Chaves 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/wandersonchaves/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * │ @function initWA @param undefined                                            │
 * | @function bootstrap @param undefined                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import 'express-async-errors'

import {ConfigService, HttpServer} from './config/env.config'

import {AppModule} from './app.module'
import {Logger} from './config/logger.config'
import {onUnexpectedError} from './config/error.config'

const context = new Map<string, any>()

export async function bootstrap() {
  await AppModule(context)

  const configService = context.get('module:config') as ConfigService

  const logger = new Logger(configService, 'SERVER')

  context.get('module:logger').info('INITIALIZER')
  context.set('server:logger', logger)

  const httpServer = configService.get<HttpServer>('SERVER')

  const PORT = httpServer.PORT || 8084
  const APP_URL = process.env.APP_URL || 'http://localhost:8084'

  context.get('app').listen(PORT, () => {
    logger.log('HTTP' + ' - ON: ' + PORT)
    new Logger(configService, 'Swagger Docs').warn(
      `
      ┌──────────────────────────────┐
      │         Swagger Docs         │
      │  ${APP_URL}/docs  │
      └──────────────────────────────┘`.replace(/^ +/gm, '  '),
    )
  })

  onUnexpectedError(configService)
}

bootstrap()

process.on('SIGINT', async () => {
  await context.get('app').close()
  context.get('module:logger').warn('APP MODULE - OFF')
  context.get('server:logger').warn('HTTP - OFF')
  process.exit(0)
})
